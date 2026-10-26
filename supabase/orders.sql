-- Cube Academy — ordini/iscrizioni. Esegui nel SQL Editor di Supabase dopo schema.sql.
-- Vi accede SOLO il server Node con la chiave service_role (nessuna policy = nessun accesso dal browser).
create table if not exists public.iscrizioni (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null unique,
  id_corso      bigint not null references public.corsi(id_corso),
  created_at    timestamptz not null default now(),
  paid_at       timestamptz,
  -- pending | paid | cancelled | failed | refunded
  status        text not null default 'pending',
  method        text not null check (method in ('stripe','paypal','sumup','bonifico')),
  provider_ref  text,
  test_mode     boolean not null default true,
  seats         integer not null check (seats between 1 and 12),
  unit_cents    integer not null,
  subtotal_cents integer not null,
  discount_cents integer not null default 0,
  vat_cents     integer not null,
  total_cents   integer not null,
  coupon        text,
  participants  jsonb not null,
  billing       jsonb not null
);
create index if not exists iscrizioni_corso_idx on public.iscrizioni (id_corso, status);
alter table public.iscrizioni enable row level security;
