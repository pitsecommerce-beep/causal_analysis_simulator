import { useState, useEffect } from "react";

const NUMEROS_EJEMPLO = [
  { etiqueta: "Créditos", valores: [12, 9, 6, 3, 0] },
  { etiqueta: "Días ciclo", valores: [14.2, 8.7, 22.1, 5.3, 31.0] },
  { etiqueta: "Correlación r", valores: [0.872, -0.341, 0.156, 0.923, -0.687] },
  { etiqueta: "Porcentaje", valores: [87.3, 42.1, 15.6, 92.3, 68.7] },
];

export default function VistaTipografia() {
  const [contador, setContador] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setContador((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(contador / 60);
  const segs = contador % 60;

  return (
    <div className="min-h-screen bg-navy-50 p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <header>
          <h1 className="font-titulo text-4xl font-semibold text-navy-700 tracking-tight">
            Escala tipográfica
          </h1>
          <p className="font-texto text-sm text-neutral-500 mt-1">
            Vista de verificación (solo desarrollo)
          </p>
        </header>

        <section className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
          <h2 className="font-titulo text-2xl font-semibold text-navy-700">
            Familias tipográficas
          </h2>

          <div className="space-y-4">
            <div>
              <p className="font-texto text-xs font-medium text-neutral-500 uppercase tracking-widest mb-1">
                TITULO (Source Serif 4)
              </p>
              <p className="font-titulo text-4xl font-semibold text-navy-700" style={{ letterSpacing: "-0.02em" }}>
                Simulador de Análisis Causal
              </p>
              <p className="font-titulo text-2xl font-semibold text-navy-700 mt-2">
                Dirección de Operaciones
              </p>
              <p className="font-titulo text-lg font-semibold text-navy-700 mt-2">
                Acentos: dirección, información, resolución, comunicación, muñeca, niño, España
              </p>
            </div>

            <hr className="border-neutral-200" />

            <div>
              <p className="font-texto text-xs font-medium text-neutral-500 uppercase tracking-widest mb-1">
                TEXTO (Inter)
              </p>
              <p className="font-texto text-lg font-medium text-neutral-600 mt-2">
                Subtítulo de sección con peso medio
              </p>
              <p className="font-texto text-base text-neutral-700 mt-2">
                Cuerpo de texto regular. Los equipos deben identificar la causa raíz de los
                retrasos en el proceso de solicitud de tarjetas de crédito del banco ETF.
                Distinguir correlación de causalidad es fundamental.
              </p>
              <p className="font-texto text-sm font-medium text-neutral-500 uppercase mt-2" style={{ letterSpacing: "0.06em" }}>
                ETIQUETA EN MAYÚSCULAS
              </p>
            </div>

            <hr className="border-neutral-200" />

            <div>
              <p className="font-texto text-xs font-medium text-neutral-500 uppercase tracking-widest mb-1">
                DATO (IBM Plex Mono)
              </p>
              <p className="font-dato text-4xl font-medium text-navy-700">
                {String(mins).padStart(2, "0")}:{String(segs).padStart(2, "0")}
              </p>
              <p className="font-dato text-base font-medium text-neutral-700 mt-2">
                r = 0.872 &middot; n = 103 &middot; p &lt; 0.001
              </p>
              <p className="font-dato text-sm text-neutral-500 mt-1">
                Media: 14.27 &middot; Desv: 3.41 &middot; Min: 5.3 &middot; Max: 31.0
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="font-titulo text-2xl font-semibold text-navy-700 mb-4">
            Cifras tabulares (cambio en vivo)
          </h2>
          <p className="font-texto text-sm text-neutral-500 mb-4">
            Los números deben mantenerse alineados sin saltar de ancho al cambiar valores.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left pb-2 font-texto font-medium text-neutral-500">Métrica</th>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={i} className="text-right pb-2 font-texto font-medium text-neutral-500 w-24">
                      Col {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NUMEROS_EJEMPLO.map((fila) => (
                  <tr key={fila.etiqueta} className="border-b border-neutral-100">
                    <td className="py-2 font-texto text-neutral-700">{fila.etiqueta}</td>
                    {fila.valores.map((v, i) => (
                      <td key={i} className="py-2 text-right font-dato font-medium text-navy-700">
                        {typeof v === "number" && !Number.isInteger(v)
                          ? v.toFixed(1)
                          : v}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-neutral-100">
                  <td className="py-2 font-texto text-neutral-700">Cronómetro</td>
                  <td colSpan={5} className="py-2 text-right font-dato text-2xl font-medium text-navy-700">
                    {String(mins).padStart(2, "0")}:{String(segs).padStart(2, "0")} / 70:00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="font-titulo text-2xl font-semibold text-navy-700 mb-4">
            Escala completa
          </h2>
          <div className="space-y-4">
            <div>
              <span className="font-texto text-xs text-neutral-400">display / titulo 36px 600</span>
              <p className="font-titulo text-4xl font-semibold text-navy-700" style={{ lineHeight: "42px", letterSpacing: "-0.02em" }}>
                Análisis Causal
              </p>
            </div>
            <div>
              <span className="font-texto text-xs text-neutral-400">titulo-seccion / titulo 26px 600</span>
              <p className="font-titulo text-2xl font-semibold text-navy-700" style={{ lineHeight: "32px" }}>
                Consejo de Administración
              </p>
            </div>
            <div>
              <span className="font-texto text-xs text-neutral-400">subtitulo / texto 18px 500</span>
              <p className="font-texto text-lg font-medium text-neutral-600" style={{ lineHeight: "26px" }}>
                ETF Bank / Proceso de tarjetas
              </p>
            </div>
            <div>
              <span className="font-texto text-xs text-neutral-400">cuerpo / texto 16px 400</span>
              <p className="font-texto text-base text-neutral-700" style={{ lineHeight: "24px" }}>
                Identifiquen la causa raíz de los retrasos en el proceso.
              </p>
            </div>
            <div>
              <span className="font-texto text-xs text-neutral-400">etiqueta / texto 13px 500 mayúsculas</span>
              <p className="font-texto text-xs font-medium text-neutral-500 uppercase" style={{ fontSize: "13px", lineHeight: "18px", letterSpacing: "0.06em" }}>
                CRÉDITOS RESTANTES
              </p>
            </div>
            <div>
              <span className="font-texto text-xs text-neutral-400">dato / dato 16px 500</span>
              <p className="font-dato text-base font-medium text-navy-700" style={{ lineHeight: "22px" }}>
                12 &middot; 0.872 &middot; 14.27
              </p>
            </div>
            <div>
              <span className="font-texto text-xs text-neutral-400">dato-grande / dato 34px 500</span>
              <p className="font-dato font-medium text-navy-700" style={{ fontSize: "34px", lineHeight: "38px" }}>
                {String(mins).padStart(2, "0")}:{String(segs).padStart(2, "0")}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-neutral-200 p-6 proyectada">
          <h2 className="font-titulo text-2xl font-semibold text-navy-700 mb-2">
            Vista proyectada (base 20px)
          </h2>
          <p className="font-texto text-sm text-neutral-500 mb-4">
            Este contenedor usa la clase .proyectada (font-size: 20px).
            Todo lo que use rem se escala un 25%.
          </p>
          <p className="font-titulo text-2xl font-semibold text-navy-700">
            Panel del Profesor
          </p>
          <p className="font-dato text-2xl font-medium text-navy-700 mt-2">
            {String(mins).padStart(2, "0")}:{String(segs).padStart(2, "0")} / 70:00
          </p>
        </section>
      </div>
    </div>
  );
}
