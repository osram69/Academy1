# Cube Academy — sito + gestione corsi

Frontend React/Vite + backend Node/Express che legge i corsi dal database MySQL/MariaDB
(la stessa tabella `wp_corsi` usata finora da WordPress) e un pannello di amministrazione
su `#/admin` che sostituisce il plugin WordPress "Cube Academy - Gestione Corsi".

## Setup

1. `cp .env.example .env` e compila i dati del database (Hostinger → hPanel → Database → Gestione).
   `CORSI_TABLE` è `wp_corsi` finché non rinomini la tabella.
2. `npm install`
3. Crea il primo utente admin (le password sono salvate come hash bcrypt in `admin_users`):
   `npm run create-admin -- <utente> <password-di-almeno-10-caratteri>`
4. Sviluppo: `npm run dev` (API su :3001, sito su :5173 con proxy `/api`).
5. Produzione: `npm run build && npm start` — Express serve `dist/` e le API sulla stessa porta.

All'avvio il server esegue migrazioni idempotenti sulla tabella corsi: aggiunge `data_inizio`,
`data_fine`, `posti_totali`, `posti_disponibili` e le compila (le date) leggendo il testo di `Data-IT`.
Crea inoltre la tabella `admin_users`. Le colonne esistenti non vengono modificate.

## Come i dati del DB diventano le card

| Campo DB | Sul sito |
| --- | --- |
| `stato` 0 / 1 / 3 / 4 | edizione in programma (card completa) |
| `stato` 5 (Completato) | card "Edizione conclusa" nello storico (senza prezzo né CTA) |
| `stato` 2 (Non visualizzato) | nascosto |
| `iscrizioni_aperte` = 0 | badge "Lista d'attesa" |
| `early_bird_price` + `early_bird_start/end` | prezzo scontato e countdown (il prezzo esplicito ha la precedenza sulla percentuale) |
| `Luogo-IT` = "Online" | formato Live Online; titolo con "Residential" → Prestige; altrimenti In Aula |
| `posti_totali` / `posti_disponibili` | barra posti (nascosta se vuoti) |

## Sicurezza

- Login con cookie `httpOnly` + `SameSite=Strict`, sessione 8 ore, rate limit sui tentativi.
- Le richieste di modifica richiedono l'header `X-Requested-With` (difesa CSRF aggiuntiva).
- L'API pubblica (`GET /api/corsi`) non espone codici sconto né l'HTML delle descrizioni.
- Query sempre parametrizzate; le colonne modificabili sono in whitelist (`server/columns.js`).
