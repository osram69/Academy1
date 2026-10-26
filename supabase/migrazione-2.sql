-- Cube Academy — migrazione 2: modalità di fruizione + impostazioni modificabili dal pannello.
-- Esegui nel SQL Editor di Supabase (dopo schema.sql e orders.sql). È idempotente.

-- 1) Modalità di fruizione per edizione
alter table public.corsi add column if not exists modalita text not null default 'intensivo'
  check (modalita in ('intensivo','weekend','serale','mezze_giornate'));
alter table public.corsi add column if not exists orario_it text;  -- es. "Martedì e giovedì, 18:30–21:30"

-- le edizioni "Weekend" già presenti
update public.corsi set modalita = 'weekend' where titolo ilike '%weekend%' and modalita = 'intensivo';

-- 2) Vista pubblica aggiornata (aggiunge le nuove colonne in coda: CREATE OR REPLACE lo consente)
create or replace view public.corsi_public as
select
  id_corso, titolo, livello, stato, in_evidenza, iscrizioni_aperte,
  standard_price, early_bird_price, early_bird_start, early_bird_end, early_bird_percentuale,
  data_inizio, data_fine, posti_totali, posti_disponibili,
  data_it, data_en, data_fr, data_de,
  luogo_it, luogo_en, luogo_fr, luogo_de,
  lingua_it, lingua_en, lingua_fr, lingua_de,
  link_booking_it, link_booking_en, link_booking_fr, link_booking_de,
  modalita, orario_it
from public.corsi
where stato in (0, 1, 3, 4, 5);
grant select on public.corsi_public to anon, authenticated;

-- 3) Impostazioni del sito (una sola riga): metodi di pagamento, sandbox, sconto privati, codici sconto.
--    Le modifica l'admin dal pannello (#/admin/impostazioni); le legge il server con la chiave service_role.
create table if not exists public.impostazioni (
  id         int primary key default 1 check (id = 1),
  config     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.impostazioni enable row level security;
drop policy if exists impostazioni_admin_all on public.impostazioni;
create policy impostazioni_admin_all on public.impostazioni
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.impostazioni (id) values (1) on conflict (id) do nothing;
