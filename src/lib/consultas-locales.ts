import { contarFrecuencias, pearson } from "./estadistica";

export interface Caso {
  id: string;
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

export type CampoCategoria =
  | "sucursal"
  | "estado"
  | "volumen_sucursal"
  | "estado_civil"
  | "genero"
  | "resultado_buro"
  | "tipo_error"
  | "ultimo_status";

export type CampoNumerico =
  | "edad_cliente"
  | "anios_cliente"
  | "score_buro"
  | "monto_linea"
  | "reintentos"
  | "espera_crop"
  | "dias_ciclo";

export const CAMPOS_CATEGORIA: { valor: CampoCategoria; etiqueta: string }[] = [
  { valor: "sucursal", etiqueta: "Sucursal" },
  { valor: "estado", etiqueta: "Estado" },
  { valor: "volumen_sucursal", etiqueta: "Volumen de sucursal" },
  { valor: "estado_civil", etiqueta: "Estado civil" },
  { valor: "genero", etiqueta: "Género" },
  { valor: "resultado_buro", etiqueta: "Resultado de buró" },
  { valor: "tipo_error", etiqueta: "Tipo de error" },
  { valor: "ultimo_status", etiqueta: "Último status" },
];

export const CAMPOS_NUMERICOS: { valor: CampoNumerico; etiqueta: string }[] = [
  { valor: "edad_cliente", etiqueta: "Edad del cliente" },
  { valor: "anios_cliente", etiqueta: "Años como cliente" },
  { valor: "score_buro", etiqueta: "Score de buró" },
  { valor: "monto_linea", etiqueta: "Monto de línea" },
  { valor: "reintentos", etiqueta: "Reintentos" },
  { valor: "espera_crop", etiqueta: "Espera CROP" },
  { valor: "dias_ciclo", etiqueta: "Días de ciclo" },
];

export interface ResultadoPareto {
  datos: { nombre: string; frecuencia: number; acumulado: number }[];
  total: number;
}

export function segmentar(
  casos: Caso[],
  campo: CampoCategoria,
): ResultadoPareto {
  const valores = casos.map((c) => {
    const v = c[campo];
    return v === null || v === undefined ? "(Sin dato)" : String(v);
  });
  const frecuencias = contarFrecuencias(valores);
  const total = valores.length;
  let acum = 0;
  const datos = frecuencias.map((f) => {
    acum += f.frecuencia;
    return {
      nombre: f.nombre,
      frecuencia: f.frecuencia,
      acumulado: (acum / total) * 100,
    };
  });
  return { datos, total };
}

export interface ResultadoCorrelacion {
  puntos: { x: number; y: number }[];
  r: number;
  n: number;
  etiquetaX: string;
  etiquetaY: string;
}

export function correlacionar(
  casos: Caso[],
  campoX: CampoNumerico,
  campoY: CampoNumerico,
): ResultadoCorrelacion {
  const puntos = casos.map((c) => ({
    x: Number(c[campoX]),
    y: Number(c[campoY]),
  }));
  const r = pearson(
    puntos.map((p) => p.x),
    puntos.map((p) => p.y),
  );
  const etX = CAMPOS_NUMERICOS.find((c) => c.valor === campoX)?.etiqueta ?? campoX;
  const etY = CAMPOS_NUMERICOS.find((c) => c.valor === campoY)?.etiqueta ?? campoY;
  return { puntos, r, n: puntos.length, etiquetaX: etX, etiquetaY: etY };
}
