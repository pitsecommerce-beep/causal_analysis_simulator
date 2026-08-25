-- Tabla de usuarios con roles por dominio de correo

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  rol text not null check (rol in ('participante', 'docente', 'superadmin')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'denegado')),
  creado_en timestamptz not null default now()
);

create index idx_usuarios_email on usuarios(email);
create index idx_usuarios_estado on usuarios(estado);

-- RLS
alter table usuarios enable row level security;

create policy "Lectura de usuarios" on usuarios
  for select using (true);

create policy "Insercion de usuarios" on usuarios
  for insert with check (true);

create policy "Actualizacion de usuarios" on usuarios
  for update using (true);

-- Realtime para actualizaciones de estado
alter publication supabase_realtime add table usuarios;
