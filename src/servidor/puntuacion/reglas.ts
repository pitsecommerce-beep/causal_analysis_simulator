import type { Diagnostico, ConfigSimulador } from '../motor/tipos.js';

interface DiagnosticoEvaluado {
  puntos: number;
  desglose: Record<string, number>;
  hallazgos_correctos: string[];
  causas_espurias: string[];
}

const PATRONES_VENTANA_CAPTURA = [
  /ventana\s*(de\s*)?captura/i,
  /cuello\s*(de\s*botella)?.*sucursal/i,
  /tiempo\s*(en\s*)?sucursal/i,
  /d[ií]as\s*(de\s*)?captura/i,
  /demora\s*(en\s*)?(la\s*)?captura/i,
  /captura\s*(es\s*)?(el\s*)?cuello/i,
  /sucursal.*cuello/i,
  /branch.*bottleneck/i,
];

const PATRONES_REPROCESO = [
  /reproceso\s*(documental)?/i,
  /documentos?\s*(incompletos?|ilegibles?)/i,
  /error(es)?\s*(de\s*)?captura/i,
  /checklist/i,
  /errores\s*(de\s*)?documentaci[oó]n/i,
  /reintento/i,
  /captura\s*(incorrecta|err[oó]nea)/i,
];

const PATRONES_FUGA = [
  /fuga/i,
  /aprobados?\s*(sin\s*)?(tarjeta|pl[aá]stico)/i,
  /pl[aá]stico\s*(no\s*)?(enviado|despachado)/i,
  /atorado/i,
  /sin\s*tarjeta/i,
  /tarjeta\s*no\s*(enviada|entregada)/i,
  /disparo\s*(del\s*)?pl[aá]stico/i,
  /embudo.*fuga/i,
];

const PATRONES_TRABAJO_PERDIDO = [
  /trabajo\s*perdido/i,
  /bur[oó]\s*(tard[ií]|despu[eé]s)/i,
  /secuencia\s*(del\s*)?bur[oó]/i,
  /rechaz(o|ados?)\s*(por\s*)?bur[oó]\s*(despu[eé]s|tras)/i,
  /captura.*rechaz.*bur[oó]/i,
  /orden\s*(del\s*)?(bur[oó]|proceso)/i,
  /resecuenci/i,
];

const PATRONES_TRAMPA = [
  { patron: /\bedad\b/i, nombre: 'edad' },
  { patron: /antig[uü]edad\s*(como\s*)?cliente/i, nombre: 'antiguedad_cliente' },
  { patron: /score\s*(de(l)?\s*)?bur[oó]/i, nombre: 'score_buro' },
  { patron: /score\s*(de(l)?\s*)?(banco|etf)/i, nombre: 'score_banco' },
  { patron: /monto\s*(de\s*)?(l[ií]nea|cr[eé]dito)/i, nombre: 'monto_linea' },
  { patron: /estado\s*civil/i, nombre: 'estado_civil' },
  { patron: /g[eé]nero/i, nombre: 'genero' },
  { patron: /perfil\s*(del?\s*)?cliente/i, nombre: 'perfil_cliente' },
];

function coincideAlguno(texto: string, patrones: RegExp[]): boolean {
  return patrones.some((p) => p.test(texto));
}

export function evaluarDiagnostico(
  diagnostico: Diagnostico,
  config: ConfigSimulador,
): DiagnosticoEvaluado {
  const pts = config.puntuacion.diagnostico;
  const texto = diagnostico.causas_declaradas.join(' ') + ' ' + diagnostico.propuesta;
  let puntos = 0;
  const desglose: Record<string, number> = {};
  const hallazgos: string[] = [];
  const espurias: string[] = [];

  if (coincideAlguno(texto, PATRONES_VENTANA_CAPTURA)) {
    desglose.ventana_captura_cuello = pts.ventana_captura_cuello;
    puntos += pts.ventana_captura_cuello;
    hallazgos.push('ventana_captura_cuello');
  }

  if (coincideAlguno(texto, PATRONES_REPROCESO)) {
    desglose.reproceso_documental_mecanismo = pts.reproceso_documental_mecanismo;
    puntos += pts.reproceso_documental_mecanismo;
    hallazgos.push('reproceso_documental');
  }

  if (coincideAlguno(texto, PATRONES_FUGA)) {
    desglose.fuga_aprobados_sin_plastico = pts.fuga_aprobados_sin_plastico;
    puntos += pts.fuga_aprobados_sin_plastico;
    hallazgos.push('fuga_aprobados');
  }

  if (coincideAlguno(texto, PATRONES_TRABAJO_PERDIDO)) {
    desglose.trabajo_perdido_secuencia_buro = pts.trabajo_perdido_secuencia_buro;
    puntos += pts.trabajo_perdido_secuencia_buro;
    hallazgos.push('trabajo_perdido_buro');
  }

  for (const t of PATRONES_TRAMPA) {
    if (t.patron.test(texto)) {
      desglose[`espuria_${t.nombre}`] = pts.penalizacion_causa_espuria;
      puntos += pts.penalizacion_causa_espuria;
      espurias.push(t.nombre);
    }
  }

  const sucs = diagnostico.sucursales_mencionadas ?? [];
  const foco = config.sucursales_foco;
  const nombro_no_foco = sucs.filter((s) => !foco.includes(s));
  if (nombro_no_foco.length > 0 && sucs.length > 0) {
    const foco_nombradas = sucs.filter((s) => foco.includes(s)).length;
    if (foco_nombradas === 0) {
      desglose.concentracion_sin_masa = pts.penalizacion_concentracion_sin_masa;
      puntos += pts.penalizacion_concentracion_sin_masa;
    }
  }

  return {
    puntos: Math.max(0, puntos),
    desglose,
    hallazgos_correctos: hallazgos,
    causas_espurias: espurias,
  };
}
