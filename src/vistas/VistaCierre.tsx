import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, invocarFuncion } from "../lib/supabase";
import { IPADE_LOGO_URL } from "../lib/constantes";

interface Veredicto {
  veredicto: string;
  explicacion: string;
  dag?: {
    nodos: { id: string; tipo: string; etiqueta: string }[];
    aristas: { de: string; a: string; etiqueta?: string }[];
  };
}

const COLOR_VEREDICTO: Record<string, string> = {
  correcto: "bg-green-50 border-green-200 text-green-800",
  mediador: "bg-gold-50 border-gold-200 text-gold-800",
  confusor: "bg-orange-50 border-orange-200 text-orange-800",
  incorrecto: "bg-red-50 border-red-200 text-red-800",
};

const ETIQUETA_VEREDICTO: Record<string, string> = {
  correcto: "Diagnostico correcto",
  mediador: "Identificaron un mediador, no la causa raiz",
  confusor: "Cayeron en la trampa del confusor",
  incorrecto: "Diagnostico incorrecto",
};

export default function VistaCierre() {
  const { equipoId } = useParams<{ equipoId: string }>();
  const navigate = useNavigate();

  const [causaRaiz, setCausaRaiz] = useState("");
  const [propuesta, setPropuesta] = useState("");
  const [impacto, setImpacto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preguntas, setPreguntas] = useState<string[] | null>(null);
  const [veredicto, setVeredicto] = useState<Veredicto | null>(null);
  const [dagRevelado, setDagRevelado] = useState(false);
  const [dagData, setDagData] = useState<Veredicto["dag"] | null>(null);

  const [equipoNombre, setEquipoNombre] = useState("");

  useEffect(() => {
    if (!equipoId) return;
    supabase
      .from("equipos")
      .select("nombre, grupo_id")
      .eq("id", equipoId)
      .single()
      .then(({ data }) => {
        if (data) {
          setEquipoNombre(data.nombre);
          supabase
            .from("grupos")
            .select("dag_revelado")
            .eq("id", data.grupo_id)
            .single()
            .then(({ data: g }) => {
              if (g?.dag_revelado) setDagRevelado(true);
            });
        }
      });

    supabase
      .from("diagnosticos")
      .select("*")
      .eq("equipo_id", equipoId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCausaRaiz(data.causa_raiz);
          setPropuesta(data.propuesta);
          setImpacto(data.impacto_estimado ?? "");
          setPreguntas(data.preguntas_consejo as string[]);
          setVeredicto(data.veredicto as Veredicto);
        }
      });
  }, [equipoId]);

  useEffect(() => {
    if (!dagRevelado || !equipoId || dagData) return;
    invocarFuncion<{ dag?: Veredicto["dag"] }>("evaluar", {
      equipo_id: equipoId,
      causa_raiz: causaRaiz || "pendiente",
    }).then((res) => {
      if (res.dag) setDagData(res.dag);
    }).catch(() => {});
  }, [dagRevelado, equipoId, causaRaiz, dagData]);

  async function enviarDiagnostico(e: React.FormEvent) {
    e.preventDefault();
    if (!equipoId || !causaRaiz.trim() || !propuesta.trim()) return;
    setEnviando(true);
    setError(null);

    try {
      const resultado = await invocarFuncion<{
        preguntas: string[];
        veredicto: Veredicto;
      }>("consejo", {
        equipo_id: equipoId,
        causa_raiz: causaRaiz.trim(),
        propuesta: propuesta.trim(),
        impacto_estimado: impacto.trim() || null,
      });

      setPreguntas(resultado.preguntas);
      setVeredicto(resultado.veredicto);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-50">
      <header className="bg-navy-700 text-white px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={IPADE_LOGO_URL} alt="IPADE" className="h-9 w-9 object-contain" />
            <div>
              <h1 className="text-lg font-bold font-display">Consejo de Administracion / ETF Bank</h1>
              <p className="text-navy-200 text-xs">{equipoNombre}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-navy-200 hover:text-white underline"
          >
            Volver al simulador
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Formulario de diagnostico */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-navy-700 mb-1">Diagnostico del equipo</h2>
          <p className="text-sm text-neutral-500 mb-5">
            Presenten su analisis al consejo de administracion del banco.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={enviarDiagnostico} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Causa raiz identificada <span className="text-red-500">*</span>
              </label>
              <textarea
                value={causaRaiz}
                onChange={(e) => setCausaRaiz(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 min-h-[80px]"
                placeholder="Cual es la causa principal de que el proceso tarde tanto?"
                required
                disabled={!!preguntas}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Propuesta de mejora <span className="text-red-500">*</span>
              </label>
              <textarea
                value={propuesta}
                onChange={(e) => setPropuesta(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 min-h-[80px]"
                placeholder="Que accion concreta proponen para reducir el tiempo de ciclo?"
                required
                disabled={!!preguntas}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Impacto estimado
              </label>
              <input
                type="text"
                value={impacto}
                onChange={(e) => setImpacto(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500"
                placeholder="Ej: Reduccion de 30% en dias de ciclo"
                disabled={!!preguntas}
              />
            </div>

            {!preguntas && (
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-gold-600 text-white font-medium py-2.5 px-4 rounded-xl text-sm hover:bg-gold-700 transition-all duration-200 disabled:opacity-50"
              >
                {enviando ? "Consultando al consejo..." : "Presentar al consejo de administracion"}
              </button>
            )}
          </form>
        </div>

        {/* Preguntas del consejo */}
        {preguntas && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-navy-700 mb-4">
              Preguntas del consejo
            </h2>
            <div className="space-y-4">
              {preguntas.map((p, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-full bg-gold-100 text-gold-800 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-neutral-700 pt-1">{p}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Veredicto */}
        {veredicto && (
          <div
            className={`rounded-2xl border p-6 ${COLOR_VEREDICTO[veredicto.veredicto] ?? "bg-neutral-50 border-neutral-200 text-neutral-700"}`}
          >
            <h2 className="text-lg font-semibold mb-2">
              {ETIQUETA_VEREDICTO[veredicto.veredicto] ?? veredicto.veredicto}
            </h2>
            <p className="text-sm">{veredicto.explicacion}</p>
          </div>
        )}

        {/* DAG revelado */}
        {dagData && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-navy-700 mb-4">
              DAG real del proceso
            </h2>
            <DAGDiagrama nodos={dagData.nodos} aristas={dagData.aristas} />
          </div>
        )}

        {preguntas && (
          <div className="text-center">
            <button
              onClick={() => {
                setPreguntas(null);
                setVeredicto(null);
                setError(null);
              }}
              className="text-sm text-navy-600 hover:text-navy-800 underline"
            >
              Revisar y enviar otro diagnostico
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface NodoDAG {
  id: string;
  tipo: string;
  etiqueta: string;
}

interface AristaDAG {
  de: string;
  a: string;
  etiqueta?: string;
}

const POSICIONES: Record<string, { x: number; y: number }> = {
  sucursal: { x: 100, y: 40 },
  capacitacion_ejecutivo: { x: 100, y: 130 },
  error_captura: { x: 300, y: 130 },
  reintentos: { x: 500, y: 130 },
  espera_crop: { x: 500, y: 230 },
  dias_ciclo: { x: 700, y: 130 },
  edad_cliente: { x: 300, y: 40 },
  monto_linea: { x: 500, y: 40 },
  score_buro: { x: 700, y: 40 },
  resultado_buro: { x: 700, y: 230 },
};

const COLOR_TIPO_NODO: Record<string, string> = {
  observable: "#00305B",
  latente: "#B08D3F",
  confusor: "#7C8491",
};

function DAGDiagrama({ nodos, aristas }: { nodos: NodoDAG[]; aristas: AristaDAG[] }) {
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 850 280" className="w-full max-w-3xl mx-auto" style={{ minWidth: 600 }}>
        <defs>
          <marker
            id="flecha"
            viewBox="0 0 10 7"
            refX="10"
            refY="3.5"
            markerWidth="8"
            markerHeight="6"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#4D5561" />
          </marker>
        </defs>

        {aristas.map((a, i) => {
          const desde = POSICIONES[a.de];
          const hasta = POSICIONES[a.a];
          if (!desde || !hasta) return null;
          return (
            <line
              key={i}
              x1={desde.x + 60}
              y1={desde.y + 18}
              x2={hasta.x - 5}
              y2={hasta.y + 18}
              stroke="#4D5561"
              strokeWidth={1.5}
              markerEnd="url(#flecha)"
              opacity={0.6}
            />
          );
        })}

        {nodos.map((n) => {
          const pos = POSICIONES[n.id];
          if (!pos) return null;
          const fill = COLOR_TIPO_NODO[n.tipo] ?? "#4D5561";
          const esLatente = n.tipo === "latente";
          return (
            <g key={n.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={120}
                height={36}
                rx={esLatente ? 18 : 4}
                fill={fill}
                opacity={0.9}
              />
              <text
                x={pos.x + 60}
                y={pos.y + 22}
                textAnchor="middle"
                fill="white"
                fontSize={14}
                fontWeight={500}
                fontFamily="Inter Variable, system-ui, sans-serif"
              >
                {n.etiqueta}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex gap-4 justify-center mt-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "#00305B" }} />
          Observable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: "#B08D3F" }} />
          Latente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "#7C8491" }} />
          Confusor
        </span>
      </div>
    </div>
  );
}
