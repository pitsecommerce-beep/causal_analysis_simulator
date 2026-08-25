-- Configuración de grupo y participantes invitados

alter table grupos add column if not exists imagen_portada text;
alter table grupos add column if not exists descripcion text;
alter table grupos add column if not exists participantes_invitados jsonb not null default '[]';

-- Política para que docentes puedan actualizar la configuración
create policy "Actualización de grupo" on grupos
  for update using (true);
