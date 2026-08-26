import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type {
  ConfigSimulador,
  EstadoEquipo,
  IntervencionAplicada,
  Diagnostico,
  ConsultaRegistrada,
} from '../src/servidor/motor/tipos.js';
import { simularPartida } from '../src/servidor/motor/intervenciones.js';
import { calcularPuntuacion } from '../src/servidor/puntuacion/evaluacion.js';

let config: ConfigSimulador;

beforeAll(() => {
  const raw = readFileSync(resolve(__dirname, '../config/simulador.json'), 'utf-8');
  config = JSON.parse(raw);
});

function crearEquipo(params: {
  intervenciones: IntervencionAplicada[][];
  diagnostico: Diagnostico;
  minuto?: number;
  consultas?: ConsultaRegistrada[];
}): EstadoEquipo {
  const kpis = simularPartida(params.intervenciones, [], config);
  const todasIntervenciones: IntervencionAplicada[] = [];
  for (let t = 0; t < params.intervenciones.length; t++) {
    for (const ia of params.intervenciones[t]) {
      todasIntervenciones.push({ ...ia, trimestre_aplicado: t + 1 });
    }
  }
  return {
    id: 'test',
    nombre: 'Test',
    presupuesto: kpis[kpis.length - 1]?.presupuesto ?? config.equipos.presupuesto_inicial,
    creditos: config.equipos.creditos_iniciales,
    intervenciones: todasIntervenciones,
    eventos: [],
    kpis_por_trimestre: kpis,
    diagnostico: params.diagnostico,
    consultas: params.consultas ?? consultasCompletas(),
    minuto_diagnostico: params.minuto ?? 30,
  };
}

function consultasCompletas(): ConsultaRegistrada[] {
  return [
    { tipo: 'segmentar', hipotesis: 'Las sucursales con más volumen tienen más errores de captura', trimestre: 1, parametros: { variable_x: 'sucursal', variable_y: 'errores' }, costo: 1 },
    { tipo: 'correlacionar', hipotesis: 'Los intentos correlacionan con la ventana de captura', trimestre: 1, parametros: { x: 'intentos', y: 'ventana_captura' }, costo: 1 },
    { tipo: 'embudo', hipotesis: 'Hay fuga significativa entre aprobados y plástico enviado', trimestre: 1, parametros: {}, costo: 1 },
    { tipo: 'segmentar', hipotesis: 'El reproceso documental concentra el mayor volumen de errores', trimestre: 1, parametros: { variable_x: 'tipo_error', variable_y: 'conteo', uso_comentarios: true }, costo: 1 },
  ];
}

function consultasMinimas(): ConsultaRegistrada[] {
  return [
    { tipo: 'correlacionar', hipotesis: 'Edad afecta ciclo', trimestre: 1, parametros: { x: 'edad', y: 'ciclo' }, costo: 1 },
  ];
}

describe('Escenarios de desenlace', () => {
  it('A. Reconversión — checklist + buró + plástico', () => {
    const equipo = crearEquipo({
      intervenciones: [
        [{ id: 1, trimestre_aplicado: 1 }, { id: 4, trimestre_aplicado: 1 }, { id: 5, trimestre_aplicado: 1 }],
        [],
        [],
      ],
      diagnostico: {
        causas_declaradas: [
          'La ventana de captura en sucursal es el cuello de botella',
          'El reproceso documental por documentos incompletos e ilegibles causa reintentos',
          'Hay fuga de aprobados sin plástico enviado',
          'El trabajo perdido por la secuencia tardía del buró desperdicia recursos',
        ],
        propuesta: 'Checklist documental, resecuenciar buró, automatizar disparo de plástico',
      },
      minuto: 28,
    });

    const resultado = calcularPuntuacion(equipo, config);
    console.log('A. Reconversión:', resultado.total, resultado.final, resultado.desglose);

    expect(resultado.final).toBe('A');
    expect(resultado.total).toBeGreaterThanOrEqual(900);
    expect(resultado.total).toBeLessThanOrEqual(1000);

    const kpiFinal = equipo.kpis_por_trimestre[2];
    expect(kpiFinal.ciclo_mediano).toBeLessThan(16);
    expect(kpiFinal.conversion).toBeGreaterThanOrEqual(config.linea_base.conversion * 0.95);
  });

  it('B. Buen proyecto incompleto — checklist + capacitación focalizada', () => {
    const equipo = crearEquipo({
      intervenciones: [
        [{ id: 1, trimestre_aplicado: 1 }, { id: 2, trimestre_aplicado: 1, sucursales_nombradas: [110, 676, 728] }],
        [],
        [],
      ],
      diagnostico: {
        causas_declaradas: [
          'La ventana de captura es larga por errores documentales',
          'El reproceso documental causa múltiples intentos',
        ],
        propuesta: 'Capacitar sucursales críticas y mejorar checklist',
      },
      minuto: 32,
    });

    const resultado = calcularPuntuacion(equipo, config);
    console.log('B. Buen proyecto:', resultado.total, resultado.final, resultado.desglose);

    expect(resultado.final).toBe('B');
    expect(resultado.total).toBeGreaterThanOrEqual(700);
    expect(resultado.total).toBeLessThanOrEqual(899);

    const kpiFinal = equipo.kpis_por_trimestre[2];
    expect(kpiFinal.ciclo_mediano).toBeLessThan(20);
    expect(kpiFinal.ciclo_mediano).toBeGreaterThan(14);
  });

  it('C. Ataque al mediador — reforzaron CrOP', () => {
    const equipo = crearEquipo({
      intervenciones: [
        [{ id: 6, trimestre_aplicado: 1 }],
        [],
        [],
      ],
      diagnostico: {
        causas_declaradas: [
          'La ventana de captura en sucursal concentra el mayor tiempo del ciclo',
          'El back office es lento, CrOP necesita más revisores',
        ],
        propuesta: 'Agregar dos revisores a CrOP para reducir el back office',
      },
      minuto: 35,
      consultas: [
        { tipo: 'correlacionar', hipotesis: 'El tiempo en CrOP correlaciona con el ciclo total', trimestre: 1, parametros: { x: 'back_office', y: 'ciclo' }, costo: 1 },
        { tipo: 'segmentar', hipotesis: 'CrOP es el cuello de botella', trimestre: 1, parametros: { variable_x: 'etapa', variable_y: 'dias' }, costo: 1 },
      ],
    });

    const resultado = calcularPuntuacion(equipo, config);
    console.log('C. Mediador:', resultado.total, resultado.final, resultado.desglose);

    expect(resultado.final).toBe('C');
    expect(resultado.total).toBeGreaterThanOrEqual(450);
    expect(resultado.total).toBeLessThanOrEqual(649);
  });

  it('D. La métrica traicionera — endurecieron el filtro', () => {
    const equipo = crearEquipo({
      intervenciones: [
        [{ id: 8, trimestre_aplicado: 1 }],
        [],
        [],
      ],
      diagnostico: {
        causas_declaradas: [
          'La ventana de captura tarda demasiado en las sucursales',
          'El reproceso documental genera reintentos innecesarios',
          'Los clientes de bajo score alargan el proceso',
        ],
        propuesta: 'Endurecer el umbral del score interno para filtrar solicitudes lentas',
      },
      minuto: 33,
      consultas: consultasMinimas(),
    });

    const resultado = calcularPuntuacion(equipo, config);
    console.log('D. Métrica traicionera:', resultado.total, resultado.final, resultado.desglose);

    expect(resultado.final).toBe('D');
    expect(resultado.total).toBeGreaterThanOrEqual(300);
    expect(resultado.total).toBeLessThanOrEqual(449);
  });

  it('E. El incentivo perverso — bono por velocidad', () => {
    const equipo = crearEquipo({
      intervenciones: [
        [{ id: 9, trimestre_aplicado: 1 }],
        [],
        [],
      ],
      diagnostico: {
        causas_declaradas: [
          'La ventana de captura en sucursales es muy larga',
          'Los ejecutivos no tienen incentivo para capturar rápido',
        ],
        propuesta: 'Bono por velocidad de captura a ejecutivos',
      },
      minuto: 30,
      consultas: consultasMinimas(),
    });

    const resultado = calcularPuntuacion(equipo, config);
    console.log('E. Incentivo perverso:', resultado.total, resultado.final, resultado.desglose);

    expect(resultado.final).toBe('E');
    expect(resultado.total).toBeGreaterThanOrEqual(250);
    expect(resultado.total).toBeLessThanOrEqual(449);
  });

  it('F. Dispersión — capacitación masiva', () => {
    const equipo = crearEquipo({
      intervenciones: [
        [{ id: 3, trimestre_aplicado: 1 }],
        [],
        [],
      ],
      diagnostico: {
        causas_declaradas: [
          'Falta capacitación generalizada en todas las sucursales',
        ],
        propuesta: 'Capacitación masiva a todas las sucursales',
      },
      minuto: 38,
      consultas: [
        { tipo: 'correlacionar', hipotesis: 'ver datos', trimestre: 1, parametros: { x: 'edad', y: 'ciclo' }, costo: 1 },
      ],
    });

    const resultado = calcularPuntuacion(equipo, config);
    console.log('F. Dispersión:', resultado.total, resultado.final, resultado.desglose);

    expect(resultado.final).toBe('F');
    expect(resultado.total).toBeGreaterThanOrEqual(150);
    expect(resultado.total).toBeLessThanOrEqual(349);
  });

  it('G. Parálisis por análisis — no intervinieron', () => {
    const equipo = crearEquipo({
      intervenciones: [[], [], []],
      diagnostico: {
        causas_declaradas: [
          'No pudimos determinar la causa raíz con certeza',
        ],
        propuesta: 'Se requiere más análisis',
      },
      minuto: 44,
      consultas: [
        { tipo: 'correlacionar', hipotesis: 'La edad podría afectar', trimestre: 1, parametros: { x: 'edad', y: 'ciclo' }, costo: 1 },
        { tipo: 'correlacionar', hipotesis: 'El monto afecta', trimestre: 2, parametros: { x: 'monto', y: 'ciclo' }, costo: 1 },
      ],
    });

    const resultado = calcularPuntuacion(equipo, config);
    console.log('G. Parálisis:', resultado.total, resultado.final, resultado.desglose);

    expect(resultado.final).toBe('G');
    expect(resultado.total).toBeGreaterThanOrEqual(100);
    expect(resultado.total).toBeLessThanOrEqual(299);
  });

  it('H. Falso positivo — intervinieron sobre una trampa', () => {
    const equipo = crearEquipo({
      intervenciones: [
        [{ id: 7, trimestre_aplicado: 1 }],
        [],
        [],
      ],
      diagnostico: {
        causas_declaradas: [
          'El perfil del cliente (edad y score de buró) determina el tiempo de ciclo',
        ],
        propuesta: 'Segmentar el proceso por perfil de cliente',
        sucursales_mencionadas: [],
      },
      minuto: 35,
      consultas: consultasMinimas(),
    });

    const resultado = calcularPuntuacion(equipo, config);
    console.log('H. Falso positivo:', resultado.total, resultado.final, resultado.desglose);

    expect(resultado.final).toBe('H');
  });
});

describe('Calibración del motor', () => {
  it('La combinación óptima 1+4+5 cuesta 35 unidades', () => {
    const costos = [1, 4, 5].map(
      (id) => config.intervenciones.find((i) => i.id === id)!.costo,
    );
    expect(costos.reduce((a, b) => a + b, 0)).toBe(35);
  });

  it('La línea base coincide con la verdad oculta', () => {
    const lb = config.linea_base;
    expect(lb.n).toBe(1500);
    expect(lb.intentos_media).toBeCloseTo(1.96, 1);
    expect(lb.tasa_reproceso).toBeCloseTo(0.598, 2);
    expect(lb.embudo.total).toBe(1500);
    expect(lb.embudo.buro_corrido).toBe(1397);
    expect(lb.embudo.buro_aceptado).toBe(1022);
    expect(lb.embudo.plastico_enviado).toBe(731);
  });

  it('El estado sin intervención no mejora KPIs', () => {
    const kpis = simularPartida([[], [], []], [], config);
    for (const kpi of kpis) {
      expect(kpi.ciclo_mediano).toBe(config.linea_base.ciclo_mediano);
      expect(kpi.conversion).toBe(config.linea_base.conversion);
    }
  });

  it('Intervención 7 (segmentar) no tiene efecto', () => {
    const kpis = simularPartida(
      [[{ id: 7, trimestre_aplicado: 1 }], [], []],
      [],
      config,
    );
    expect(kpis[2].ciclo_mediano).toBe(config.linea_base.ciclo_mediano);
  });

  it('Intervención 8 baja ciclo pero destruye conversión', () => {
    const kpis = simularPartida(
      [[{ id: 8, trimestre_aplicado: 1 }], [], []],
      [],
      config,
    );
    expect(kpis[0].ciclo_mediano).toBeLessThan(config.linea_base.ciclo_mediano);
    expect(kpis[0].conversion).toBeLessThan(config.linea_base.conversion * 0.7);
  });

  it('Intervención 10 no tiene efecto en el horizonte del juego', () => {
    const kpis = simularPartida(
      [[{ id: 10, trimestre_aplicado: 1 }], [], []],
      [],
      config,
    );
    expect(kpis[2].ciclo_mediano).toBe(config.linea_base.ciclo_mediano);
    expect(kpis[2].presupuesto).toBe(0);
  });
});
