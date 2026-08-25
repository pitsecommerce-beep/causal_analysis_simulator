import { useState, useEffect, useRef } from "react";

const FASES = [
  { nombre: "Bienvenida y equipos", inicio: 0, fin: 5 },
  { nombre: "Definir el problema", inicio: 5, fin: 15 },
  { nombre: "Exploracion de datos", inicio: 15, fin: 30 },
  { nombre: "Hipotesis y espina de pescado", inicio: 30, fin: 40 },
  { nombre: "Prueba con el simulador", inicio: 40, fin: 55 },
  { nombre: "Solucion y contrafactual", inicio: 55, fin: 65 },
  { nombre: "Cierre", inicio: 65, fin: 70 },
];

interface Props {
  inicioMs?: number;
  mostrarFases?: boolean;
}

export default function Cronometro({ inicioMs, mostrarFases = false }: Props) {
  const [minutosTranscurridos, setMinutosTranscurridos] = useState(0);
  const ref = useRef<number | null>(null);
  const inicio = useRef(inicioMs ?? Date.now());

  useEffect(() => {
    if (inicioMs) inicio.current = inicioMs;
  }, [inicioMs]);

  useEffect(() => {
    function actualizar() {
      const diff = (Date.now() - inicio.current) / 1000 / 60;
      setMinutosTranscurridos(Math.max(0, diff));
    }
    actualizar();
    ref.current = window.setInterval(actualizar, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, []);

  const mins = Math.floor(minutosTranscurridos);
  const segs = Math.floor((minutosTranscurridos - mins) * 60);
  const faseActual = FASES.findIndex(
    (f) => minutosTranscurridos >= f.inicio && minutosTranscurridos < f.fin,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="font-mono text-2xl font-bold text-navy-700 tabular-nums">
          {String(mins).padStart(2, "0")}:{String(segs).padStart(2, "0")}
        </div>
        <span className="text-sm text-neutral-500">/ 70:00</span>
      </div>

      {mostrarFases && (
        <div className="space-y-1">
          {FASES.map((fase, i) => {
            const activa = i === faseActual;
            const pasada = minutosTranscurridos >= fase.fin;
            return (
              <div
                key={fase.nombre}
                className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                  activa
                    ? "bg-navy-50 text-navy-700 font-medium"
                    : pasada
                      ? "text-neutral-400"
                      : "text-neutral-600"
                }`}
              >
                <span className="w-16 tabular-nums font-mono">
                  {fase.inicio}–{fase.fin}
                </span>
                <span className="flex-1">{fase.nombre}</span>
                {activa && (
                  <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { FASES };
