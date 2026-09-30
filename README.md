# Cube Academy — sito + gestione corsi

Sito React/Vite **statico**. I corsi vivono in un database **Supabase** (Postgres) e il sito li legge
direttamente dal browser: nessun backend da mantenere. Il pannello `#/admin` sostituisce il plugin
WordPress "Cube Academy - Gestione Corsi".

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
