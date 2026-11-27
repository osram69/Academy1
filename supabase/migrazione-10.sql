-- Cube Academy — migrazione 10: livello "trainer" per il pannello.
-- Esegui nel SQL Editor di Supabase DOPO la migrazione 9. È idempotente.
--
--   trainer        accede al pannello ma vede solo "Materiali" (file) e il pulsante "Accedi alla board".
--                  Non vede né modifica corsi, eventi, iscrizioni, impostazioni.
--
-- Assegnazione:  insert into public.admin_emails (email, ruolo) values ('trainer@dominio.it', 'trainer');
-- (l'utente va prima creato da Authentication > Users, oppure il superuser lo aggiunge da Impostazioni > Amministratori)

alter table public.admin_emails drop constraint if exists admin_emails_ruolo_check;
alter table public.admin_emails add constraint admin_emails_ruolo_check check (ruolo in ('trainer', 'administrator', 'superuser'));

-- IMPORTANTE: is_admin() è usata dalle policy (RLS) di corsi, eventi, iscrizioni e storage.
-- Un trainer è in admin_emails, ma NON deve essere considerato amministratore dal database.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and ruolo in ('administrator', 'superuser')
  );
$$;
