import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ResultadoCorrelacion } from "../lib/consultas-locales";

interface Props {
  datos: ResultadoCorrelacion;
}

export default function GraficaDispersion({ datos }: Props) {
  const colorR =
    Math.abs(datos.r) > 0.7
      ? "text-navy-700"
      : Math.abs(datos.r) > 0.4
        ? "text-gold-800"
        : "text-neutral-500";

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h4 className="text-sm font-semibold text-navy-700">
          {datos.etiquetaX} vs {datos.etiquetaY}
        </h4>
        <div className="text-right">
          <span className={`font-dato text-lg font-medium ${colorR}`}>
            r = {datos.r.toFixed(3)}
          </span>
          <span className="text-xs text-neutral-500 ml-2">n = {datos.n}</span>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE1E7" />
            <XAxis
              dataKey="x"
              type="number"
              name={datos.etiquetaX}
              tick={{ fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 }}
              label={{
                value: datos.etiquetaX,
                position: "insideBottom",
                offset: -2,
                style: { fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 },
              }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name={datos.etiquetaY}
              tick={{ fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 }}
              label={{
                value: datos.etiquetaY,
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 },
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ fontSize: 12 }}
              formatter={(value: number) => value.toFixed(2)}
            />
            <Scatter data={datos.puntos} fill="#00305B" fillOpacity={0.6} r={4} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
