export interface ConfigSimulador {
  fases: Record<string, { inicio: number; duracion: number }>;
  equipos: {
    tamano: number;
    creditos_iniciales: number;
    presupuesto_inicial: number;
  };
  costos_consulta: Record<string, number>;
  linea_base: LineaBase;
  sucursales_foco: number[];
  errores_por_sucursal_foco: Record<
    string,
    { captura: number; total: number; n: number }
  >;
  intervenciones: ConfigIntervencion[];
  eventos_aleatorios: ConfigEvento[];
  eventos_por_partida: number;
  puntuacion: ConfigPuntuacion;
  desempate: string[];
  escenarios: Record<string, { nombre: string; rango: [number, number] }>;
}

export interface LineaBase {
  ciclo_mediano: number;
  ventana_captura_mediana: number;
  back_office_mediano: number;
  quejas_indice: number;
  conversion: number;
  intentos_media: number;
  tasa_reproceso: number;
  errores_por_100: number;
  errores_captura: number;
  incompletos: number;
  ilegibles: number;
  total_errores: number;
  atorados_pct: number;
  atorados_abs: number;
  trabajo_perdido_pct: number;
  trabajo_perdido_abs: number;
  dias_perdidos_en_rechazados: number;
  n: number;
  embudo: {
    total: number;
    buro_corrido: number;
    buro_aceptado: number;
    score_aceptado: number;
    plastico_enviado: number;
  };
}

export interface ConfigIntervencion {
  id: number;
  nombre: string;
  costo: number;
  retraso_trimestres: number;
  requiere_sucursales?: boolean;
  efectos: Record<string, number>;
  efectos_secundarios: Record<string, unknown>;
}

export interface ConfigEvento {
  id: string;
  nombre: string;
  efecto: Record<string, unknown>;
}

export interface ConfigPuntuacion {
  diagnostico: Record<string, number>;
  rigor: Record<string, number>;
  impacto: Record<string, number>;
  velocidad: {
    max_puntos: number;
    minuto_max: number;
    minuto_min: number;
    puntos_minimo: number;
  };
  eficiencia: { max_puntos: number };
  penalizaciones: Record<string, number | { min: number; max: number }>;
}

export interface IntervencionAplicada {
  id: number;
  trimestre_aplicado: number;
  sucursales_nombradas?: number[];
}

export interface EventoActivo {
  id: string;
  trimestre_inicio: number;
  duracion_trimestres?: number;
}

export interface EstadoKPIs {
  ciclo_mediano: number;
  ventana_captura: number;
  back_office: number;
  quejas_indice: number;
  quejas_visibles: number;
  conversion: number;
  presupuesto: number;
  errores_captura: number;
  incompletos: number;
  ilegibles: number;
  total_errores: number;
  atorados_pct: number;
  trabajo_perdido_pct: number;
  tasa_reproceso: number;
}

export interface EstadoEquipo {
  id: string;
  nombre: string;
  presupuesto: number;
  creditos: number;
  intervenciones: IntervencionAplicada[];
  eventos: EventoActivo[];
  kpis_por_trimestre: EstadoKPIs[];
  diagnostico?: Diagnostico;
  consultas: ConsultaRegistrada[];
  minuto_diagnostico?: number;
}

export interface Diagnostico {
  causas_declaradas: string[];
  propuesta: string;
  sucursales_mencionadas?: number[];
}

export interface ConsultaRegistrada {
  tipo: string;
  hipotesis: string;
  trimestre: number;
  parametros: Record<string, unknown>;
  costo: number;
}

export interface ResultadoPuntuacion {
  diagnostico: number;
  rigor: number;
  impacto: number;
  velocidad: number;
  eficiencia: number;
  penalizaciones: number;
  total: number;
  desglose: Record<string, number>;
  final: string;
}
