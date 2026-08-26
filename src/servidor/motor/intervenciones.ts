import type {
  ConfigSimulador,
  EstadoKPIs,
  IntervencionAplicada,
  EventoActivo,
} from './tipos.js';

export function crearEstadoInicial(config: ConfigSimulador): EstadoKPIs {
  const lb = config.linea_base;
  return {
    ciclo_mediano: lb.ciclo_mediano,
    ventana_captura: lb.ventana_captura_mediana,
    back_office: lb.back_office_mediano,
    quejas_indice: lb.quejas_indice,
    quejas_visibles: lb.quejas_indice,
    conversion: lb.conversion,
    presupuesto: config.equipos.presupuesto_inicial,
    errores_captura: lb.errores_captura,
    incompletos: lb.incompletos,
    ilegibles: lb.ilegibles,
    total_errores: lb.total_errores,
    atorados_pct: lb.atorados_pct,
    trabajo_perdido_pct: lb.trabajo_perdido_pct,
    tasa_reproceso: lb.tasa_reproceso,
  };
}

function activa(ia: IntervencionAplicada, retraso: number, trim: number): boolean {
  return trim >= ia.trimestre_aplicado + retraso;
}

export function aplicarIntervenciones(
  estado: EstadoKPIs,
  intervenciones: IntervencionAplicada[],
  trimestre: number,
  config: ConfigSimulador,
): EstadoKPIs {
  const lb = config.linea_base;
  const s = { ...estado };

  let ventana_factor = 1.0;
  let ciclo_factor = 1.0;
  let back_office = lb.back_office_mediano;
  let quejas_factor = 1.0;
  let conversion = lb.conversion;
  let atorados_pct = lb.atorados_pct;
  let trabajo_perdido_pct = lb.trabajo_perdido_pct;
  let ciclo_aparente_bonus = 0;
  let errores_captura = lb.errores_captura;
  let incompletos = lb.incompletos;
  let ilegibles = lb.ilegibles;

  for (const ia of intervenciones) {
    const def = config.intervenciones.find((i) => i.id === ia.id);
    if (!def || !activa(ia, def.retraso_trimestres, trimestre)) continue;

    switch (def.id) {
      case 1:
        incompletos = Math.round(lb.incompletos * 0.30);
        ilegibles = Math.round(lb.ilegibles * 0.50);
        ventana_factor *= 0.55;
        quejas_factor *= 0.65;
        break;

      case 2: {
        const nombradas = ia.sucursales_nombradas ?? [];
        let peso = 0;
        for (const suc of nombradas) {
          const info = config.errores_por_sucursal_foco[String(suc)];
          if (info) peso += info.captura;
        }
        const share = peso / lb.errores_captura;
        errores_captura = Math.round(lb.errores_captura * (1 - share * 0.60));
        ventana_factor *= 1 - share * 0.50;
        quejas_factor *= 1 - share * 0.30;
        break;
      }

      case 3:
        errores_captura = Math.round(lb.errores_captura * 0.40);
        ventana_factor *= 0.55;
        quejas_factor *= 0.65;
        break;

      case 4:
        trabajo_perdido_pct = lb.trabajo_perdido_pct * 0.72;
        ciclo_factor *= 0.69;
        quejas_factor *= 0.88;
        break;

      case 5:
        atorados_pct = 0.02;
        quejas_factor *= 0.75;
        break;

      case 6:
        back_office = 6.0;
        break;

      case 7:
        break;

      case 8:
        ciclo_aparente_bonus = -5;
        conversion = lb.conversion * 0.65;
        break;

      case 9:
        ventana_factor *= 0.88;
        if (trimestre >= 3) {
          ventana_factor *= 1.30;
          quejas_factor *= 1.18;
        }
        break;

      case 10:
        break;
    }
  }

  const ventana = Math.max(2, lb.ventana_captura_mediana * ventana_factor);
  const ciclo_bruto = (ventana + back_office) * ciclo_factor;
  const ciclo_mediano = Math.max(2, ciclo_bruto + ciclo_aparente_bonus);

  const ciclo_ratio = ciclo_bruto / lb.ciclo_mediano;
  const atorados_mejora = atorados_pct < lb.atorados_pct
    ? (lb.atorados_pct - atorados_pct) * 150
    : 0;
  let quejas_base = 100 * ciclo_ratio - atorados_mejora;
  quejas_base *= quejas_factor;
  const quejas_indice = Math.max(0, Math.round(quejas_base));

  let conv = conversion;
  if (atorados_pct < lb.atorados_pct && conversion >= lb.conversion) {
    const nuevos = lb.embudo.score_aceptado * (lb.atorados_pct - atorados_pct);
    conv = (lb.embudo.plastico_enviado + nuevos) / lb.n;
  }

  const total_errores = errores_captura + incompletos + ilegibles;

  s.ciclo_mediano = r1(ciclo_mediano);
  s.ventana_captura = r1(ventana);
  s.back_office = r1(back_office);
  s.quejas_indice = quejas_indice;
  s.quejas_visibles = quejas_indice;
  s.conversion = r3(conv);
  s.errores_captura = errores_captura;
  s.incompletos = incompletos;
  s.ilegibles = ilegibles;
  s.total_errores = total_errores;
  s.atorados_pct = r3(atorados_pct);
  s.trabajo_perdido_pct = r3(trabajo_perdido_pct);
  s.tasa_reproceso = r3(total_errores / lb.n);

  return s;
}

export function aplicarEventos(
  estado: EstadoKPIs,
  eventos: EventoActivo[],
  trimestre: number,
  config: ConfigSimulador,
): EstadoKPIs {
  const s = { ...estado };

  for (const ev of eventos) {
    const def = config.eventos_aleatorios.find((e) => e.id === ev.id);
    if (!def) continue;

    const dur = (def.efecto.duracion_trimestres as number) ?? 999;
    if (trimestre < ev.trimestre_inicio || trimestre >= ev.trimestre_inicio + dur) continue;

    switch (ev.id) {
      case 'auditoria':
        s.back_office += def.efecto.back_office_incremento as number;
        s.ciclo_mediano += def.efecto.back_office_incremento as number;
        break;
      case 'renuncia':
        s.errores_captura = Math.round(s.errores_captura * (1 + (def.efecto.reversion_capacitacion as number) * 0.3));
        break;
      case 'competencia':
        if (s.ciclo_mediano > (def.efecto.abandono_si_ciclo_mayor_a as number))
          s.conversion *= 1 - (def.efecto.abandono_incremento as number);
        break;
      case 'pico':
        s.errores_captura = Math.round(s.errores_captura * (1 + (def.efecto.volumen_incremento as number) * 0.4));
        s.ventana_captura *= 1.15;
        s.ciclo_mediano = s.ventana_captura + s.back_office;
        break;
      case 'prensa':
        s.quejas_visibles = Math.round(s.quejas_indice * (def.efecto.quejas_visibles_multiplicador as number));
        break;
      case 'rotacion_crop':
        s.back_office += def.efecto.capacidad_reduccion as number;
        s.ciclo_mediano += def.efecto.capacidad_reduccion as number;
        break;
      case 'regulatorio':
        s.ilegibles = Math.round(s.ilegibles * (1 + (def.efecto.ilegibles_incremento as number)));
        s.total_errores = s.errores_captura + s.incompletos + s.ilegibles;
        break;
    }
  }

  s.ciclo_mediano = r1(s.ciclo_mediano);
  s.ventana_captura = r1(s.ventana_captura);
  s.back_office = r1(s.back_office);
  s.conversion = r3(s.conversion);
  return s;
}

export function calcularPresupuesto(
  presupuesto_actual: number,
  intervenciones_nuevas: IntervencionAplicada[],
  config: ConfigSimulador,
): { presupuesto: number; error?: string } {
  let p = presupuesto_actual;
  for (const ia of intervenciones_nuevas) {
    const def = config.intervenciones.find((i) => i.id === ia.id);
    if (!def) return { presupuesto: p, error: `Intervención ${ia.id} no encontrada` };
    if (def.costo > p) return { presupuesto: p, error: `Presupuesto insuficiente para "${def.nombre}"` };
    p -= def.costo;
  }
  return { presupuesto: p };
}

export function simularPartida(
  intervenciones_por_trimestre: IntervencionAplicada[][],
  eventos: EventoActivo[],
  config: ConfigSimulador,
): EstadoKPIs[] {
  const resultados: EstadoKPIs[] = [];
  let todas: IntervencionAplicada[] = [];
  let presupuesto = config.equipos.presupuesto_inicial;

  for (let trim = 1; trim <= 3; trim++) {
    const nuevas = (intervenciones_por_trimestre[trim - 1] ?? []).map((ia) => ({
      ...ia,
      trimestre_aplicado: ia.trimestre_aplicado || trim,
    }));
    todas = [...todas, ...nuevas];

    const { presupuesto: p } = calcularPresupuesto(presupuesto, nuevas, config);
    presupuesto = p;

    let estado = crearEstadoInicial(config);
    estado.presupuesto = presupuesto;
    estado = aplicarIntervenciones(estado, todas, trim, config);
    estado.presupuesto = presupuesto;
    estado = aplicarEventos(estado, eventos, trim, config);
    resultados.push(estado);
  }

  return resultados;
}

function r1(n: number): number { return Math.round(n * 10) / 10; }
function r3(n: number): number { return Math.round(n * 1000) / 1000; }
