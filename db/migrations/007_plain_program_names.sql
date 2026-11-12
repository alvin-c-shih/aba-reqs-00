-- 007 — a family-friendly name per program ("Asking for things he wants" instead of "Manding for preferred items").
alter table programs add column plain_name text not null default '';
alter table program_templates add column plain_name text not null default '';
