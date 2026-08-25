import { useNavigate } from "react-router-dom";
import { IPADE_LOGO_URL } from "./lib/constantes";
import type { Usuario } from "./lib/auth";
import { cerrarSesion } from "./lib/auth";

interface Simulador {
  id: string;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  area: string;
  duracion: string;
  icono: string;
  ruta: string;
  activo: boolean;
  color: string;
}

const SIMULADORES: Simulador[] = [
  {
    id: "analisis-causal",
    nombre: "Analisis Causal",
    subtitulo: "ETF Bank / Tarjetas de credito",
    descripcion:
      "Identifiquen la causa raiz de los retrasos en el proceso de solicitud de tarjetas. Distingan correlacion de causalidad usando segmentacion, correlaciones e intervenciones contrafactuales.",
    area: "Direccion de Operaciones",
    duracion: "70 min",
    icono: "DAG",
    ruta: "/analisis-causal",
    activo: true,
    color: "navy",
  },
  {
    id: "cadena-suministro",
    nombre: "Cadena de Suministro",
    subtitulo: "Optimizacion de red logistica",
    descripcion:
      "Disenen la red de distribucion optima equilibrando costos de transporte, niveles de inventario y nivel de servicio bajo incertidumbre de demanda.",
    area: "Direccion de Operaciones",
    duracion: "90 min",
    icono: "SCM",
    ruta: "/cadena-suministro",
    activo: false,
    color: "navy",
  },
  {
    id: "control-calidad",
    nombre: "Control Estadistico",
    subtitulo: "Graficas de control y capacidad",
    descripcion:
      "Monitoreen un proceso productivo en tiempo real. Identifiquen causas especiales de variacion y decidan cuando intervenir usando graficas X-barra, R y capacidad de proceso.",
    area: "Direccion de Operaciones",
    duracion: "60 min",
    icono: "SPC",
    ruta: "/control-calidad",
    activo: false,
    color: "navy",
  },
  {
    id: "teoria-colas",
    nombre: "Teoria de Colas",
    subtitulo: "Diseno de capacidad de servicio",
    descripcion:
      "Determinen la configuracion optima de servidores para minimizar el costo total (espera + capacidad) en un sistema de atencion con llegadas estocasticas.",
    area: "Direccion de Operaciones",
    duracion: "50 min",
    icono: "Q",
    ruta: "/teoria-colas",
    activo: false,
    color: "gold",
  },
  {
    id: "inventarios",
    nombre: "Gestion de Inventarios",
    subtitulo: "Politicas EOQ y punto de reorden",
    descripcion:
      "Experimenten con diferentes politicas de inventario bajo demanda incierta. Evaluen el impacto de lotes, lead times y niveles de seguridad en costos y disponibilidad.",
    area: "Direccion de Operaciones",
    duracion: "60 min",
    icono: "INV",
    ruta: "/inventarios",
    activo: false,
    color: "gold",
  },
  {
    id: "programacion-lineal",
    nombre: "Optimizacion Lineal",
    subtitulo: "Asignacion de recursos escasos",
    descripcion:
      "Formulen y resuelvan problemas de programacion lineal para asignar recursos limitados. Interpreten precios sombra y analicen sensibilidad de la solucion optima.",
    area: "Metodos Cuantitativos",
    duracion: "75 min",
    icono: "LP",
    ruta: "/optimizacion-lineal",
    activo: false,
    color: "navy",
  },
];

const ICONOS_BG: Record<string, string> = {
  navy: "bg-navy-700 text-white",
  gold: "bg-gold-600 text-white",
};

interface AppProps {
  usuario: Usuario;
  onCerrar: () => void;
}

export default function App({ usuario, onCerrar }: AppProps) {
  const navigate = useNavigate();
  const esDocente = usuario.rol === "docente" || usuario.rol === "superadmin";

  return (
    <div className="min-h-screen bg-navy-50">
      <header className="bg-navy-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <img
                src={IPADE_LOGO_URL}
                alt="IPADE Business School"
                className="w-14 h-14 lg:w-16 lg:h-16 object-contain shrink-0 mt-1"
              />
              <div>
                <p className="text-navy-200 text-sm font-medium tracking-wide uppercase mb-1">
                  IPADE Business School
                </p>
                <h1 className="text-3xl lg:text-4xl font-bold font-display leading-tight">
                  Simuladores de Operaciones
                </h1>
                <p className="text-navy-200 mt-2 text-sm lg:text-base max-w-xl">
                  Herramientas interactivas para la toma de decisiones basada en datos.
                  Cada simulador plantea un problema real de operaciones que los equipos
                  deben resolver bajo restricciones de tiempo e informacion.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-navy-200 text-xs">{usuario.email}</span>
              {esDocente && (
                <button
                  onClick={() => navigate("/profesor")}
                  className="px-4 py-2 bg-navy-600 hover:bg-navy-500 rounded text-white transition-colors"
                >
                  Panel de profesor
                </button>
              )}
              <button
                onClick={onCerrar}
                className="px-4 py-2 bg-navy-800 hover:bg-navy-900 rounded text-navy-200 hover:text-white transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SIMULADORES.map((sim) => (
            <SimuladorCard
              key={sim.id}
              simulador={sim}
              onClick={() => sim.activo && navigate(sim.ruta)}
            />
          ))}
        </div>

        <footer className="mt-12 pt-6 border-t border-neutral-200 flex items-center justify-center gap-2">
          <img src={IPADE_LOGO_URL} alt="" className="w-5 h-5 object-contain opacity-40" />
          <p className="text-xs text-neutral-400">
            IPADE Business School / Direccion de Operaciones
          </p>
        </footer>
      </main>
    </div>
  );
}

function SimuladorCard({
  simulador,
  onClick,
}: {
  simulador: Simulador;
  onClick: () => void;
}) {
  const { nombre, subtitulo, descripcion, area, duracion, icono, activo, color } =
    simulador;

  return (
    <button
      onClick={onClick}
      disabled={!activo}
      className={`text-left rounded-lg border transition-all w-full ${
        activo
          ? "bg-white border-neutral-200 shadow-sm hover:shadow-md hover:border-navy-300 cursor-pointer"
          : "bg-white/60 border-neutral-200/70 opacity-75 cursor-default"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${ICONOS_BG[color]}`}
          >
            {icono}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-navy-700 leading-tight">{nombre}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{subtitulo}</p>
          </div>
          {!activo && (
            <span className="ml-auto shrink-0 text-[10px] font-medium uppercase tracking-wider bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
              Proximamente
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-600 leading-relaxed mb-4">{descripcion}</p>
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>{area}</span>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <span>{duracion}</span>
        </div>
      </div>
      {activo && (
        <div className="border-t border-neutral-100 px-5 py-3">
          <span className="text-sm font-medium text-navy-600">
            Iniciar simulador &rarr;
          </span>
        </div>
      )}
    </button>
  );
}
