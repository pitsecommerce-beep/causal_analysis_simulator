import type { EstadoKPIs, ConfigSimulador } from './tipos.js';

export interface ResumenKPIs {
  ciclo_mediano: number;
  reduccion_ciclo_pct: number;
  quejas_indice: number;
  reduccion_quejas_pct: number;
  conversion: number;
  cambio_conversion_pct: number;
  presupuesto_restante: number;
  presupuesto_gastado: number;
}

export function calcularResumen(
  estado: EstadoKPIs,
  config: ConfigSimulador,
): ResumenKPIs {
  const lb = config.linea_base;
  return {
    ciclo_mediano: estado.ciclo_mediano,
    reduccion_ciclo_pct:
      Math.round(((lb.ciclo_mediano - estado.ciclo_mediano) / lb.ciclo_mediano) * 1000) / 10,
    quejas_indice: estado.quejas_indice,
    reduccion_quejas_pct:
      Math.round(((lb.quejas_indice - estado.quejas_indice) / lb.quejas_indice) * 1000) / 10,
    conversion: estado.conversion,
    cambio_conversion_pct:
      Math.round(((estado.conversion - lb.conversion) / lb.conversion) * 1000) / 10,
    presupuesto_restante: estado.presupuesto,
    presupuesto_gastado: config.equipos.presupuesto_inicial - estado.presupuesto,
  };
}

export function empeoraCiclo(estado: EstadoKPIs, config: ConfigSimulador): boolean {
  return estado.ciclo_mediano > config.linea_base.ciclo_mediano;
}

export function empeoraQuejas(estado: EstadoKPIs, config: ConfigSimulador): boolean {
  return estado.quejas_indice > config.linea_base.quejas_indice;
}

export function empeoraConversion(estado: EstadoKPIs, config: ConfigSimulador): boolean {
  return estado.conversion < config.linea_base.conversion * 0.95;
}

export function presupuestoAgotado(estado: EstadoKPIs): boolean {
  return estado.presupuesto <= 0;
}
