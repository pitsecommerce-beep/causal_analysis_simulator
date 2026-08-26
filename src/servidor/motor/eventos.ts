import type { ConfigSimulador, EventoActivo } from './tipos.js';

function crearPRNG(semilla: number): () => number {
  let s = semilla | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sortearEventos(
  semilla: number,
  config: ConfigSimulador,
): EventoActivo[] {
  const rng = crearPRNG(semilla);
  const catalogo = config.eventos_aleatorios;
  const n = config.eventos_por_partida;

  const indices: number[] = [];
  const disponibles = [...Array(catalogo.length).keys()];

  while (indices.length < n && disponibles.length > 0) {
    const idx = Math.floor(rng() * disponibles.length);
    indices.push(disponibles[idx]);
    disponibles.splice(idx, 1);
  }

  return indices.map((idx, i) => ({
    id: catalogo[idx].id,
    trimestre_inicio: i + 1,
  }));
}

export function sortearComentarios(
  semilla: number,
  totalComentarios: number,
): number[] {
  const rng = crearPRNG(semilla + 7777);
  const indices: number[] = [];
  const disponibles = [...Array(totalComentarios).keys()];

  while (indices.length < 4 && disponibles.length > 0) {
    const idx = Math.floor(rng() * disponibles.length);
    indices.push(disponibles[idx]);
    disponibles.splice(idx, 1);
  }

  return indices;
}
