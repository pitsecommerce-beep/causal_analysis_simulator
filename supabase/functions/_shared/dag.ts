/**
 * DAG generativo oculto del simulador de análisis causal.
 * Este archivo NUNCA debe importarse desde el frontend.
 *
 * Genera 103 casos deterministas dada una semilla numérica.
 * Las variables latentes (capacitacion_ejecutivo) se usan para
 * generar los observables pero no se persisten.
 */

import {
  SUCURSALES,
  COEFICIENTES,
  PESO_VOLUMEN_SELECCION,
  type Sucursal,
} from "./coeficientes.ts";

// --- PRNG determinista (mulberry32) ---

function crearPRNG(semilla: number): () => number {
  let s = semilla | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalBox(rng: () => number, media: number, desv: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
  return media + z * desv;
}

function clamp(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor));
}

function elegir<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// --- Selección ponderada de sucursales ---

function crearSelectorSucursales(): { pesos: number[]; total: number } {
  const pesos = SUCURSALES.map(
    (s) => PESO_VOLUMEN_SELECCION[s.volumen] ?? 1,
  );
  const total = pesos.reduce((a, b) => a + b, 0);
  return { pesos, total };
}

function elegirSucursal(
  rng: () => number,
  sel: { pesos: number[]; total: number },
): Sucursal {
  let r = rng() * sel.total;
  for (let i = 0; i < SUCURSALES.length; i++) {
    r -= sel.pesos[i];
    if (r <= 0) return SUCURSALES[i];
  }
  return SUCURSALES[SUCURSALES.length - 1];
}

// --- Tipos ---

export interface CasoGenerado {
  num_solicitud: number;
  sucursal: string;
  estado: string;
  volumen_sucursal: string;
  edad_cliente: number;
  estado_civil: string;
  genero: string;
  anios_cliente: number;
  score_buro: number;
  resultado_buro: string;
  monto_linea: number;
  reintentos: number;
  espera_crop: number;
  dias_ciclo: number;
  tipo_error: string | null;
  ultimo_status: string;
  comentarios: string;
}

// --- Generación de cada nodo ---

function generarCapacitacion(rng: () => number, suc: Sucursal): number {
  const c = COEFICIENTES.capacitacion;
  const media = suc.esCritica ? c.mediaCritica : c.mediaOtra;
  return clamp(normalBox(rng, media, c.desviacion), 0, 1);
}

function generarError(
  rng: () => number,
  capacitacion: number,
  suc: Sucursal,
): { hayError: boolean; tipo: string | null } {
  const e = COEFICIENTES.error;
  const volAlto = suc.volumen === "alto" ? 1 : 0;
  const prob = clamp(
    e.base - e.pesoCapacitacion * capacitacion + e.pesoVolumen * volAlto,
    0,
    0.95,
  );
  const hayError = rng() < prob;
  const tipo = hayError ? elegir(rng, COEFICIENTES.tiposError) : null;
  return { hayError, tipo };
}

function generarReintentos(rng: () => number, hayError: boolean): number {
  const r = COEFICIENTES.reintentos;
  if (!hayError) {
    return rng() < r.sinErrorP1 ? 1 : 2;
  }
  const p = rng();
  if (p < r.conErrorP2) return 2;
  if (p < r.conErrorP2 + r.conErrorP3) return 3;
  if (p < r.conErrorP2 + r.conErrorP3 + r.conErrorP4) return 4;
  return 5;
}

function generarEsperaCrop(rng: () => number, reintentos: number): number {
  const ec = COEFICIENTES.esperaCrop;
  const valor =
    ec.base +
    ec.pesoReintentos * (reintentos - 1) +
    normalBox(rng, 0, ec.ruido);
  return Math.max(1, Math.round(valor * 10) / 10);
}

function generarDiasCiclo(
  rng: () => number,
  reintentos: number,
  esperaCrop: number,
  casoCerradoTemprano: boolean,
): number {
  const d = COEFICIENTES.diasCiclo;
  if (casoCerradoTemprano) {
    return Math.max(
      1,
      Math.round(d.baseCerrado + normalBox(rng, 0, 1)),
    );
  }
  let valor =
    d.base +
    d.pesoReintentos * (reintentos - 1) +
    d.pesoEsperaCrop * (esperaCrop - 2) +
    normalBox(rng, 0, d.ruido);

  if (reintentos >= 3 && rng() < d.colaPReintentos) {
    valor *= d.colaFactor;
  }

  return Math.max(1, Math.round(valor));
}

function generarEdad(rng: () => number, suc: Sucursal): number {
  const e = COEFICIENTES.edad;
  const base =
    suc.volumen === "alto"
      ? e.baseAlto
      : suc.volumen === "medio"
        ? e.baseMedio
        : e.baseBajo;
  return clamp(Math.round(normalBox(rng, base, e.desviacion)), e.min, e.max);
}

function generarMontoLinea(rng: () => number, suc: Sucursal): number {
  const m = COEFICIENTES.montoLinea;
  const base =
    suc.volumen === "alto"
      ? m.baseAlto
      : suc.volumen === "medio"
        ? m.baseMedio
        : m.baseBajo;
  return clamp(
    Math.round(normalBox(rng, base, m.desviacion) / 1000) * 1000,
    m.min,
    m.max,
  );
}

function generarBuro(
  rng: () => number,
): { score: number; resultado: string; cerradoTemprano: boolean } {
  const b = COEFICIENTES.buro;
  const score = clamp(
    Math.round(normalBox(rng, b.scoreMean, b.scoreDesviacion)),
    b.scoreMin,
    b.scoreMax,
  );
  const pRechazo =
    score < b.umbralRechazo ? b.pRechazoDebajo : b.pRechazoArriba;
  const rechazado = rng() < pRechazo;
  return {
    score,
    resultado: rechazado ? "Rechazado" : "Aprobado",
    cerradoTemprano: rechazado,
  };
}

function generarComentarios(
  rng: () => number,
  tipo_error: string | null,
  reintentos: number,
): string {
  if (!tipo_error) {
    return elegir(rng, [
      "Solicitud procesada sin observaciones.",
      "Documentación completa.",
      "Trámite regular.",
    ]);
  }
  const base = `Error detectado: ${tipo_error}.`;
  if (reintentos > 2) {
    return `${base} Se requirieron ${reintentos} intentos para completar la captura.`;
  }
  return `${base} Corregido en segundo intento.`;
}

function generarUltimoStatus(
  rng: () => number,
  resultado_buro: string,
): string {
  if (resultado_buro === "Rechazado") return "Cerrado - Buró desfavorable";
  return rng() < 0.7 ? "Aprobado" : "En proceso";
}

// --- Generación completa ---

export function generarMuestra(semilla: number): CasoGenerado[] {
  const rng = crearPRNG(semilla);
  const n = COEFICIENTES.totalCasos;
  const sel = crearSelectorSucursales();
  const casos: CasoGenerado[] = [];

  for (let i = 0; i < n; i++) {
    const suc = elegirSucursal(rng, sel);
    const capacitacion = generarCapacitacion(rng, suc);
    const { hayError, tipo } = generarError(rng, capacitacion, suc);
    const reintentos = generarReintentos(rng, hayError);
    const buro = generarBuro(rng);
    const esperaCrop = generarEsperaCrop(rng, reintentos);
    const diasCiclo = generarDiasCiclo(
      rng,
      reintentos,
      esperaCrop,
      buro.cerradoTemprano,
    );
    const edad = generarEdad(rng, suc);
    const montoLinea = generarMontoLinea(rng, suc);

    casos.push({
      num_solicitud: 1000 + i,
      sucursal: suc.nombre,
      estado: suc.estado,
      volumen_sucursal: suc.volumen,
      edad_cliente: edad,
      estado_civil: elegir(rng, COEFICIENTES.estadosCiviles),
      genero: elegir(rng, COEFICIENTES.generos),
      anios_cliente: Math.floor(rng() * COEFICIENTES.aniosClienteMax) + 1,
      score_buro: buro.score,
      resultado_buro: buro.resultado,
      monto_linea: montoLinea,
      reintentos,
      espera_crop: esperaCrop,
      dias_ciclo: diasCiclo,
      tipo_error: tipo,
      ultimo_status: generarUltimoStatus(rng, buro.resultado),
      comentarios: generarComentarios(rng, tipo, reintentos),
    });
  }

  return casos;
}

/**
 * Intervención contrafactual: fija un nodo y regenera la muestra.
 */
export function intervenir(
  semilla: number,
  nodo: string,
  valor: number | string | boolean,
): { promedioOriginal: number; promedioNuevo: number; diferencia: number } {
  const original = generarMuestra(semilla);
  const promedioOriginal = promedio(original.map((c) => c.dias_ciclo));

  const rng = crearPRNG(semilla);
  const n = COEFICIENTES.totalCasos;
  const sel = crearSelectorSucursales();
  const diasNuevos: number[] = [];

  for (let i = 0; i < n; i++) {
    const suc = elegirSucursal(rng, sel);
    const capacitacion = generarCapacitacion(rng, suc);
    const { hayError: _h, tipo: _t } = generarError(rng, capacitacion, suc);
    const reintentosOrig = generarReintentos(rng, _h);
    const buro = generarBuro(rng);
    const _cropOrig = generarEsperaCrop(rng, reintentosOrig);
    // Consume RNG for diasCiclo (2 or 3 calls depending on path)
    generarDiasCiclo(rng, reintentosOrig, _cropOrig, buro.cerradoTemprano);
    generarEdad(rng, suc);
    generarMontoLinea(rng, suc);
    elegir(rng, COEFICIENTES.estadosCiviles);
    elegir(rng, COEFICIENTES.generos);
    rng(); // anios_cliente
    generarUltimoStatus(rng, buro.resultado);
    generarComentarios(rng, _t, reintentosOrig);

    // Recalcular con intervención
    let reintentos = original[i].reintentos;
    let esperaCrop = original[i].espera_crop;

    switch (nodo) {
      case "capacitacion_ejecutivo": {
        const cap =
          typeof valor === "number" ? valor : parseFloat(valor as string);
        const e = COEFICIENTES.error;
        const volAlto = suc.volumen === "alto" ? 1 : 0;
        const prob = clamp(
          e.base - e.pesoCapacitacion * cap + e.pesoVolumen * volAlto,
          0,
          0.95,
        );
        const hayErr = prob > 0.5;
        reintentos = hayErr ? 2 : 1;
        esperaCrop = generarEsperaCropDet(reintentos);
        break;
      }
      case "error_captura": {
        const noError = valor === 0 || valor === "0" || valor === false;
        reintentos = noError ? 1 : original[i].reintentos;
        esperaCrop = generarEsperaCropDet(reintentos);
        break;
      }
      case "reintentos":
        reintentos =
          typeof valor === "number" ? valor : parseInt(valor as string);
        esperaCrop = generarEsperaCropDet(reintentos);
        break;
      case "espera_crop":
        esperaCrop =
          typeof valor === "number" ? valor : parseFloat(valor as string);
        break;
      case "edad_cliente":
      case "monto_linea":
      case "resultado_buro":
        break;
    }

    const d = COEFICIENTES.diasCiclo;
    const dias = buro.cerradoTemprano
      ? Math.max(1, Math.round(d.baseCerrado))
      : Math.max(
          1,
          Math.round(
            d.base +
              d.pesoReintentos * (reintentos - 1) +
              d.pesoEsperaCrop * (esperaCrop - 2),
          ),
        );
    diasNuevos.push(dias);
  }

  const promedioNuevo = promedio(diasNuevos);
  return {
    promedioOriginal,
    promedioNuevo,
    diferencia: promedioNuevo - promedioOriginal,
  };
}

function generarEsperaCropDet(reintentos: number): number {
  const ec = COEFICIENTES.esperaCrop;
  return Math.max(
    1,
    Math.round((ec.base + ec.pesoReintentos * (reintentos - 1)) * 10) / 10,
  );
}

/**
 * Evalúa la causa raíz declarada por el equipo contra el DAG.
 */
export function evaluarDiagnostico(causaRaiz: string): {
  veredicto: "correcto" | "mediador" | "confusor" | "incorrecto";
  explicacion: string;
} {
  const causa = causaRaiz.toLowerCase().trim();

  const esCausaRaiz =
    causa.includes("capacitacion") ||
    causa.includes("capacitación") ||
    causa.includes("entrenamiento") ||
    causa.includes("formacion") ||
    causa.includes("formación") ||
    (causa.includes("error") && causa.includes("captura")) ||
    (causa.includes("sucursal") &&
      (causa.includes("critica") || causa.includes("crítica")));

  const esMediador =
    causa.includes("espera") ||
    causa.includes("crop") ||
    causa.includes("oficina") ||
    (causa.includes("reintento") && !causa.includes("error")) ||
    causa.includes("tramite") ||
    causa.includes("trámite");

  const esConfusor =
    causa.includes("edad") ||
    causa.includes("monto") ||
    causa.includes("linea") ||
    causa.includes("línea") ||
    causa.includes("buro") ||
    causa.includes("buró") ||
    causa.includes("score");

  if (esCausaRaiz) {
    return {
      veredicto: "correcto",
      explicacion:
        "El equipo identificó correctamente que la falta de capacitación en tres sucursales críticas genera errores de captura, que a su vez producen reintentos y alargan el ciclo.",
    };
  }
  if (esMediador) {
    return {
      veredicto: "mediador",
      explicacion:
        "El equipo identificó un mediador (un eslabón intermedio de la cadena causal), no el origen. Atacar la espera CROP o los reintentos sin resolver los errores de captura es tratar el síntoma.",
    };
  }
  if (esConfusor) {
    return {
      veredicto: "confusor",
      explicacion:
        "El equipo confundió una correlación espuria con una causa. La variable identificada correlaciona con los días de ciclo porque ambas dependen de la sucursal, pero no hay relación causal directa.",
    };
  }
  return {
    veredicto: "incorrecto",
    explicacion:
      "La causa raíz declarada no corresponde a ningún nodo del modelo causal. Revise los datos y las herramientas de análisis.",
  };
}

/**
 * Devuelve el DAG completo para la vista de cierre.
 */
export function obtenerDAG() {
  return {
    nodos: [
      { id: "sucursal", tipo: "exogena", observable: true },
      { id: "capacitacion_ejecutivo", tipo: "latente", observable: false },
      { id: "volumen_sucursal", tipo: "observable", observable: true },
      { id: "error_captura", tipo: "observable", observable: true },
      { id: "reintentos", tipo: "observable", observable: true },
      { id: "espera_crop", tipo: "mediador", observable: true },
      { id: "dias_ciclo", tipo: "objetivo", observable: true },
      { id: "edad_cliente", tipo: "confusor", observable: true },
      { id: "monto_linea", tipo: "confusor", observable: true },
      { id: "resultado_buro", tipo: "observable", observable: true },
      { id: "caso_cerrado_temprano", tipo: "observable", observable: true },
    ],
    aristas: [
      { de: "sucursal", a: "capacitacion_ejecutivo" },
      { de: "sucursal", a: "volumen_sucursal" },
      { de: "sucursal", a: "edad_cliente" },
      { de: "sucursal", a: "monto_linea" },
      { de: "capacitacion_ejecutivo", a: "error_captura", coeficiente: COEFICIENTES.error.pesoCapacitacion },
      { de: "volumen_sucursal", a: "error_captura", coeficiente: COEFICIENTES.error.pesoVolumen },
      { de: "error_captura", a: "reintentos" },
      { de: "reintentos", a: "espera_crop", coeficiente: COEFICIENTES.esperaCrop.pesoReintentos },
      { de: "reintentos", a: "dias_ciclo", coeficiente: COEFICIENTES.diasCiclo.pesoReintentos },
      { de: "espera_crop", a: "dias_ciclo", coeficiente: COEFICIENTES.diasCiclo.pesoEsperaCrop },
      { de: "resultado_buro", a: "caso_cerrado_temprano" },
      { de: "caso_cerrado_temprano", a: "dias_ciclo" },
    ],
  };
}

// --- Utilidades ---

function promedio(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function estadisticas(arr: number[]): {
  media: number;
  desviacion: number;
} {
  const media = promedio(arr);
  const varianza =
    arr.reduce((sum, v) => sum + (v - media) ** 2, 0) / arr.length;
  return { media, desviacion: Math.sqrt(varianza) };
}

export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = promedio(x);
  const my = promedio(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i] - mx;
    const yi = y[i] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  return num / Math.sqrt(dx * dy);
}
