# Cube Academy — sito + gestione corsi

Sito React in un'app **Next.js** (come romaofficesharing.it). I corsi
vivono in un database **Supabase** (Postgres) e il sito li legge dal browser; iscrizioni e pagamenti
(Stripe, PayPal, SumUp, bonifico) passano dal server, che custodisce le chiavi segrete. Il pannello
`#/admin` sostituisce il plugin WordPress "Cube Academy - Gestione Corsi".

## Deploy su Hostinger (app Next.js)

Il progetto è un'app **Next.js** (come romaofficesharing.it): l'interfaccia è una single-page app a rotte con
hash (`#/corsi`, `#/admin`, ...) e le API di iscrizione e pagamento sono Route Handler (`src/app/api`).

1. hPanel → **Siti web → Aggiungi sito → App Node.js**, collega il repository GitHub (branch `main`).
2. Framework **Next.js**, Node 20+, build `npm run build`, output `.next`, start `npm start`.
3. **Environment variables**: copia i nomi da `.env.example` (stessi nomi di romaofficesharing:
   `STRIPE_SECRET_TEST`, `PAYPAL_CLIENT_ID_TEST`, `SUMUP_API_KEY_TEST`, `BANK_IBAN`, ...) più
   `SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (queste ultime servono **al momento della build**; vanno bene anche i
   vecchi nomi `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
4. Supabase → SQL Editor: esegui `supabase/orders.sql` (tabella `iscrizioni`, accessibile solo al server) e poi
   `supabase/migrazione-2.sql` (modalità di fruizione dei corsi e tabella `impostazioni`) e
   `supabase/migrazione-3.sql` (sconto privati per corso e ambito dei codici sconto),
   `supabase/migrazione-4.sql` (workshop: immagine, link LinkedIn, archivio immagini),
   `supabase/migrazione-5.sql` (tabella eventi gestita dal pannello) e
   `supabase/migrazione-6.sql` (titolo dei workshop nelle altre lingue).
5. Webhook: Stripe → `https://<dominio>/api/webhook/stripe`, PayPal → `https://<dominio>/api/webhook/paypal`.
   (SumUp non ha webhook firmati: il pagamento è verificato dal server al ritorno dal checkout.)
6. Per passare in produzione: valorizza le chiavi live e, da `#/admin/impostazioni`, porta il metodo da Sandbox a Live.
7. Email: imposta `SMTP_HOST` (es. `smtp.hostinger.com`), `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`,
   `MAIL_FROM_NAME` (e, se vuoi cambiarli, `MAIL_STAFF_TO` / `MAIL_STAFF_CC`: di default `academy@cubeng.eu` e
   `registrazioni@cubeng.eu`, come nel plugin WordPress). Senza SMTP le iscrizioni funzionano ma le email non partono.
   Lo stesso SMTP serve al **modulo di contatto** (`#/contatti`): il messaggio arriva a `MAIL_STAFF_TO` con
   Reply-To del mittente, e il mittente riceve una copia.
   **Traduzioni automatiche**: il pulsante «Traduci per le altre lingue» dei workshop e degli eventi usa Claude se
   imposti `ANTHROPIC_API_KEY` (modello in `TRANSLATE_MODEL`, default `claude-haiku-5-5`); senza chiave ripiega
   sul servizio gratuito MyMemory (qualità inferiore e limite giornaliero, alzabile con `TRANSLATE_EMAIL`).
   Il risultato va sempre controllato prima di salvare.
8. Verifica: `https://<dominio>/api/config` deve rispondere con un JSON (`privateDiscount`, `methods`).

Il server calcola prezzo, sconti e IVA da solo (il browser non decide l'importo), accetta al massimo
12 partecipanti per edizione (limite iSAQB con un solo docente) e verifica ogni pagamento direttamente
sul provider prima di segnare l'ordine come pagato. Un metodo senza chiavi configurate resta disattivato.

## Lingue (IT · EN · FR · DE)

Il sito pubblico è tradotto in quattro lingue; il pannello `#/admin` resta in italiano. La lingua si sceglie
dal selettore in alto (si ricorda nel browser; al primo accesso segue la lingua del browser).
I testi stanno in `src/i18n/{en,fr,de}.ts`: la chiave è il testo italiano usato nel codice con `t("...")`.
Un testo senza traduzione compare in italiano. Luogo e lingua dei corsi vengono dalle colonne
`luogo_xx`/`lingua_xx` del database, già modificabili dal pannello.

## Privacy e cookie

Informativa privacy e cookie policy (IT/EN/FR/DE) stanno in `src/legal/content.ts` e si aprono come pagine
(`#/privacy`, `#/cookie-policy`) e come popup dal footer, dal banner e dal consenso privacy dei moduli.
All'apertura del sito il banner chiede la scelta sui cookie (necessari, analitici, marketing; si riapre da
"Impostazioni cookie" nel footer). Google Tag Manager si attiva solo con `NEXT_PUBLIC_GTM_ID` e dopo il consenso.
I testi vanno rivisti dal titolare / dal consulente legale prima della pubblicazione.

## Pannello di gestione (`#/admin`)

- **Corsi**: edizioni, prezzi, early bird, posti, modalità di fruizione e calendario delle sessioni.
- **Iscrizioni**: elenco degli ordini (sandbox marcati "prova").
- **Impostazioni**: metodi di pagamento attivi, sandbox/live per ogni provider (con l'elenco delle variabili
  d'ambiente mancanti), sconto privati (default 50% sul listino, in aggiunta all'early bird) e codici sconto
  globali con periodo di validità e tipologie di fatturazione. Le modifiche valgono entro pochi secondi.

Sviluppo locale: `npm run dev` (sito e API sulla stessa porta, 3000).

## Setup Supabase (una tantum)

1. Crea un progetto su supabase.com.
2. **SQL Editor** → esegui `supabase/schema.sql` (tabella `corsi`, vista pubblica, sicurezza RLS).
3. **SQL Editor** → esegui `corsi_seed_supabase.sql` (i 19 corsi esistenti, generato dal dump `wp_corsi`;
   contiene i codici sconto, quindi non è nel repository).
4. **Authentication → Users → Add user**: crea il tuo utente (email + password).
   **Authentication → Sign In / Providers → Email**: disattiva "Allow new users to sign up".
5. Abilita l'utente come amministratore (SQL Editor):
   ```sql
   insert into public.admin_emails (email) values ('tua@email.it');
   ```
6. **Project Settings → API**: copia *Project URL* e la chiave *anon public*.

## Variabili d'ambiente

Copia `.env.example` in `.env` (sviluppo) e imposta le stesse due variabili nelle impostazioni di build
di Hostinger (vengono incorporate nel sito al momento della build):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

L'URL e la chiave `anon` sono pubblici per progetto: la protezione dei dati è nella RLS del database.
Non usare mai la chiave `service_role` nel frontend.

## Sviluppo e build

```
npm install
npm run dev      # sviluppo
npm run build    # produzione (.next/)
npm start        # avvia la build di produzione
```

## Come i dati diventano le card

| Campo | Sul sito |
| --- | --- |
| `stato` 0 / 1 / 3 / 4 | edizione in programma (card completa) |
| `stato` 5 (Completato) | card "Edizione conclusa" nello storico (senza prezzo né CTA) |
| `stato` 2 (Non visualizzato) | nascosto |
| `iscrizioni_aperte` = false | badge "Lista d'attesa" |
| `early_bird_price` + `early_bird_start/end` | prezzo scontato e countdown (il prezzo esplicito ha la precedenza sulla percentuale) |
| `luogo_it` = "Online" | formato Live Online; titolo con "Residential" → Prestige; altrimenti In Aula |
| `posti_totali` / `posti_disponibili` | barra posti (nascosta se vuoti) |

## Sicurezza

- Il sito legge solo la vista `corsi_public`: solo corsi visibili, senza codici sconto né HTML lungo.
- La tabella `corsi` è accessibile soltanto agli utenti la cui email è in `admin_emails` (policy RLS).
- Il pannello usa Supabase Auth (sessione JWT); le registrazioni pubbliche vanno disattivate (punto 4).
