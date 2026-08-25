import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase, invocarFuncion } from "../lib/supabase";
import { IPADE_LOGO_URL } from "../lib/constantes";
import {
  segmentar,
  correlacionar,
  CAMPOS_CATEGORIA,
  CAMPOS_NUMERICOS,
  type Caso,
  type CampoCategoria,
  type CampoNumerico,
  type ResultadoPareto,
  type ResultadoCorrelacion,
} from "../lib/consultas-locales";
import Cronometro from "../componentes/Cronometro";
import Bitacora from "../componentes/Bitacora";
import GraficaPareto from "../componentes/GraficaPareto";
import GraficaDispersion from "../componentes/GraficaDispersion";

type TipoConsulta = "segmentar" | "correlacionar" | "intervenir";

interface Equipo {
  id: string;
  grupo_id: string;
  nombre: string;
  creditos_restantes: number;
}

interface ConsultaRegistro {
  id: string;
  tipo: string;
  hipotesis: string;
  parametros: Record<string, unknown>;
  costo: number;
  creada_en: string;
}

const NODOS_INTERVENCION = [
  { valor: "error_captura", etiqueta: "Error de captura" },
  { valor: "reintentos", etiqueta: "Reintentos" },
  { valor: "espera_crop", etiqueta: "Espera CROP" },
  { valor: "capacitacion_ejecutivo", etiqueta: "Capacitacion del ejecutivo" },
];

export default function VistaEquipo() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [consultas, setConsultas] = useState<ConsultaRegistro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>("segmentar");
  const [hipotesis, setHipotesis] = useState("");
  const [campoSeg, setCampoSeg] = useState<CampoCategoria>("sucursal");
  const [campoX, setCampoX] = useState<CampoNumerico>("reintentos");
  const [campoY, setCampoY] = useState<CampoNumerico>("dias_ciclo");
  const [nodoInt, setNodoInt] = useState("error_captura");
  const [valorInt, setValorInt] = useState("");
  const [ejecutando, setEjecutando] = useState(false);

  const [resultadoPareto, setResultadoPareto] = useState<ResultadoPareto | null>(null);
  const [resultadoCorr, setResultadoCorr] = useState<ResultadoCorrelacion | null>(null);
  const [resultadoInt, setResultadoInt] = useState<Record<string, unknown> | null>(null);

  const [inicioMs, setInicioMs] = useState<number | null>(null);

  const registrarEquipo = useCallback(async () => {
    if (!grupoId) return;
    const nombreParam = searchParams.get("nombre");
    if (!nombreParam) return;

    const { data: existente } = await supabase
      .from("equipos")
      .select("*")
      .eq("grupo_id", grupoId)
      .eq("nombre", nombreParam)
      .maybeSingle();

    if (existente) {
      setEquipo(existente as Equipo);
      return;
    }

    const { data, error: insertErr } = await supabase
      .from("equipos")
      .insert({ grupo_id: grupoId, nombre: nombreParam })
      .select()
      .single();

    if (insertErr) {
      setError("No se pudo registrar el equipo: " + insertErr.message);
      return;
    }
    setEquipo(data as Equipo);
  }, [grupoId, searchParams]);

  useEffect(() => {
    async function cargar() {
      if (!grupoId) return;
      setCargando(true);

      const { data: grupo } = await supabase
        .from("grupos")
        .select("id, creado_en")
        .eq("id", grupoId)
        .single();

      if (!grupo) {
        setError("Grupo no encontrado");
        setCargando(false);
        return;
      }

      setInicioMs(new Date(grupo.creado_en).getTime());

      const { data: casosData } = await supabase
        .from("casos")
        .select("*")
        .eq("grupo_id", grupoId);

      if (casosData) setCasos(casosData as Caso[]);

      await registrarEquipo();
      setCargando(false);
    }
    cargar();
  }, [grupoId, registrarEquipo]);

  useEffect(() => {
    if (!equipo) return;
    supabase
      .from("consultas")
      .select("id, tipo, hipotesis, parametros, costo, creada_en")
      .eq("equipo_id", equipo.id)
      .order("creada_en", { ascending: true })
      .then(({ data }) => {
        if (data) setConsultas(data as ConsultaRegistro[]);
      });
  }, [equipo]);

  useEffect(() => {
    if (!equipo) return;
    const canal = supabase
      .channel(`equipo-${equipo.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "equipos", filter: `id=eq.${equipo.id}` },
        (payload) => setEquipo(payload.new as Equipo),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "consultas", filter: `equipo_id=eq.${equipo.id}` },
        (payload) => setConsultas((prev) => [...prev, payload.new as ConsultaRegistro]),
      )
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [equipo]);

  async function ejecutarConsulta(e: React.FormEvent) {
    e.preventDefault();
    if (!equipo || !hipotesis.trim()) return;
    setEjecutando(true);
    setResultadoPareto(null);
    setResultadoCorr(null);
    setResultadoInt(null);

    try {
      if (tipoConsulta === "segmentar") {
        const resultado = segmentar(casos, campoSeg);
        setResultadoPareto(resultado);

        if (equipo.creditos_restantes >= 1) {
          await supabase.from("consultas").insert({
            equipo_id: equipo.id,
            tipo: "segmentar",
            hipotesis: hipotesis.trim(),
            parametros: { campo: campoSeg },
            resultado,
            costo: 1,
          });
          await supabase
            .from("equipos")
            .update({ creditos_restantes: equipo.creditos_restantes - 1 })
            .eq("id", equipo.id);
        }
      } else if (tipoConsulta === "correlacionar") {
        const resultado = correlacionar(casos, campoX, campoY);
        setResultadoCorr(resultado);

        if (equipo.creditos_restantes >= 1) {
          await supabase.from("consultas").insert({
            equipo_id: equipo.id,
            tipo: "correlacionar",
            hipotesis: hipotesis.trim(),
            parametros: { campoX, campoY },
            resultado: { r: resultado.r, n: resultado.n },
            costo: 1,
          });
          await supabase
            .from("equipos")
            .update({ creditos_restantes: equipo.creditos_restantes - 1 })
            .eq("id", equipo.id);
        }
      } else if (tipoConsulta === "intervenir") {
        const val = Number(valorInt);
        if (isNaN(val)) {
          setError("El valor de intervencion debe ser numerico");
          setEjecutando(false);
          return;
        }
        const resultado = await invocarFuncion<Record<string, unknown>>("intervenir", {
          equipo_id: equipo.id,
          nodo: nodoInt,
          valor: val,
          hipotesis: hipotesis.trim(),
        });
        setResultadoInt(resultado);
      }
      setHipotesis("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEjecutando(false);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <p className="text-neutral-500">Cargando simulador...</p>
      </div>
    );
  }

  if (error && !equipo) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="text-sm text-navy-600 underline">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!equipo) return null;

  const costoConsulta = tipoConsulta === "intervenir" ? 3 : 1;
  const sinCreditos = equipo.creditos_restantes < costoConsulta;

  return (
    <div className="min-h-screen bg-navy-50">
      <header className="bg-navy-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={IPADE_LOGO_URL} alt="IPADE" className="h-9 w-9 object-contain" />
          <div>
            <h1 className="text-lg font-bold font-display">{equipo.nombre}</h1>
            <p className="text-navy-200 text-xs">Simulador de Analisis Causal</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-2xl font-medium font-dato tabular-nums text-gold-400">
              {equipo.creditos_restantes}
            </div>
            <div className="text-xs text-navy-200">creditos</div>
          </div>
          {inicioMs && <Cronometro inicioMs={inicioMs} />}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de consultas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-navy-700 mb-4">Nueva consulta</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
              </div>
            )}

            <form onSubmit={ejecutarConsulta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tipo de consulta
                </label>
                <div className="flex gap-2">
                  {([
                    { valor: "segmentar" as const, etiqueta: "Segmentar", costo: 1 },
                    { valor: "correlacionar" as const, etiqueta: "Correlacionar", costo: 1 },
                    { valor: "intervenir" as const, etiqueta: "Intervenir", costo: 3 },
                  ]).map((t) => (
                    <button
                      key={t.valor}
                      type="button"
                      onClick={() => setTipoConsulta(t.valor)}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                        tipoConsulta === t.valor
                          ? "bg-navy-700 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {t.etiqueta}
                      <span className="ml-1 opacity-60">({t.costo} cr)</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="hipotesis" className="block text-sm font-medium text-neutral-700 mb-1">
                  Hipotesis <span className="text-red-500">*</span>
                </label>
                <input
                  id="hipotesis"
                  type="text"
                  value={hipotesis}
                  onChange={(e) => setHipotesis(e.target.value)}
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  placeholder="Escriba su hipotesis antes de ejecutar la consulta"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Formule su hipotesis antes de ver los datos para evitar sesgo de confirmacion.
                </p>
              </div>

              {tipoConsulta === "segmentar" && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Agrupar por
                  </label>
                  <select
                    value={campoSeg}
                    onChange={(e) => setCampoSeg(e.target.value as CampoCategoria)}
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                  >
                    {CAMPOS_CATEGORIA.map((c) => (
                      <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
                    ))}
                  </select>
                </div>
              )}

              {tipoConsulta === "correlacionar" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Variable X
                    </label>
                    <select
                      value={campoX}
                      onChange={(e) => setCampoX(e.target.value as CampoNumerico)}
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    >
                      {CAMPOS_NUMERICOS.map((c) => (
                        <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Variable Y
                    </label>
                    <select
                      value={campoY}
                      onChange={(e) => setCampoY(e.target.value as CampoNumerico)}
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    >
                      {CAMPOS_NUMERICOS.map((c) => (
                        <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {tipoConsulta === "intervenir" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Nodo a intervenir
                    </label>
                    <select
                      value={nodoInt}
                      onChange={(e) => setNodoInt(e.target.value)}
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    >
                      {NODOS_INTERVENCION.map((n) => (
                        <option key={n.valor} value={n.valor}>{n.etiqueta}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Valor fijo
                    </label>
                    <input
                      type="number"
                      value={valorInt}
                      onChange={(e) => setValorInt(e.target.value)}
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      placeholder="Ej: 0 para eliminar errores"
                      step="any"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={ejecutando || sinCreditos}
                className="w-full bg-navy-700 text-white font-medium py-2.5 px-4 rounded text-sm hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ejecutando
                  ? "Ejecutando..."
                  : sinCreditos
                    ? "Creditos insuficientes"
                    : `Ejecutar consulta (${costoConsulta} cr)`}
              </button>
            </form>
          </div>

          {/* Resultados */}
          {resultadoPareto && (
            <GraficaPareto
              datos={resultadoPareto}
              titulo={`Distribucion por ${CAMPOS_CATEGORIA.find((c) => c.valor === campoSeg)?.etiqueta ?? campoSeg}`}
            />
          )}

          {resultadoCorr && <GraficaDispersion datos={resultadoCorr} />}

          {resultadoInt && (
            <div className="bg-white border border-neutral-200 rounded-lg p-5">
              <h4 className="text-sm font-semibold text-navy-700 mb-3">
                Resultado de intervencion
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-neutral-50 rounded p-3">
                  <div className="text-neutral-500 text-xs mb-1">Dias ciclo original (media)</div>
                  <div className="text-xl font-medium font-dato text-neutral-700">
                    {(resultadoInt.media_original as number)?.toFixed(1) ?? "-"}
                  </div>
                </div>
                <div className="bg-navy-50 rounded p-3">
                  <div className="text-neutral-500 text-xs mb-1">Dias ciclo contrafactual (media)</div>
                  <div className="text-xl font-medium font-dato text-navy-700">
                    {(resultadoInt.media_contrafactual as number)?.toFixed(1) ?? "-"}
                  </div>
                </div>
                <div className="col-span-2 bg-gold-50 rounded p-3">
                  <div className="text-neutral-500 text-xs mb-1">Reduccion estimada</div>
                  <div className="text-xl font-medium font-dato text-gold-800">
                    {(resultadoInt.reduccion_porcentual as number)?.toFixed(1) ?? "-"}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: bitacora */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-navy-700">Bitacora de consultas</h3>
              <span className="text-xs text-neutral-500">{consultas.length} consultas</span>
            </div>
            <Bitacora consultas={consultas} />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
            <h3 className="text-sm font-semibold text-navy-700 mb-3">Resumen de datos</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Total de casos</dt>
                <dd className="font-dato font-medium">{casos.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Sucursales</dt>
                <dd className="font-dato font-medium">
                  {new Set(casos.map((c) => c.sucursal)).size}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Con error</dt>
                <dd className="font-dato font-medium">
                  {casos.filter((c) => c.tipo_error && c.tipo_error !== "ninguno").length}
                </dd>
              </div>
            </dl>
          </div>

          <button
            onClick={() => navigate(`/cierre/${equipo.id}`)}
            className="w-full bg-gold-600 text-white font-medium py-2.5 px-4 rounded text-sm hover:bg-gold-700 transition-colors"
          >
            Presentar diagnostico al consejo
          </button>
        </div>
      </div>
    </div>
  );
}
