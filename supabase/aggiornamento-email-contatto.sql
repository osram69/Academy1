-- Sostituisce il vecchio indirizzo di contatto con quello nuovo nei testi salvati nel database.
-- Si esegue una volta, dall'SQL Editor di Supabase. Non tocca ordini, partecipanti né altri dati.
-- Il vecchio indirizzo compare nelle descrizioni HTML dei corsi importate dal vecchio sito.

-- 1) Anteprima: quante righe contengono il vecchio indirizzo (deve scendere a 0 dopo l'aggiornamento)
select 'corsi' as tabella, count(*) as righe from public.corsi c where to_jsonb(c)::text like '%academy@cubeng.eu%'
union all
select 'eventi', count(*) from public.eventi e where to_jsonb(e)::text like '%academy@cubeng.eu%'
union all
select 'impostazioni', count(*) from public.impostazioni i where to_jsonb(i)::text like '%academy@cubeng.eu%';

-- 2) Aggiornamento: tutte le colonne di testo delle tre tabelle
do $$
declare
  r record;
begin
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('corsi', 'eventi', 'impostazioni')
      and data_type in ('text', 'character varying')
  loop
    execute format(
      'update public.%I set %I = replace(%I, %L, %L) where %I like %L',
      r.table_name, r.column_name, r.column_name,
      'academy@cubeng.eu', 'info@cubeacademy.eu',
      r.column_name, '%academy@cubeng.eu%'
    );
  end loop;
end $$;

-- 3) Controllo: ripeti la query 1, tutte le righe devono essere 0
