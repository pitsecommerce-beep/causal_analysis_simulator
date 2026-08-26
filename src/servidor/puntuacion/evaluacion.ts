import type {
  ConfigSimulador,
  EstadoEquipo,
  EstadoKPIs,
  ResultadoPuntuacion,
  ConsultaRegistrada,
} from '../motor/tipos.js';
import { evaluarDiagnostico } from './reglas.js';

export function calcularPuntuacion(
  equipo: EstadoEquipo,
  config: ConfigSimulador,
): ResultadoPuntuacion {
  const desglose: Record<string, number> = {};

  const ptsDiag = calcularDiagnostico(equipo, config);
  desglose.diagnostico = ptsDiag;

  const ptsRigor = calcularRigor(equipo, config);
  desglose.rigor = ptsRigor;

  const kpiFinal = equipo.kpis_por_trimestre[equipo.kpis_por_trimestre.length - 1];
  const ptsImpacto = kpiFinal
    ? calcularImpacto(kpiFinal, config)
    : 0;
  desglose.impacto = ptsImpacto;

  const ptsVelocidad = calcularVelocidad(equipo, config);
  desglose.velocidad = ptsVelocidad;

  const ptsEficiencia = calcularEficiencia(equipo, config);
  desglose.eficiencia = ptsEficiencia;

  const penalizaciones = kpiFinal
    ? calcularPenalizaciones(equipo, kpiFinal, config)
    : 0;
  desglose.penalizaciones = penalizaciones;

  const total = ptsDiag + ptsRigor + ptsImpacto + ptsVelocidad + ptsEficiencia + penalizaciones;
  const totalAcotado = Math.max(0, Math.min(1000, total));

  const final = determinarFinal(totalAcotado, equipo, config);

  return {
    diagnostico: ptsDiag,
    rigor: ptsRigor,
    impacto: ptsImpacto,
    velocidad: ptsVelocidad,
    eficiencia: ptsEficiencia,
    penalizaciones,
    total: totalAcotado,
    desglose,
    final,
  };
}

function calcularDiagnostico(equipo: EstadoEquipo, config: ConfigSimulador): number {
  if (!equipo.diagnostico) return 0;
  const resultado = evaluarDiagnostico(equipo.diagnostico, config);
  return resultado.puntos;
}

function calcularRigor(equipo: EstadoEquipo, config: ConfigSimulador): number {
  const pts = config.puntuacion.rigor;
  let total = 0;

  const consultas = equipo.consultas;

  const tienePareto = consultas.some(
    (c) => c.tipo === 'segmentar' && c.parametros.variable_y !== c.parametros.variable_x,
  );
  if (tienePareto) total += pts.pareto_estratificacion;

  const tieneDispersion = consultas.some((c) => c.tipo === 'correlacionar');
  if (tieneDispersion) total += pts.dispersion_interpretacion;

  const tieneEmbudo = consultas.some((c) => c.tipo === 'embudo');
  if (tieneEmbudo) total += pts.embudo_etapas;

  const todasConHipotesis = consultas.length > 0 &&
    consultas.every((c) => c.hipotesis && c.hipotesis.trim().length > 10);
  if (todasConHipotesis) total += pts.hipotesis_antes_consulta;

  const cruzoComentarios = consultas.some(
    (c) => c.parametros.uso_comentarios === true,
  );
  if (cruzoComentarios) total += pts.cruce_comentarios_datos;

  return total;
}

function calcularImpacto(kpi: EstadoKPIs, config: ConfigSimulador): number {
  const lb = config.linea_base;
  const pts = config.puntuacion.impacto;
  let total = 0;

  const reduccionCiclo = (lb.ciclo_mediano - kpi.ciclo_mediano) / lb.ciclo_mediano;
  if (reduccionCiclo > 0) {
    total += Math.round(pts.reduccion_ciclo * Math.min(1, reduccionCiclo / 0.55));
  }

  const reduccionQuejas = (lb.quejas_indice - kpi.quejas_indice) / lb.quejas_indice;
  if (reduccionQuejas > 0) {
    total += Math.round(pts.reduccion_quejas * Math.min(1, reduccionQuejas / 0.6));
  }

  if (kpi.conversion >= lb.conversion * 0.95) {
    const mejora = kpi.conversion >= lb.conversion ? 1.0 : 0.7;
    total += Math.round(pts.conversion_preservada * mejora);
  }

  const presupuestoRatio = kpi.presupuesto / config.equipos.presupuesto_inicial;
  total += Math.round(pts.presupuesto_no_gastado * presupuestoRatio);

  return total;
}

function calcularVelocidad(equipo: EstadoEquipo, config: ConfigSimulador): number {
  const vel = config.puntuacion.velocidad;
  if (!equipo.minuto_diagnostico) return 0;

  const min = equipo.minuto_diagnostico;
  if (min <= vel.minuto_max) return vel.max_puntos;
  if (min >= vel.minuto_min) return vel.puntos_minimo;

  const rango = vel.minuto_min - vel.minuto_max;
  const progreso = (min - vel.minuto_max) / rango;
  return Math.round(vel.max_puntos - progreso * (vel.max_puntos - vel.puntos_minimo));
}

function calcularEficiencia(equipo: EstadoEquipo, config: ConfigSimulador): number {
  const maxPts = config.puntuacion.eficiencia.max_puntos;
  const creditosIniciales = config.equipos.creditos_iniciales;
  const creditosUsados = equipo.consultas.reduce((sum, c) => sum + c.costo, 0);
  const restantes = Math.max(0, creditosIniciales - creditosUsados);
  return Math.round((restantes / creditosIniciales) * maxPts);
}

function calcularPenalizaciones(
  equipo: EstadoEquipo,
  kpi: EstadoKPIs,
  config: ConfigSimulador,
): number {
  const lb = config.linea_base;
  const pen = config.puntuacion.penalizaciones;
  let total = 0;

  if (kpi.ciclo_mediano > lb.ciclo_mediano) {
    const empeora = pen.empeora_kpi as { min: number; max: number };
    const gravedad = Math.min(
      1,
      (kpi.ciclo_mediano - lb.ciclo_mediano) / lb.ciclo_mediano,
    );
    total += Math.round(empeora.min + gravedad * (empeora.max - empeora.min));
  }

  const tieneBono = equipo.intervenciones.some((i) => i.id === 9);
  const incentivo_perverso = tieneBono && kpi.quejas_indice > lb.quejas_indice;
  if (incentivo_perverso) {
    total += pen.incentivo_perverso as number;
  }

  if (kpi.quejas_indice > lb.quejas_indice * 1.1 && !incentivo_perverso) {
    const empeora = pen.empeora_kpi as { min: number; max: number };
    total += empeora.min;
  }

  const tieneScore8 = equipo.intervenciones.some((i) => i.id === 8);
  if (tieneScore8 && kpi.conversion < lb.conversion * 0.8) {
    total += pen.metrica_a_costa_negocio as number;
  }

  const presupuestoGastado =
    config.equipos.presupuesto_inicial - kpi.presupuesto;
  if (presupuestoGastado >= 80 && kpi.ciclo_mediano >= lb.ciclo_mediano * 0.9) {
    total += pen.presupuesto_agotado_sin_efecto as number;
  }

  return total;
}

function determinarFinal(
  puntaje: number,
  equipo: EstadoEquipo,
  config: ConfigSimulador,
): string {
  const ids = equipo.intervenciones.map((i) => i.id);

  const tieneChecklist = ids.includes(1);
  const tieneBuro = ids.includes(4);
  const tienePlastico = ids.includes(5);
  const tieneCrOP = ids.includes(6);
  const tieneScore = ids.includes(8);
  const tieneBono = ids.includes(9);
  const tieneMasiva = ids.includes(3);
  const tieneReemplazo = ids.includes(10);
  const tieneSegmentar = ids.includes(7);

  if (tieneScore && !tieneChecklist && !tieneBuro) return 'D';
  if (tieneBono) return 'E';

  const kpiFinal = equipo.kpis_por_trimestre[equipo.kpis_por_trimestre.length - 1];
  if (kpiFinal) {
    const lb = config.linea_base;
    const soloTrampas =
      ids.length > 0 &&
      ids.every((id) => [7, 8].includes(id));
    if (soloTrampas && kpiFinal.ciclo_mediano >= lb.ciclo_mediano * 0.95) return 'H';
  }

  if (tieneMasiva || tieneReemplazo) return 'F';
  if (ids.length === 0) return 'G';

  if (tieneCrOP && !tieneChecklist && !tieneBuro && !tienePlastico) return 'C';

  if (tieneChecklist && tieneBuro && tienePlastico) {
    if (puntaje >= 900) return 'A';
    return 'A';
  }

  if ((tieneChecklist || tieneBuro) && !tienePlastico) {
    return 'B';
  }

  if (puntaje >= 900) return 'A';
  if (puntaje >= 700) return 'B';
  if (puntaje >= 450) return 'C';
  if (puntaje >= 300) return 'D';
  if (puntaje >= 150) return 'F';
  if (puntaje >= 100) return 'G';
  return 'H';
}

export function compararEquipos(
  a: ResultadoPuntuacion,
  b: ResultadoPuntuacion,
  config: ConfigSimulador,
): number {
  if (a.total !== b.total) return b.total - a.total;
  for (const criterio of config.desempate) {
    const va = a[criterio as keyof ResultadoPuntuacion] as number;
    const vb = b[criterio as keyof ResultadoPuntuacion] as number;
    if (va !== vb) return vb - va;
  }
  return 0;
}
