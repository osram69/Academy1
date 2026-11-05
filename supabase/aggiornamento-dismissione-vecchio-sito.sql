-- Toglie dal database i riferimenti al vecchio sito academy.cubeng.eu, che verrà dismesso.
-- Si esegue una volta, dall'SQL Editor di Supabase.

-- 1) Anteprima: righe che oggi puntano al vecchio sito
select 'eventi.immagine_url' as campo, count(*) as righe from public.eventi where immagine_url like '%academy.cubeng.eu%'
union all
select 'corsi.link_booking_*', count(*) from public.corsi
 where link_booking_it like '%academy.cubeng.eu%' or link_booking_en like '%academy.cubeng.eu%'
    or link_booking_fr like '%academy.cubeng.eu%' or link_booking_de like '%academy.cubeng.eu%'
union all
select 'corsi.link_readmore_*', count(*) from public.corsi
 where link_readmore_it like '%academy.cubeng.eu%' or link_readmore_en like '%academy.cubeng.eu%'
    or link_readmore_fr like '%academy.cubeng.eu%' or link_readmore_de like '%academy.cubeng.eu%';

-- 2) Immagini degli eventi: le due foto sono ora sul nuovo sito, negli stessi percorsi (/wp-content/uploads/...)
update public.eventi
   set immagine_url = replace(immagine_url, 'https://academy.cubeng.eu/', '/')
 where immagine_url like 'https://academy.cubeng.eu/%';

-- 3) Link "iscrizione" e "scopri di più" dei corsi: dai vecchi moduli WordPress al catalogo del nuovo sito (nella lingua del campo)
update public.corsi set link_booking_it  = 'https://cubeacademy.eu/corsi'    where link_booking_it  like '%academy.cubeng.eu%';
update public.corsi set link_booking_en  = 'https://cubeacademy.eu/en/corsi' where link_booking_en  like '%academy.cubeng.eu%';
update public.corsi set link_booking_fr  = 'https://cubeacademy.eu/fr/corsi' where link_booking_fr  like '%academy.cubeng.eu%';
update public.corsi set link_booking_de  = 'https://cubeacademy.eu/de/corsi' where link_booking_de  like '%academy.cubeng.eu%';
update public.corsi set link_readmore_it = 'https://cubeacademy.eu/corso-architettura-software'    where link_readmore_it like '%academy.cubeng.eu%';
update public.corsi set link_readmore_en = 'https://cubeacademy.eu/en/software-architect-course' where link_readmore_en like '%academy.cubeng.eu%';
update public.corsi set link_readmore_fr = 'https://cubeacademy.eu/fr/formation-architecte-logiciel' where link_readmore_fr like '%academy.cubeng.eu%';
update public.corsi set link_readmore_de = 'https://cubeacademy.eu/de/software-architekt-kurs' where link_readmore_de like '%academy.cubeng.eu%';

-- 4) Controllo: ripeti la query 1, le tre righe devono dare 0
