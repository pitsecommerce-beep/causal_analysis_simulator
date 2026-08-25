-- Esquema inicial del simulador de análisis causal

create table grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  semilla integer not null,
  fase_actual integer not null default 0,
  dag_revelado boolean not null default false,
  creado_en timestamptz not null default now()
);

create table casos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos(id) on delete cascade,
  num_solicitud integer not null,
  sucursal text not null,
  estado text not null,
  volumen_sucursal text not null,
  edad_cliente integer not null,
  estado_civil text not null,
  genero text not null,
  anios_cliente integer not null,
  score_buro integer not null,
  resultado_buro text not null,
  monto_linea numeric not null,
  reintentos integer not null,
  espera_crop numeric not null,
  dias_ciclo integer not null,
  tipo_error text,
  ultimo_status text not null,
  comentarios text
);

create index idx_casos_grupo on casos(grupo_id);

create table equipos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos(id) on delete cascade,
  nombre text not null,
  roles jsonb not null default '{}',
  creditos_restantes integer not null default 12,
  creado_en timestamptz not null default now()
);

create index idx_equipos_grupo on equipos(grupo_id);

create table consultas (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references equipos(id) on delete cascade,
  tipo text not null check (tipo in ('segmentar', 'correlacionar', 'intervenir')),
  hipotesis text not null,
  parametros jsonb not null default '{}',
  resultado jsonb,
  costo integer not null,
  creada_en timestamptz not null default now()
);

create index idx_consultas_equipo on consultas(equipo_id);

create table diagnosticos (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references equipos(id) on delete cascade,
  causa_raiz text not null,
  propuesta text not null,
  impacto_estimado text,
  preguntas_consejo jsonb,
  veredicto jsonb,
  creado_en timestamptz not null default now()
);

create index idx_diagnosticos_equipo on diagnosticos(equipo_id);

-- Row Level Security

alter table grupos enable row level security;
alter table casos enable row level security;
alter table equipos enable row level security;
alter table consultas enable row level security;
alter table diagnosticos enable row level security;

-- Políticas para llave anónima

create policy "Lectura de grupos" on grupos
  for select using (true);

create policy "Lectura de casos del grupo" on casos
  for select using (true);

create policy "Lectura de equipos" on equipos
  for select using (true);

create policy "Inserción de equipos" on equipos
  for insert with check (true);

create policy "Actualización de equipo propio" on equipos
  for update using (true);

create policy "Lectura de consultas" on consultas
  for select using (true);

create policy "Inserción de consultas" on consultas
  for insert with check (true);

create policy "Lectura de diagnósticos" on diagnosticos
  for select using (true);

create policy "Inserción de diagnósticos" on diagnosticos
  for insert with check (true);

-- Realtime

alter publication supabase_realtime add table equipos;
alter publication supabase_realtime add table consultas;
alter publication supabase_realtime add table grupos;
