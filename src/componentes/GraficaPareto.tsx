import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import type { ResultadoPareto } from "../lib/consultas-locales";

interface Props {
  datos: ResultadoPareto;
  titulo: string;
}

export default function GraficaPareto({ datos, titulo }: Props) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      <h4 className="text-sm font-semibold text-navy-700 mb-4">{titulo}</h4>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={datos.datos}
            margin={{ top: 5, right: 30, left: 5, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE1E7" />
            <XAxis
              dataKey="nombre"
              angle={-45}
              textAnchor="end"
              tick={{ fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 }}
              interval={0}
              height={80}
            />
            <YAxis
              yAxisId="freq"
              tick={{ fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 }}
              label={{
                value: "Frecuencia",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 },
              }}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 }}
              label={{
                value: "% acumulado",
                angle: 90,
                position: "insideRight",
                style: { fontSize: 13, fill: "#4D5561", fontFamily: "Inter Variable, system-ui, sans-serif", fontWeight: 500 },
              }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                name === "acumulado"
                  ? `${value.toFixed(1)}%`
                  : value,
                name === "acumulado" ? "Acumulado" : "Frecuencia",
              ]}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar
              yAxisId="freq"
              dataKey="frecuencia"
              fill="#00305B"
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="acumulado"
              stroke="#B08D3F"
              strokeWidth={2}
              dot={{ r: 3, fill: "#B08D3F" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        n = {datos.total}
      </p>
    </div>
  );
}
