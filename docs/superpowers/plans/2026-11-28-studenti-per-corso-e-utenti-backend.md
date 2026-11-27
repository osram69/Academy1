# Utenti di /materiali semplificati e creazione utenti dal backend: piano di realizzazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Il modulo "Utenti" di Materiali chiede solo nome utente, password e cartelle visibili (password sempre visibile e copiabile); il superuser crea administrator e trainer del pannello da Impostazioni.

**Architecture:** Si resta sul sistema di utenti esistente (`users.json`, login e cookie invariati): cambiano il modulo, il campo `clear` con la password in chiaro e il minimo di lunghezza. La creazione utenti del pannello vive in un modulo con il client Supabase iniettato, quindi si prova con un finto client.

**Tech Stack:** Next.js (App Router), React 19, Node ≥ 20.12 (`node:test`, `node:crypto`), Supabase JS (`auth.admin`), TypeScript per UI e rotte.

**Spec:** `docs/superpowers/specs/2026-11-27-studenti-per-corso-e-utenti-backend-design.md`

## Global Constraints

- Password degli utenti di `/materiali`: scritta dal trainer, da 8 a 200 caratteri (`MIN_PASSWORD` passa da 10 a 8); conservata come hash scrypt (campo `hash`, usato per il login) e in chiaro (campo `clear`; `users.json` con permessi 0600).
- Nome utente: 3-40 caratteri tra lettere, numeri, `.` `_` `-` (regola `USERNAME` già in `materiali.mjs`); fisso dopo la creazione.
- Il modulo non invia email, nome, ruolo né invito. Il ruolo di un account esistente non cambia quando lo si modifica dal modulo; i nuovi account sono `studente`.
- Generatore: 8 caratteri per le password di `/materiali`, 12 per quelle degli utenti del pannello; alfabeto senza `I l O 0 1`, con almeno una maiuscola, una minuscola, una cifra e un simbolo di `!@#$%&*?`.
- Password provvisoria degli utenti del pannello: minimo 10 caratteri, mai conservata dal sito, mostrata una sola volta.
- Livelli assegnabili da pagina: solo `administrator` e `trainer`; `superuser` solo da SQL e intoccabile da pagina e API.
- Gli account esistenti (anche con ruolo trainer di `/materiali`) non vengono migrati né declassati.
- Il selettore della pagina Materiali resta "File" / "Utenti". Lingua dell'interfaccia: italiano.

## Review Focus

- Cambiare la password di un utente: la sessione già aperta con la vecchia non vale più (Task 2).
- Modificare dal nuovo modulo un account esistente con ruolo trainer di `/materiali`: il ruolo e le altre sue proprietà (email, nome) non si perdono (Task 2).
- Nome utente già usato (anche con maiuscole diverse) o con caratteri non validi: rifiutato senza toccare nulla (Task 2).
- `clear` non deve comparire dove non serve: l'elenco admin lo mostra, le pagine e le rotte degli studenti no (Task 2).
- Creazione utente del pannello quando l'utente Supabase esiste già o quando la scrittura in `admin_emails` fallisce dopo aver creato l'account: niente account orfano né doppioni (Task 4).

---

## File structure

- Create `shared/password.mjs`, `shared/password.d.mts`: generatore di password (server e interfaccia).
- Modify `server/materiali.mjs`: password in chiaro, minimo 8, ruolo preservato, `listUsers` espone `password`.
- Modify `src/admin/MaterialiUsers.tsx` (modulo ed elenco), `src/app/materiali/page.tsx` (saluto e testo di aiuto).
- Create `server/admin-accounts.mjs`: creazione e reimpostazione password degli utenti del pannello.
- Modify `server/core.mjs`, `src/app/api/admin/amministratori/route.ts`, `src/admin/AdminAccounts.tsx`, `package.json` (script `test`).
- Tests: `shared/password.test.mjs`, `server/materiali-utenti.test.mjs`, `server/admin-accounts.test.mjs`.

---

### Task 1: generatore di password

**Files:**
- Create: `shared/password.mjs`, `shared/password.d.mts`
- Test: `shared/password.test.mjs`
- Modify: `package.json` (aggiungi `"test": "node --test"` agli script)

**Interfaces:**
- Produces: `generatePassword(length = 8, rnd = cryptoInt): string`; `cryptoInt(max: number): number` (da `globalThis.crypto.getRandomValues`, senza distorsione).

- [ ] **Step 1: test** in `shared/password.test.mjs`: 500 password da `generatePassword()` hanno lunghezza 8, almeno una maiuscola, una minuscola, una cifra, un simbolo di `!@#$%&*?` e nessun carattere di `Il O01`; `generatePassword(12).length === 12`; 50 password sono tutte diverse.
- [ ] **Step 2: eseguire** `node --test shared/password.test.mjs`. Atteso: FALLISCE (modulo mancante).
- [ ] **Step 3: implementare** `shared/password.mjs` e `shared/password.d.mts`: una per categoria, il resto a caso, poi mescolata (Fisher-Yates con `rnd`).
- [ ] **Step 4: eseguire** `npm test`. Atteso: PASSA.
- [ ] **Step 5: commit** `git add shared package.json && git commit -m "Generatore di password condiviso"`.

### Task 2: utenti di `/materiali` con password visibile

**Files:**
- Modify: `server/materiali.mjs` (`MIN_PASSWORD` a riga 60; `createUser`/`updateUser` righe ~210-236; `listUsers` riga ~185; `cleanFields` riga ~198)
- Modify: `server/materiali-admin.mjs` (`adminMaterialiCreate`: senza `password` e senza posta resta l'errore attuale)
- Test: `server/materiali-utenti.test.mjs`

**Interfaces:**
- Consumes: `createUser`, `updateUser`, `listUsers`, `login`, `userFromToken` esistenti.
- Produces: `MIN_PASSWORD = 8`; `createUser(b)` e `updateUser(username, b)` scrivono anche `clear: <password>` quando la password è fornita (in `updateUser` senza password restano `hash` e `clear` come sono); `updateUser` mantiene `role`, `email` e `name` esistenti quando `b` non li contiene; `listUsers()` aggiunge `password: string` (vuota se `clear` manca).

- [ ] **Step 1: test** in `server/materiali-utenti.test.mjs` (prima di importare `materiali.mjs` impostare `process.env.MATERIALI_DIR` su una cartella temporanea e `MATERIALI_SESSION_SECRET`):
  - `createUser({ username: "cpsa-dic26", password: "abcd1234", folders: ["CPSA-F_Dic26"] })` → `{ username }`; `login("cpsa-dic26", "abcd1234", "ip1")` dà `token`; `userFromToken(token)` ha `role: "studente"` e `folders: ["CPSA-F_Dic26"]`; `listUsers()` contiene quell'utente con `password: "abcd1234"`;
  - password di 7 caratteri → `{ error }`; di 201 → `{ error }`; nome utente non valido (`"ab"`, `"con spazi"`) → `{ error }`;
  - nome utente già usato, anche con maiuscole diverse → `{ error }` e nessuna modifica;
  - `updateUser("cpsa-dic26", { password: "nuova5678", folders: [...] })`: il token emesso prima non vale più (`userFromToken` → `null`), il login con la nuova funziona, `listUsers()` mostra la nuova password;
  - `updateUser` su un utente esistente con `role: "trainer"`, `email` e `name`, senza questi campi nel corpo: dopo l'aggiornamento restano tutti e tre invariati;
  - un utente creato prima di questa modifica (voce senza `clear`) compare con `password: ""` e continua a entrare;
  - su sistemi POSIX `users.json` ha permessi 0600 (su Windows saltare l'asserzione).
- [ ] **Step 2: eseguire** `node --test server/materiali-utenti.test.mjs`. Atteso: FALLISCE.
- [ ] **Step 3: implementare** le modifiche in `materiali.mjs` (messaggi di errore con il nuovo minimo 8) e, dove serve, in `materiali-admin.mjs`.
- [ ] **Step 4: eseguire** `npm test`. Atteso: tutti PASSANO.
- [ ] **Step 5: commit** `git add server && git commit -m "Materiali: password visibile e minimo 8 caratteri per gli utenti"`.

### Task 3: modulo ed elenco "Utenti" semplificati

**Files:**
- Modify: `src/admin/MaterialiUsers.tsx` (modulo `Form`, `open`, `submit`, tabella), `src/app/materiali/page.tsx` (testo di aiuto del login: "Inserisci il nome utente e la password ricevuti da Cube Academy"; titolo dello studente "Benvenuto" quando `user.fullName` è vuoto, "Ciao <nome>" altrimenti)

**Interfaces:**
- Consumes: `GET/POST/PATCH/DELETE /api/admin/materiali` esistenti; `listUsers` con `password` (Task 2); `generatePassword` da `../../shared/password.mjs`.
- Produces: nessuna nuova rotta. Il corpo di `POST`/`PATCH` contiene solo `{ username, password, folders, invite: false }`.

- [ ] **Step 1: implementare**: il modulo contiene solo **Nome utente** (disabilitato in modifica), **Password** (testo visibile) con **Genera** (`generatePassword(8)`) e **Copia**, e le **Cartelle visibili** (caselle, "Tutte le cartelle", campo per cartelle non ancora create). Via ruolo, nome, email, invito, avviso SMTP e "Invia link password". In modifica la password parte compilata con quella salvata (se c'è). La tabella ha colonne **Utente**, **Password** (con **Copia**; "non rileggibile" se vuota), **Cartelle**, azioni **Modifica**, **Copia messaggio** (indirizzo `/materiali` da `location.origin`, nome utente e password) ed **Elimina**. Il selettore "File / Utenti" in `Materiali.tsx` non cambia.
- [ ] **Step 2: eseguire** `npm test` e `npx tsc --noEmit`. Atteso: PASSANO, nessun errore.
- [ ] **Step 3: verifica a mano** con `npm run dev` (serve `MATERIALI_DIR`): creare un utente con password generata e due cartelle, riaprire la pagina e ritrovare password e cartelle, entrare da `/materiali` in una finestra anonima, cambiare la password e verificare che la finestra già aperta venga disconnessa; modificare un account vecchio e verificare che il suo ruolo non cambi.
- [ ] **Step 4: commit** `git add src && git commit -m "Admin: modulo Utenti con solo nome utente, password e cartelle"`.

### Task 4: creazione e reimpostazione degli utenti del pannello (server)

**Files:**
- Create: `server/admin-accounts.mjs`
- Modify: `server/core.mjs` (`ROLES` → `["trainer","administrator"]`; `adminAccountAdd` delega a `createAdminUser(db, body)`; `adminAccountUpdate` e `adminAccountDelete` rifiutano le righe `superuser` con 403 "Il superuser si gestisce solo da SQL."; nuova `adminAccountResetPassword(email, body)`), `src/app/api/admin/amministratori/route.ts` (in `PATCH`, se `body.action === "reset"` chiama la reimpostazione, altrimenti il cambio di livello come oggi)
- Test: `server/admin-accounts.test.mjs`

**Interfaces:**
- Consumes: `generatePassword` (Task 1), `isEmail` da `shared/validators.mjs`.
- Produces: `createAdminUser(db, body: { email: string; ruolo: string; password?: string }): Promise<{ status, body }>` con `body` = `{ email, ruolo, created: boolean, password?: string }` (la password solo se l'utente Supabase è stato creato ora); `resetAdminPassword(db, email: string, body: { password?: string }): Promise<{ status, body: { email, password } | { error } }>`. `db` è il client Supabase (qui un finto con `from(...)` e `auth.admin.{createUser,deleteUser,listUsers,updateUserById}`).

- [ ] **Step 1: test con finto client** in `server/admin-accounts.test.mjs`:
  - email non valida → 400; `ruolo: "superuser"` → 403; `ruolo: "boh"` → 400; password scritta di 9 caratteri → 400;
  - creazione riuscita con password scritta: `createUser` chiamato con `email_confirm: true`, riga in `admin_emails` con il livello, risposta `created: true` e `password` uguale a quella scritta;
  - password assente: ne viene generata una di 12 caratteri e restituita;
  - utente Supabase già esistente (l'errore di `createUser` contiene "already registered"): solo la riga in `admin_emails`, `created: false`, nessuna `password` nella risposta;
  - email già in `admin_emails` → 409 e `createUser` non chiamato;
  - inserimento in `admin_emails` fallito dopo la creazione: l'utente appena creato viene eliminato (`deleteUser` con il suo id) e la risposta è un errore 500;
  - `resetAdminPassword` su un administrator: trova l'utente scorrendo `listUsers` per pagine e chiama `updateUserById(id, { password })`, risposta con la nuova password; su un superuser → 403; su un'email non presente in `admin_emails` → 404.
- [ ] **Step 2: eseguire** `node --test server/admin-accounts.test.mjs`. Atteso: FALLISCE.
- [ ] **Step 3: implementare** `server/admin-accounts.mjs` (solo `shared/*`, nessun import da `core.mjs`) e il collegamento in `core.mjs` e nella rotta; `adminAccountsList` continua a elencare anche i superuser con il loro livello.
- [ ] **Step 4: eseguire** `npm test` e `npx tsc --noEmit`. Atteso: PASSANO, nessun errore.
- [ ] **Step 5: commit** `git add server src && git commit -m "Impostazioni: creazione e reimpostazione degli utenti del pannello, superuser solo da SQL"`.

### Task 5: interfaccia di Impostazioni → Amministratori

**Files:**
- Modify: `src/admin/AdminAccounts.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/amministratori` (corpo `{ email, ruolo, password? }`, risposta `{ email, ruolo, created, password? }`), `PATCH /api/admin/amministratori?email=<email>` con `{ action: "reset", password? }` (risposta `{ email, password }`), `generatePassword(12)` da `../../shared/password.mjs`.

- [ ] **Step 1: implementare**: il modulo di aggiunta ha email, livello (solo Administrator e Trainer), password (campo di testo, opzionale) con **Genera**; il testo di aiuto spiega che l'utente viene creato qui e non serve passare da Supabase. A creazione riuscita con `password` nella risposta compare un riquadro "Password provvisoria (mostrata una sola volta)" con **Copia**; senza `password` un messaggio "L'utente esisteva già: livello assegnato". Nell'elenco: le righe `superuser` mostrano il livello come testo, senza menu né **Rimuovi**; le altre hanno il menu del livello (solo Administrator e Trainer), **Reimposta password** (mostra la nuova password una sola volta) e **Rimuovi**. Aggiornare il commento in testa al file.
- [ ] **Step 2: eseguire** `npx tsc --noEmit` e `npm run build`. Atteso: nessun errore.
- [ ] **Step 3: verifica a mano**: da superuser creare un trainer con password generata e un administrator con password scritta; entrare con ciascuno (finestra anonima) e controllare i menu (trainer: solo Materiali e "Accedi alla board"; administrator: completo); reimpostare la password di uno e rientrare; verificare che un superuser non abbia menu né pulsanti di modifica.
- [ ] **Step 4: commit** `git add src && git commit -m "Impostazioni: modulo per creare administrator e trainer"`.

---

## Self-review

- **Copertura del progetto:** A (modulo con solo nome utente, password e cartelle; password visibile e copiabile; minimo 8; ruolo e dati vecchi preservati; saluto "Benvenuto"; selettore File/Utenti invariato) → Task 1-3. B (creazione utenti del pannello, password una sola volta, reimposta, superuser intoccabile, livelli assegnabili) → Task 4 e 5.
- **Coerenza di nomi e tipi:** `generatePassword` ha la stessa firma nei Task 1, 3, 4, 5; `listUsers().password` (Task 2) è ciò che usa la tabella del Task 3; `createAdminUser`/`resetAdminPassword` (Task 4) sono ciò che usano rotta e interfaccia del Task 5.
- **Proporzione:** il piano contiene firme, nomi di test e asserzioni; i corpi restano al realizzatore.
- **Da ricordare all'esecuzione:** la verifica a mano dei Task 3 e 5 richiede `.env` con Supabase e `MATERIALI_DIR`; senza, ci si ferma ai test automatici e al `build`.
