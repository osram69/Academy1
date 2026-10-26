# Cube Academy — sito + gestione corsi

Sito React/Vite servito da un piccolo **server Node.js** (`server/`), come romaofficesharing.it. I corsi
vivono in un database **Supabase** (Postgres) e il sito li legge dal browser; iscrizioni e pagamenti
(Stripe, PayPal, SumUp, bonifico) passano dal server, che custodisce le chiavi segrete. Il pannello
`#/admin` sostituisce il plugin WordPress "Cube Academy - Gestione Corsi".

## Deploy su Hostinger (app Node.js)

1. hPanel → **Siti web → Aggiungi sito → App Node.js**, collega il repository GitHub (branch `main`).
2. Build command `npm ci && npm run build`, start command `npm start`, Node 20+.
3. **Environment variables**: copia i nomi da `.env.example` (stessi nomi di romaofficesharing:
   `STRIPE_SECRET_TEST`, `PAYPAL_CLIENT_ID_TEST`, `SUMUP_API_KEY_TEST`, `BANK_IBAN`, ...) più
   `SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e le due `VITE_*`
   (servono al momento della build).
4. Supabase → SQL Editor: esegui `supabase/orders.sql` (tabella `iscrizioni`, accessibile solo al server) e poi
   `supabase/migrazione-2.sql` (modalità di fruizione dei corsi e tabella `impostazioni`).
5. Webhook: Stripe → `https://<dominio>/api/webhook/stripe`, PayPal → `https://<dominio>/api/webhook/paypal`.
   (SumUp non ha webhook firmati: il pagamento è verificato dal server al ritorno dal checkout.)
6. Per passare in produzione: valorizza le chiavi live e, da `#/admin/impostazioni`, porta il metodo da Sandbox a Live.

Il server calcola prezzo, sconti e IVA da solo (il browser non decide l'importo), accetta al massimo
12 partecipanti per edizione (limite iSAQB con un solo docente) e verifica ogni pagamento direttamente
sul provider prima di segnare l'ordine come pagato. Un metodo senza chiavi configurate resta disattivato.

## Lingue (IT · EN · FR · DE)

Il sito pubblico è tradotto in quattro lingue; il pannello `#/admin` resta in italiano. La lingua si sceglie
dal selettore in alto (si ricorda nel browser; al primo accesso segue la lingua del browser).
I testi stanno in `src/i18n/{en,fr,de}.ts`: la chiave è il testo italiano usato nel codice con `t("...")`.
Un testo senza traduzione compare in italiano. Luogo e lingua dei corsi vengono dalle colonne
`luogo_xx`/`lingua_xx` del database, già modificabili dal pannello.

## Pannello di gestione (`#/admin`)

- **Corsi**: edizioni, prezzi, early bird, posti, modalità di fruizione e calendario delle sessioni.
- **Iscrizioni**: elenco degli ordini (sandbox marcati "prova").
- **Impostazioni**: metodi di pagamento attivi, sandbox/live per ogni provider (con l'elenco delle variabili
  d'ambiente mancanti), sconto privati (default 50% sul listino, in aggiunta all'early bird) e codici sconto
  globali con periodo di validità e tipologie di fatturazione. Le modifiche valgono entro pochi secondi.

Sviluppo locale: `npm run server` (porta 3000) e, in un altro terminale, `npm run dev`.

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
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

L'URL e la chiave `anon` sono pubblici per progetto: la protezione dei dati è nella RLS del database.
Non usare mai la chiave `service_role` nel frontend.

## Sviluppo e build

```
npm install
npm run dev      # sviluppo
npm run build    # produzione (dist/)
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
