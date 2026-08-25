import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invocarFuncion, supabase } from "../lib/supabase";
import { IPADE_LOGO_URL } from "../lib/constantes";
import Cronometro from "../componentes/Cronometro";
import PanelAdmin from "../componentes/PanelAdmin";
import type { Usuario } from "../lib/auth";

interface Grupo {
  id: string;
  nombre: string;
  semilla: number;
  fase_actual: number;
  dag_revelado: boolean;
  creado_en: string;
}

interface EquipoResumen {
  id: string;
  nombre: string;
  creditos_restantes: number;
  consultas: number;
  diagnostico: boolean;
}

interface Props {
  usuario: Usuario;
  onCerrar: () => void;
}

export default function VistaProfesor({ usuario, onCerrar }: Props) {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoActivo, setGrupoActivo] = useState<Grupo | null>(null);
  const [equipos, setEquipos] = useState<EquipoResumen[]>([]);

  const [nombreGrupo, setNombreGrupo] = useState("");
  const [semilla, setSemilla] = useState(String(Math.floor(Math.random() * 100000)));
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    supabase
      .from("grupos")
      .select("*")
      .order("creado_en", { ascending: false })
      .then(({ data }) => {
        if (data) setGrupos(data as Grupo[]);
      });
  }, []);

  useEffect(() => {
    if (!grupoActivo) return;

    async function cargarEquipos() {
      const { data: eqs } = await supabase
        .from("equipos")
        .select("id, nombre, creditos_restantes")
        .eq("grupo_id", grupoActivo!.id);

      if (!eqs) return;

      const resumen: EquipoResumen[] = [];
      for (const eq of eqs) {
        const { count: consultas } = await supabase
          .from("consultas")
          .select("id", { count: "exact", head: true })
          .eq("equipo_id", eq.id);

        const { count: diags } = await supabase
          .from("diagnosticos")
          .select("id", { count: "exact", head: true })
          .eq("equipo_id", eq.id);

        resumen.push({
          id: eq.id,
          nombre: eq.nombre,
          creditos_restantes: eq.creditos_restantes,
          consultas: consultas ?? 0,
          diagnostico: (diags ?? 0) > 0,
        });
      }
      setEquipos(resumen);
    }
    cargarEquipos();

    const canal = supabase
      .channel(`prof-grupo-${grupoActivo.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipos", filter: `grupo_id=eq.${grupoActivo.id}` },
        () => cargarEquipos(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "consultas" },
        () => cargarEquipos(),
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [grupoActivo]);

  async function crearGrupo(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreGrupo.trim()) return;
    setCreando(true);
    setError(null);

    try {
      const data = await invocarFuncion<{ grupo_id: string; total_casos: number }>(
        "generar-muestra",
        {
          nombre: nombreGrupo.trim(),
          semilla: Number(semilla),
          clave_profesor: usuario.email,
        },
      );

      const { data: nuevoGrupo } = await supabase
        .from("grupos")
        .select("*")
        .eq("id", data.grupo_id)
        .single();

      if (nuevoGrupo) {
        setGrupos((prev) => [nuevoGrupo as Grupo, ...prev]);
        setGrupoActivo(nuevoGrupo as Grupo);
      }
      setNombreGrupo("");
      setSemilla(String(Math.floor(Math.random() * 100000)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreando(false);
    }
  }

  async function revelarDAG() {
    if (!grupoActivo) return;
    await supabase
      .from("grupos")
      .update({ dag_revelado: true })
      .eq("id", grupoActivo.id);
    setGrupoActivo({ ...grupoActivo, dag_revelado: true });
  }

  function copiarCodigo() {
    if (!grupoActivo) return;
    navigator.clipboard.writeText(grupoActivo.id);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="min-h-screen bg-navy-50 proyectada">
      <header className="bg-navy-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={IPADE_LOGO_URL} alt="IPADE" className="h-9 w-9 object-contain" />
          <div>
            <h1 className="text-lg font-bold font-display">Panel del Profesor</h1>
            <p className="text-navy-200 text-xs">Simuladores IPADE / Direccion de Operaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {grupoActivo && (
            <Cronometro
              inicioMs={new Date(grupoActivo.creado_en).getTime()}
            />
          )}
          <span className="text-xs text-navy-200">{usuario.email}</span>
          <button
            onClick={() => navigate("/")}
            className="text-xs text-navy-200 hover:text-white underline transition-colors duration-200"
          >
            Simuladores
          </button>
          <button
            onClick={onCerrar}
            className="text-xs text-navy-200 hover:text-white underline transition-colors duration-200"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
            <h2 className="text-sm font-semibold text-navy-700 mb-4">Crear nuevo grupo</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-3">
                {error}
              </div>
            )}

            <form onSubmit={crearGrupo} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Nombre del grupo
                </label>
                <input
                  type="text"
                  value={nombreGrupo}
                  onChange={(e) => setNombreGrupo(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500"
                  placeholder="Ej: MEDEX X1, Sesion 3"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Semilla (numero)
                </label>
                <input
                  type="number"
                  value={semilla}
                  onChange={(e) => setSemilla(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-dato transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creando}
                className="w-full bg-navy-700 text-white font-medium py-2 px-4 rounded-xl text-sm hover:bg-navy-800 transition-all duration-200 disabled:opacity-50"
              >
                {creando ? "Generando 103 casos..." : "Crear grupo y generar datos"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
            <h3 className="text-sm font-semibold text-navy-700 mb-3">Grupos existentes</h3>
            {grupos.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">Sin grupos</p>
            ) : (
              <div className="space-y-2">
                {grupos.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGrupoActivo(g)}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-200 ${
                      grupoActivo?.id === g.id
                        ? "bg-navy-50 border border-navy-200"
                        : "bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <div className="font-medium text-neutral-700">{g.nombre}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Semilla: {g.semilla} &middot;{" "}
                      {new Date(g.creado_en).toLocaleDateString("es-MX")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {usuario.rol === "superadmin" && (
            <PanelAdmin usuario={usuario} />
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!grupoActivo ? (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center">
              <p className="text-neutral-400">Seleccione o cree un grupo para comenzar</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-navy-700">{grupoActivo.nombre}</h2>
                    <p className="text-xs text-neutral-500">Semilla: {grupoActivo.semilla}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copiarCodigo}
                      className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-200 transition-all duration-200"
                    >
                      {copiado ? "Copiado" : "Copiar codigo de grupo"}
                    </button>
                    {!grupoActivo.dag_revelado && (
                      <button
                        onClick={revelarDAG}
                        className="px-3 py-1.5 bg-gold-100 text-gold-800 rounded-lg text-xs font-medium hover:bg-gold-200 transition-all duration-200"
                      >
                        Revelar DAG
                      </button>
                    )}
                    {grupoActivo.dag_revelado && (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                        DAG revelado
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-3 font-dato text-xs text-neutral-600 select-all">
                  {grupoActivo.id}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
                <h3 className="text-sm font-semibold text-navy-700 mb-3">Cronometro de sesion</h3>
                <Cronometro
                  inicioMs={new Date(grupoActivo.creado_en).getTime()}
                  mostrarFases
                />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
                <h3 className="text-sm font-semibold text-navy-700 mb-4">
                  Equipos ({equipos.length})
                </h3>
                {equipos.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-6">
                    Ningun equipo se ha unido todavia. Comparta el codigo de grupo.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-left">
                          <th className="pb-2 font-medium text-neutral-500">Equipo</th>
                          <th className="pb-2 font-medium text-neutral-500 text-center">Creditos</th>
                          <th className="pb-2 font-medium text-neutral-500 text-center">Consultas</th>
                          <th className="pb-2 font-medium text-neutral-500 text-center">Diagnostico</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipos.map((eq) => (
                          <tr key={eq.id} className="border-b border-neutral-100">
                            <td className="py-2.5 font-medium text-neutral-700">{eq.nombre}</td>
                            <td className="py-2.5 text-center">
                              <span
                                className={`font-dato font-medium ${
                                  eq.creditos_restantes <= 3
                                    ? "text-red-600"
                                    : eq.creditos_restantes <= 6
                                      ? "text-gold-800"
                                      : "text-navy-700"
                                }`}
                              >
                                {eq.creditos_restantes}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-dato">{eq.consultas}</td>
                            <td className="py-2.5 text-center">
                              {eq.diagnostico ? (
                                <span className="inline-block w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs leading-5 font-bold">
                                  S
                                </span>
                              ) : (
                                <span className="inline-block w-5 h-5 rounded-full bg-neutral-100 text-neutral-400 text-xs leading-5">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
