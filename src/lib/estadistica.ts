export function media(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function desviacion(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = media(arr);
  const varianza = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(varianza);
}

export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const mx = media(x);
  const my = media(y);
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
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

export function contarFrecuencias(arr: string[]): { nombre: string; frecuencia: number }[] {
  const conteo: Record<string, number> = {};
  for (const v of arr) {
    conteo[v] = (conteo[v] ?? 0) + 1;
  }
  return Object.entries(conteo)
    .map(([nombre, frecuencia]) => ({ nombre, frecuencia }))
    .sort((a, b) => b.frecuencia - a.frecuencia);
}
