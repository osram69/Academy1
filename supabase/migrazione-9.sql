-- Cube Academy — migrazione 9: due livelli per gli amministratori del pannello.
-- Esegui nel SQL Editor di Supabase dopo le migrazioni precedenti. È idempotente.
--
--   superuser      accesso completo, comprese le Impostazioni (pagamenti, codici sconto) e la gestione degli amministratori
--   administrator  vede e gestisce tutto (corsi, eventi, iscrizioni, materiali) tranne le Impostazioni
--
-- Gli amministratori già presenti diventano superuser: nessuno perde l'accesso.
-- Gli utenti si creano da Authentication > Users; il livello si assegna da Impostazioni > Amministratori (solo superuser)
-- oppure da SQL:  insert into public.admin_emails (email, ruolo) values ('nome@dominio.it', 'administrator');

alter table public.admin_emails add column if not exists ruolo text not null default 'superuser';
alter table public.admin_emails drop constraint if exists admin_emails_ruolo_check;
alter table public.admin_emails add constraint admin_emails_ruolo_check check (ruolo in ('administrator', 'superuser'));

-- livello dell'utente che ha fatto l'accesso: 'superuser', 'administrator' oppure null (non abilitato)
create or replace function public.admin_role() returns text
language sql stable security definer set search_path = public as $$
  select ruolo from public.admin_emails
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create or replace function public.is_superuser() returns boolean
language sql stable security definer set search_path = public as $$
  select public.admin_role() = 'superuser';
$$;

-- le impostazioni (metodi di pagamento, sconto privati, codici sconto) le scrive e le legge solo il superuser
drop policy if exists impostazioni_admin_all on public.impostazioni;
drop policy if exists impostazioni_superuser_all on public.impostazioni;
create policy impostazioni_superuser_all on public.impostazioni
  for all to authenticated using (public.is_superuser()) with check (public.is_superuser());
