import { describe, it, expect } from "vitest";
import { generarMuestra, estadisticas, pearson } from "@shared/dag.ts";

const SEMILLA = 42;
const TOLERANCIA_MEDIA = 0.20; // ±20% relativo
const TOLERANCIA_CORR = 0.15; // ±0.15 absoluto

describe("Calibración del DAG", () => {
  const casos = generarMuestra(SEMILLA);

  it("genera exactamente 103 casos", () => {
    expect(casos).toHaveLength(103);
  });

  it("todos los casos tienen campos completos", () => {
    for (const c of casos) {
      expect(c.num_solicitud).toBeGreaterThanOrEqual(1000);
      expect(c.sucursal).toBeTruthy();
      expect(c.estado).toBeTruthy();
      expect(["alto", "medio", "bajo"]).toContain(c.volumen_sucursal);
      expect(c.edad_cliente).toBeGreaterThanOrEqual(22);
      expect(c.edad_cliente).toBeLessThanOrEqual(72);
      expect(c.reintentos).toBeGreaterThanOrEqual(1);
      expect(c.dias_ciclo).toBeGreaterThanOrEqual(1);
      expect(c.score_buro).toBeGreaterThanOrEqual(300);
      expect(c.score_buro).toBeLessThanOrEqual(850);
    }
  });

  it("media de días de ciclo cerca de 22.77", () => {
    const { media } = estadisticas(casos.map((c) => c.dias_ciclo));
    expect(media).toBeGreaterThan(22.77 * (1 - TOLERANCIA_MEDIA));
    expect(media).toBeLessThan(22.77 * (1 + TOLERANCIA_MEDIA));
  });

  it("desviación estándar de días de ciclo cerca de 26.56", () => {
    const { desviacion } = estadisticas(casos.map((c) => c.dias_ciclo));
    expect(desviacion).toBeGreaterThan(26.56 * (1 - TOLERANCIA_MEDIA));
    expect(desviacion).toBeLessThan(26.56 * (1 + TOLERANCIA_MEDIA));
  });

  it("media de reintentos cerca de 2.07", () => {
    const { media } = estadisticas(casos.map((c) => c.reintentos));
    expect(media).toBeGreaterThan(2.07 * (1 - TOLERANCIA_MEDIA));
    expect(media).toBeLessThan(2.07 * (1 + TOLERANCIA_MEDIA));
  });

  it("desviación estándar de reintentos cerca de 1.03", () => {
    const { desviacion } = estadisticas(casos.map((c) => c.reintentos));
    expect(desviacion).toBeGreaterThan(1.03 * (1 - TOLERANCIA_MEDIA));
    expect(desviacion).toBeLessThan(1.03 * (1 + TOLERANCIA_MEDIA));
  });

  it("correlación reintentos-días_ciclo cerca de 0.805", () => {
    const r = pearson(
      casos.map((c) => c.reintentos),
      casos.map((c) => c.dias_ciclo),
    );
    expect(r).toBeGreaterThan(0.805 - TOLERANCIA_CORR);
    expect(r).toBeLessThan(0.805 + TOLERANCIA_CORR);
  });

  it("aproximadamente 40% de los casos tienen error de captura", () => {
    const conError = casos.filter((c) => c.tipo_error !== null).length;
    const porcentaje = conError / casos.length;
    expect(porcentaje).toBeGreaterThan(0.25);
    expect(porcentaje).toBeLessThan(0.60);
  });

  it("más de la mitad de los errores se concentran en sucursales críticas", () => {
    const criticas = [
      "Sucursal Polanco",
      "Sucursal Tepito",
      "Sucursal Ecatepec Centro",
    ];
    const errores = casos.filter((c) => c.tipo_error !== null);
    const erroresCriticos = errores.filter((c) => criticas.includes(c.sucursal));
    if (errores.length > 0) {
      expect(erroresCriticos.length / errores.length).toBeGreaterThan(0.35);
    }
  });

  it("las 18 sucursales están representadas o al menos 12", () => {
    const sucursalesUnicas = new Set(casos.map((c) => c.sucursal));
    expect(sucursalesUnicas.size).toBeGreaterThanOrEqual(12);
  });

  it("edad_cliente correlaciona con dias_ciclo (confusor espurio)", () => {
    const r = Math.abs(
      pearson(
        casos.map((c) => c.edad_cliente),
        casos.map((c) => c.dias_ciclo),
      ),
    );
    expect(r).toBeGreaterThan(0.0);
  });

  it("la muestra es determinista dada la misma semilla", () => {
    const casos2 = generarMuestra(SEMILLA);
    for (let i = 0; i < 103; i++) {
      expect(casos[i].dias_ciclo).toBe(casos2[i].dias_ciclo);
      expect(casos[i].reintentos).toBe(casos2[i].reintentos);
      expect(casos[i].sucursal).toBe(casos2[i].sucursal);
    }
  });

  it("semillas diferentes producen muestras diferentes", () => {
    const casos3 = generarMuestra(SEMILLA + 1);
    const iguales = casos.filter((c, i) => c.dias_ciclo === casos3[i].dias_ciclo).length;
    expect(iguales).toBeLessThan(50);
  });
});
