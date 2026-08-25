/**
 * Coeficientes del modelo generativo oculto.
 * Un profesor puede modificar estos valores para variar el ejercicio entre grupos.
 */

export interface Sucursal {
  nombre: string;
  estado: string;
  esCritica: boolean;
  volumen: "alto" | "medio" | "bajo";
}

export const SUCURSALES: Sucursal[] = [
  // CDMX — 7 sucursales, 2 críticas
  { nombre: "Sucursal Polanco", estado: "CDMX", esCritica: true, volumen: "alto" },
  { nombre: "Sucursal Tepito", estado: "CDMX", esCritica: true, volumen: "alto" },
  { nombre: "Sucursal Santa Fe", estado: "CDMX", esCritica: false, volumen: "alto" },
  { nombre: "Sucursal Coyoacán", estado: "CDMX", esCritica: false, volumen: "medio" },
  { nombre: "Sucursal Del Valle", estado: "CDMX", esCritica: false, volumen: "medio" },
  { nombre: "Sucursal Roma Norte", estado: "CDMX", esCritica: false, volumen: "bajo" },
  { nombre: "Sucursal Condesa", estado: "CDMX", esCritica: false, volumen: "bajo" },
  // Estado de México — 5 sucursales, 1 crítica
  { nombre: "Sucursal Ecatepec Centro", estado: "Estado de México", esCritica: true, volumen: "alto" },
  { nombre: "Sucursal Naucalpan", estado: "Estado de México", esCritica: false, volumen: "alto" },
  { nombre: "Sucursal Toluca", estado: "Estado de México", esCritica: false, volumen: "medio" },
  { nombre: "Sucursal Metepec", estado: "Estado de México", esCritica: false, volumen: "medio" },
  { nombre: "Sucursal Texcoco", estado: "Estado de México", esCritica: false, volumen: "bajo" },
  // Jalisco — 3 sucursales
  { nombre: "Sucursal Guadalajara Centro", estado: "Jalisco", esCritica: false, volumen: "alto" },
  { nombre: "Sucursal Zapopan", estado: "Jalisco", esCritica: false, volumen: "medio" },
  { nombre: "Sucursal Tlaquepaque", estado: "Jalisco", esCritica: false, volumen: "bajo" },
  // Nuevo León — 3 sucursales
  { nombre: "Sucursal Monterrey Centro", estado: "Nuevo León", esCritica: false, volumen: "alto" },
  { nombre: "Sucursal San Pedro", estado: "Nuevo León", esCritica: false, volumen: "medio" },
  { nombre: "Sucursal Apodaca", estado: "Nuevo León", esCritica: false, volumen: "bajo" },
];

export const PESO_VOLUMEN_SELECCION: Record<string, number> = {
  alto: 3,
  medio: 2,
  bajo: 1,
};

export const COEFICIENTES = {
  totalCasos: 103,

  capacitacion: {
    mediaCritica: 0.20,
    mediaOtra: 0.80,
    desviacion: 0.10,
  },

  error: {
    base: 0.90,
    pesoCapacitacion: 0.85,
    pesoVolumen: 0.08,
  },

  tiposError: [
    "RFC incorrecto",
    "Domicilio incompleto",
    "Ingreso mal capturado",
    "Documento faltante",
    "Referencia duplicada",
  ],

  // Reintentos: distribución categórica para controlar media y varianza
  reintentos: {
    sinErrorP1: 0.65,    // P(1 | sin error) — el resto es P(2)
    conErrorP2: 0.44,    // P(2 | con error)
    conErrorP3: 0.33,    // P(3 | con error)
    conErrorP4: 0.18,    // P(4 | con error)
    // P(5 | con error) = 1 - sum = 0.05
  },

  esperaCrop: {
    base: 2.0,
    pesoReintentos: 1.8,
    ruido: 1.0,
  },

  diasCiclo: {
    base: 7.0,
    baseCerrado: 2.0,
    pesoReintentos: 10.0,
    pesoEsperaCrop: 2.0,
    ruido: 3.0,
    colaPReintentos: 0.25,
    colaFactor: 2.5,
  },

  edad: {
    baseAlto: 32,
    baseMedio: 40,
    baseBajo: 48,
    desviacion: 8,
    min: 22,
    max: 72,
  },

  montoLinea: {
    baseAlto: 45000,
    baseMedio: 80000,
    baseBajo: 120000,
    desviacion: 25000,
    min: 10000,
    max: 500000,
  },

  buro: {
    scoreMin: 300,
    scoreMax: 850,
    scoreMean: 640,
    scoreDesviacion: 100,
    umbralRechazo: 500,
    pRechazoDebajo: 0.70,
    pRechazoArriba: 0.03,
  },

  cierreTempranoFactor: 0.25,

  estadosCiviles: ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión libre"],
  generos: ["Masculino", "Femenino"],
  aniosClienteMax: 25,
} as const;
