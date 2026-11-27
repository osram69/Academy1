# Utenti di /materiali semplificati e creazione utenti dal backend: progetto

Data: 2026-11-28 (rivisto più volte con il trainer). Stato: **da approvare**.

## Perché
Oggi per dare accesso ai materiali bisogna compilare un modulo lungo (nome, email, ruolo, cartelle, invito via email), e per dare accesso al pannello bisogna passare dalla
dashboard di Supabase e poi assegnare il livello. Il trainer vuole poter definire **un account (nome utente e password) da comunicare a tutti i ragazzi di un corso**,
scegliendo solo quali cartelle possono vedere, e creare administrator e trainer del pannello direttamente da Impostazioni.

## Obiettivi
1. **Materiali → scheda "Utenti" (il selettore "File / Utenti" resta com'è):** si definiscono solo **nome utente**, **password** e **cartelle visibili**. La password resta visibile e copiabile.
2. **Impostazioni → Amministratori (solo superuser):** creare un `administrator` o un `trainer` del pannello con un solo modulo.

## Non obiettivi
- Niente email, nomi, inviti o link di reset nel modulo degli utenti di `/materiali`.
- Niente trainer di `/materiali`: il modulo non offre più il ruolo, e tutti gli utenti nuovi sono studenti (sola lettura). I file si gestiscono dal backend (scheda "File").
- Niente sincronizzazione con la board sul Raspberry.
- Gli account già esistenti (anche quelli con ruolo trainer di `/materiali`) non vengono migrati, rimossi né declassati: continuano a funzionare finché non li elimini.

## Anti-obiettivi
- Che un trainer o un administrator possa diventare superuser dalla pagina.
- Che cambiare la password di un utente lasci entrare chi era già dentro con la vecchia (oggi le sessioni cadono già: va mantenuto).

## Vincoli
- Si lavora nel repository del sito (Next.js, Hostinger). Gli utenti di `/materiali` stanno in `users.json` dentro `MATERIALI_DIR`, non in Supabase.
- Il sito ha già `SUPABASE_SERVICE_ROLE_KEY`: basta per creare utenti Supabase dal server.
- Il livello `trainer` del pannello e la migrazione 10 esistono già.
- Il corso è mercoledì 2 dicembre 2026: modifiche piccole e a basso rischio.

## Approcci considerati
1. **Semplificare il modulo e il salvataggio degli utenti esistenti (scelto).** Il login, la sessione e i permessi per cartella restano quelli di oggi; cambiano il modulo, la conservazione della password in chiaro e il minimo di lunghezza.
2. Un nuovo tipo di account "del corso" con una schermata per corso: più codice e un secondo meccanismo, senza vantaggi rispetto a "utente + cartelle" (che già permette un account per più corsi o più account per un corso).

Per la creazione utenti del pannello: **password provvisoria mostrata una volta**, senza SMTP; scartato l'invito via email di Supabase perché dipende dalla sua configurazione.

## Design

### A. Utenti di `/materiali` (scheda "Utenti")
- **Modulo:** nome utente (3-40 caratteri tra lettere, numeri, `.` `_` `-`; fisso dopo la creazione), password (campo di testo visibile, scritta dal trainer, **Genera** a 8 caratteri senza caratteri ambigui, **Copia**),
  cartelle visibili (caselle per le cartelle esistenti, "Tutte le cartelle", e campo per cartelle non ancora create, come oggi). Nient'altro.
- **Elenco:** nome utente, **password** (in chiaro, con **Copia**), cartelle, **Modifica**, **Elimina**; in più **Copia messaggio per gli studenti** (indirizzo `/materiali`, nome utente, password).
  Gli account vecchi senza password in chiaro mostrano "non rileggibile" finché non si imposta una nuova password.
- **Dati:** la voce di `users.json` ha, oltre all'hash usato per il login, il campo `clear` con la password in chiaro (confermato dal trainer; file con permessi 0600). Il ruolo di un account esistente non cambia quando si modifica dal nuovo modulo.
- **Password:** minimo 8 caratteri (prima 10), per poter usare password generate di 8; massimo 200.
- **Login `/materiali`:** invariato. Il saluto dello studente senza nome è "Benvenuto" al posto di "Ciao <nome utente>".

### B. Creazione utenti del pannello (Impostazioni)
- Modulo: email, livello (`administrator` | `trainer`), password (campo + **Genera**). Il server crea l'utente Supabase con `email_confirm: true`, poi scrive la riga in `admin_emails`;
  se l'utente Supabase esiste già assegna solo il livello. La password provvisoria compare **una sola volta** con **Copia** e non viene salvata dal sito (la tiene Supabase, con hash).
- **Reimposta password** accanto a ogni riga (stessa regola: mostrata una volta).
- I superuser compaiono in sola lettura: il livello `superuser` non si assegna, non si cambia e non si rimuove da qui, e il server rifiuta anche le richieste dirette.
- Solo il superuser. Gli administrator hanno già i menu completi e i trainer il menu ridotto: nessun cambiamento.

## Cosa resta al realizzatore
- Nomi esatti di file e funzioni nuove, test nello stile del repository (`node --test`), testi dei messaggi.

## Scelte mie, da confermare
- Minimo 8 caratteri per tutte le password di `/materiali` (anche quelle individuali nuove).
- Nome utente fisso dopo la creazione.
- Gli account esistenti con ruolo trainer di `/materiali` restano finché non li elimini (non li tolgo io).
- La password provvisoria degli utenti del pannello va a Supabase (con hash): il sito non la tiene in chiaro. Quella in chiaro vale solo per gli utenti di `/materiali`.

## Rischi noti
- Chi conosce nome utente e password entra: è inevitabile con un account condiviso, e per questo cambiare la password chiude l'accesso a chi la conosceva.
- Il limite di 10 tentativi errati in 10 minuti vale per indirizzo IP: una classe dietro lo stesso indirizzo che sbaglia password molte volte può bloccarsi per un po' (comportamento attuale).
