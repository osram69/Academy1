-- Cube Academy — migrazione 4: workshop (presentazioni gratuite di circa un'ora).
-- Esegui nel SQL Editor di Supabase dopo migrazione-3.sql. È idempotente.
--
-- I workshop sono righe della tabella corsi con livello = 'Workshop'. Usano solo: titolo, stato,
-- data_inizio, orario_it (es. "18:00–19:00"), luogo_* (es. "Online"), lingua_it, home_subtitle_* (descrizione)
-- e i due campi nuovi qui sotto. Prezzi, early bird, codici sconto e posti non si applicano.

-- 1) Immagine di presentazione e link all'evento (la partecipazione si prenota su LinkedIn)
alter table public.corsi add column if not exists immagine_url text;
alter table public.corsi add column if not exists link_evento  text;

-- 2) Vista pubblica: aggiunge i campi dei workshop (colonne in coda, descrizioni comprese)
create or replace view public.corsi_public as
select
  id_corso, titolo, livello, stato, in_evidenza, iscrizioni_aperte,
  standard_price, early_bird_price, early_bird_start, early_bird_end, early_bird_percentuale,
  data_inizio, data_fine, posti_totali, posti_disponibili,
  data_it, data_en, data_fr, data_de,
  luogo_it, luogo_en, luogo_fr, luogo_de,
  lingua_it, lingua_en, lingua_fr, lingua_de,
  link_booking_it, link_booking_en, link_booking_fr, link_booking_de,
  modalita, orario_it,
  sconto_privati,
  immagine_url, link_evento,
  home_subtitle_it, home_subtitle_en, home_subtitle_fr, home_subtitle_de
from public.corsi
where stato in (0, 1, 3, 4, 5);
grant select on public.corsi_public to anon, authenticated;

-- 3) Archivio immagini dei workshop (lettura pubblica, scrittura solo per gli admin)
insert into storage.buckets (id, name, public)
values ('workshop', 'workshop', true)
on conflict (id) do nothing;

drop policy if exists workshop_public_read on storage.objects;
create policy workshop_public_read on storage.objects
  for select using (bucket_id = 'workshop');

drop policy if exists workshop_admin_insert on storage.objects;
create policy workshop_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'workshop' and public.is_admin());

drop policy if exists workshop_admin_update on storage.objects;
create policy workshop_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'workshop' and public.is_admin());

drop policy if exists workshop_admin_delete on storage.objects;
create policy workshop_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'workshop' and public.is_admin());
