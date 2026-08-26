import type { ConfigSimulador, LineaBase } from './tipos.js';

export interface NodoDAG {
  id: string;
  tipo: 'exogena' | 'mecanismo' | 'mediador' | 'resultado' | 'trampa';
  padres: string[];
  hijos: string[];
}

export interface AristaDAG {
  de: string;
  a: string;
  coeficiente?: number;
}

const NODOS: NodoDAG[] = [
  { id: 'sucursal', tipo: 'exogena', padres: [], hijos: ['capacitacion', 'carga_por_ejecutivo'] },
  { id: 'capacitacion', tipo: 'mecanismo', padres: ['sucursal'], hijos: ['error_captura'] },
  { id: 'carga_por_ejecutivo', tipo: 'mecanismo', padres: ['sucursal'], hijos: ['error_captura'] },
  { id: 'claridad_checklist', tipo: 'exogena', padres: [], hijos: ['incompletos_ilegibles'] },
  { id: 'incompletos_ilegibles', tipo: 'mecanismo', padres: ['claridad_checklist'], hijos: ['error_captura'] },
  { id: 'error_captura', tipo: 'mecanismo', padres: ['capacitacion', 'carga_por_ejecutivo', 'incompletos_ilegibles'], hijos: ['intentos'] },
  { id: 'intentos', tipo: 'mediador', padres: ['error_captura'], hijos: ['ventana_captura'] },
  { id: 'ventana_captura', tipo: 'resultado', padres: ['intentos'], hijos: [] },
  { id: 'disparo_manual_plastico', tipo: 'exogena', padres: [], hijos: ['aprobados_sin_tarjeta'] },
  { id: 'aprobados_sin_tarjeta', tipo: 'resultado', padres: ['disparo_manual_plastico'], hijos: [] },
  { id: 'secuencia_tardia_buro', tipo: 'exogena', padres: [], hijos: ['trabajo_perdido'] },
  { id: 'trabajo_perdido', tipo: 'resultado', padres: ['secuencia_tardia_buro'], hijos: [] },
  { id: 'edad', tipo: 'trampa', padres: [], hijos: [] },
  { id: 'antiguedad_cliente', tipo: 'trampa', padres: [], hijos: [] },
  { id: 'score_buro', tipo: 'trampa', padres: [], hijos: [] },
  { id: 'score_banco', tipo: 'trampa', padres: [], hijos: [] },
  { id: 'monto_linea', tipo: 'trampa', padres: [], hijos: [] },
  { id: 'estado_civil', tipo: 'trampa', padres: [], hijos: [] },
  { id: 'genero', tipo: 'trampa', padres: [], hijos: [] },
];

const ARISTAS: AristaDAG[] = [
  { de: 'sucursal', a: 'capacitacion' },
  { de: 'sucursal', a: 'carga_por_ejecutivo' },
  { de: 'capacitacion', a: 'error_captura' },
  { de: 'carga_por_ejecutivo', a: 'error_captura' },
  { de: 'claridad_checklist', a: 'incompletos_ilegibles' },
  { de: 'incompletos_ilegibles', a: 'error_captura' },
  { de: 'error_captura', a: 'intentos' },
  { de: 'intentos', a: 'ventana_captura' },
  { de: 'disparo_manual_plastico', a: 'aprobados_sin_tarjeta' },
  { de: 'secuencia_tardia_buro', a: 'trabajo_perdido' },
];

const TRAMPAS = [
  'edad', 'antiguedad_cliente', 'score_buro', 'score_banco',
  'monto_linea', 'estado_civil', 'genero',
];

const HALLAZGOS_VERDADEROS = [
  'ventana_captura_cuello',
  'reproceso_documental',
  'fuga_aprobados',
  'trabajo_perdido_buro',
];

export function obtenerDAG() {
  return { nodos: NODOS, aristas: ARISTAS };
}

export function obtenerTrampas() {
  return TRAMPAS;
}

export function obtenerHallazgos() {
  return HALLAZGOS_VERDADEROS;
}

export function esNodoTrampa(nodo: string): boolean {
  return TRAMPAS.includes(nodo);
}

export function esNodoCausal(nodo: string): boolean {
  const causales = [
    'sucursal', 'capacitacion', 'carga_por_ejecutivo',
    'claridad_checklist', 'incompletos_ilegibles', 'error_captura',
    'intentos', 'ventana_captura', 'disparo_manual_plastico',
    'aprobados_sin_tarjeta', 'secuencia_tardia_buro', 'trabajo_perdido',
  ];
  return causales.includes(nodo);
}

export function calcularLineaBase(config: ConfigSimulador): LineaBase {
  return { ...config.linea_base };
}
