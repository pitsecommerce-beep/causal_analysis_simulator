interface Consulta {
  id: string;
  tipo: string;
  hipotesis: string;
  parametros: Record<string, unknown>;
  costo: number;
  creada_en: string;
}

interface Props {
  consultas: Consulta[];
}

const ICONO_TIPO: Record<string, string> = {
  segmentar: "S",
  correlacionar: "C",
  intervenir: "I",
};

const COLOR_TIPO: Record<string, string> = {
  segmentar: "bg-navy-100 text-navy-700",
  correlacionar: "bg-gold-100 text-gold-800",
  intervenir: "bg-navy-700 text-white",
};

export default function Bitacora({ consultas }: Props) {
  if (consultas.length === 0) {
    return (
      <div className="text-sm text-neutral-400 py-4 text-center">
        Sin consultas registradas
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {consultas.map((c, i) => (
        <div
          key={c.id || i}
          className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl text-sm"
        >
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${COLOR_TIPO[c.tipo] ?? "bg-neutral-200"}`}
          >
            {ICONO_TIPO[c.tipo] ?? "?"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-neutral-700 font-medium truncate">
              {c.hipotesis}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {c.tipo} &middot; {c.costo} cr &middot;{" "}
              {new Date(c.creada_en).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
