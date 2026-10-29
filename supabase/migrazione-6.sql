-- Cube Academy — migrazione 6: titolo dei workshop nelle altre lingue.
-- Esegui nel SQL Editor di Supabase dopo migrazione-5.sql. È idempotente.

alter table public.corsi add column if not exists titolo_en text;
alter table public.corsi add column if not exists titolo_fr text;
alter table public.corsi add column if not exists titolo_de text;

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
  home_subtitle_it, home_subtitle_en, home_subtitle_fr, home_subtitle_de,
  titolo_en, titolo_fr, titolo_de
from public.corsi
where stato in (0, 1, 3, 4, 5);
grant select on public.corsi_public to anon, authenticated;
