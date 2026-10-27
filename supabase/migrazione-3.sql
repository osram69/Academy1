-- Cube Academy — migrazione 3: sconto privati per corso e ambito dei codici sconto.
-- Esegui nel SQL Editor di Supabase dopo migrazione-2.sql. È idempotente.

-- 1) Sconto privati attivabile per singola edizione (oltre all'interruttore globale in Impostazioni)
alter table public.corsi add column if not exists sconto_privati boolean not null default true;

-- 2) Ambito dei codici sconto di ogni corso: elenco separato da virgole tra
--    privato, pro, azienda, estera. Vuoto = valido per tutte le tipologie.
alter table public.corsi add column if not exists codice_sconto_1_ambiti text;
alter table public.corsi add column if not exists codice_sconto_2_ambiti text;
alter table public.corsi add column if not exists codice_sconto_3_ambiti text;

-- 3) Vista pubblica: aggiunge il flag (gli ambiti dei codici restano riservati al server)
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
  sconto_privati
from public.corsi
where stato in (0, 1, 3, 4, 5);
grant select on public.corsi_public to anon, authenticated;
