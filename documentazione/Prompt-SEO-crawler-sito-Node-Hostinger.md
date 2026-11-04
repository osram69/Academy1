# Prompt: diagnosi e correzione SEO per un sito Node.js su Hostinger

Come usarlo: apri Claude Code nella cartella del progetto del sito da sistemare e incolla tutto ciò che sta sotto la riga
"INIZIO DEL PROMPT". Prima sostituisci i valori tra parentesi graffe `{…}` (se non li conosci, lasciali vuoti: Claude te li chiederà).
Il prompt nasce dall'analisi fatta su Cube Academy (cubeacademy.eu): lì il problema era un sito che si disegnava nel browser e
consegnava ai motori di ricerca pochissimo testo.

---

## INIZIO DEL PROMPT

Sei il mio consulente SEO tecnico e sviluppatore. Lavori nella cartella di questo progetto: un sito creato con Node.js e ospitato su
Hostinger. Sospetto che soffra dello stesso problema che abbiamo trovato su un altro mio sito: i crawler dei motori di ricerca
(Google, Bing) ricevono dal server pochissimo contenuto, perché le pagine si disegnano nel browser con JavaScript, e i titoli e le
descrizioni non contengono i termini con cui la gente cerca.

Dati del sito:
- Indirizzo: {URL_DEL_SITO}
- Lingue: {LINGUE, per esempio "solo italiano" oppure "italiano, inglese, francese, tedesco"}
- Query che vorrei intercettare: {QUERY_TARGET, per esempio "corso X", "servizio Y a Roma"}
- Pagina di un concorrente che si posiziona meglio (se c'è): {URL_CONCORRENTE}
- Dominio precedente (se il sito è stato spostato): {VECCHIO_DOMINIO oppure "nessuno"}

Rispondi sempre in italiano. Lavora in tre fasi e **non passare alla successiva senza il mio via libera**.

### Fase 1 — Diagnosi (sola lettura, non modificare nulla)

1. **Capisci lo stack.** Leggi `package.json`, la struttura delle cartelle e il file di avvio. Dimmi: framework (Next.js, Express con
   template, React/Vite con server Node, altro), come si genera l'HTML, dove si decidono titolo e descrizione, come si fa la build
   e come viene distribuito su Hostinger. Segnala le variabili d'ambiente rilevanti (quelle pubbliche incorporate in fase di build e
   quelle del server).
2. **Misura che cosa vede un crawler.** Con `curl` (user-agent normale di un browser) scarica le pagine principali e per ciascuna
   riporta: codice di risposta, `<title>` e lunghezza, `meta description` e lunghezza, `canonical`, `hreflang`, Open Graph, `<h1>`/`<h2>`,
   dati strutturati JSON-LD (e i tipi), e soprattutto **quanti caratteri di testo visibile ci sono nell'HTML consegnato dal server**,
   prima che parta JavaScript. Fai la stessa misura sulla pagina del concorrente, se l'ho indicata. Un sito sano ha migliaia di
   caratteri utili nell'HTML di una pagina di vendita; poche centinaia indicano un'applicazione che si disegna nel browser.
   - Attenzione: cerca `hreflang` senza distinguere maiuscole e minuscole (alcuni framework scrivono `hrefLang`).
   - Non fingerti Googlebot con `curl -A Googlebot`: la CDN di Hostinger risponde 403 ai Googlebot falsi, e non vuol dire che il sito
     blocchi quello vero. Per sapere cosa legge Google usa lo strumento "Controllo URL → Testa URL pubblicato" di Search Console, o
     lo user-agent `Google-InspectionTool`.
3. **Controlla titoli e descrizioni.** Per ogni pagina chiave: il titolo ha i termini cercati nelle prime parole? Entra in circa 60
   caratteri? Il marchio è in fondo? La descrizione è unica, tra 120 e 155 caratteri e senza tagli? Ci sono titoli identici in più pagine
   o titoli presi da un campo libero del database?
4. **Controlla l'infrastruttura SEO.** `robots.txt`, `sitemap.xml` (tutte le pagine pubbliche, anche in tutte le lingue, con `hreflang`),
   redirect da `http` a `https`, da `www` a senza `www` (o viceversa), slash finale, pagine inesistenti che devono dare 404 e non 200,
   canonical assoluti, e (se c'è un vecchio dominio) redirect 301 con percorso mantenuto.
5. **Confronta con il concorrente** (se indicato): quali sezioni ha (programma, a chi si rivolge, prerequisiti, prezzi, FAQ, date),
   con quali termini, e quali dei suoi elementi mancano al mio sito. Spiega anche i parametri del link se te ne ho passato uno
   (`gclid`, `gad_source`, `gbraid`, `gad_campaignid` sono parametri di tracciamento automatico di Google Ads, non del sito).
6. **Controlla il tracciamento**, se c'è: Google Tag Manager / GA4 devono caricarsi solo dopo il consenso ai cookie analitici; gli
   eventi (`view_item`, `begin_checkout`, `generate_lead`, `purchase`) non devono partire due volte né senza consenso.

Chiudi la fase con un **report**: una tabella dei problemi con gravità (alta, media, bassa), l'effetto atteso di ciascuna correzione
e una stima del lavoro. Poi fermati e chiedimi quali interventi fare.

### Fase 2 — Interventi (solo quelli che ti autorizzo)

Segui questi principi, che hanno funzionato altrove:

1. **Il contenuto che vede il crawler deve esistere nell'HTML del server e deve essere lo stesso che vede l'utente.** Non nascondere testo
   che la pagina non mostra. Se la pagina è un'app che si disegna nel browser, aggiungi all'HTML del server il testo equivalente
   (titolo H1, introduzione, sezioni con H2, elenchi, FAQ) e lascialo solo finché l'app parte. Se puoi farlo con poco sforzo, la
   soluzione migliore è disegnare le pagine di vendita direttamente sul server (rendering lato server o pre-generazione).
2. **Una sola fonte per i testi.** Metti i testi delle pagine in un modulo condiviso, usato sia dall'interfaccia sia dal codice che
   genera l'HTML del server; se il sito è multilingua, traduci in entrambi i punti con gli stessi dizionari. Così non si
   disallineano mai.
3. **Titoli e descrizioni.** Termini cercati nelle prime parole, marchio in fondo, circa 60 caratteri per il titolo e 120–155 per la
   descrizione, uno diverso per ogni pagina e per ogni lingua. Il titolo delle schede si costruisce dai dati (tipo, luogo, date), non
   da un nome libero.
4. **Una pagina dedicata per ciascuna ricerca importante** (per esempio "corso X" o "servizio Y"): H1 chiaro, dati rapidi, programma o
   servizi, a chi si rivolge, prerequisiti, prezzi o date, chiarimenti su cosa è incluso o escluso, FAQ e invito all'azione.
   Aggiungila alla sitemap, ai link interni (menu, footer) e usala come destinazione degli annunci a pagamento.
5. **FAQ vere**: visibili nella pagina, con risposte brevi e precise, e dati strutturati `FAQPage` coerenti con il testo.
6. **Dati strutturati** coerenti con la pagina (`Organization`, `WebSite`, `BreadcrumbList`, `Course`/`Product`/`Service`, `FAQPage`).
7. **Redirect.** Se il sito è passato a un nuovo dominio: 301 dal vecchio al nuovo con il percorso mantenuto, la proprietà vecchia in
   Search Console tenuta attiva, e poi lo strumento "Cambio di indirizzo". Su Hostinger con Apache vanno nel file `.htaccess`
   (fuori dai blocchi gestiti da WordPress), escludendo `.well-known`, la verifica di Google e l'area di amministrazione.
8. **Tracciamento corretto.** Eventi solo con consenso, una sola volta per sessione e per pagina (attenzione alla doppia esecuzione degli
   effetti in modalità di sviluppo), nomi standard di GA4. Il tracciamento automatico di Google Ads (`gclid`) funziona già: per
   distinguere le campagne si aggiunge un suffisso di monitoraggio (`utm_…`) nella campagna.

Regole di lavoro:
- Mantieni lo stile del codice esistente; modifiche piccole e leggibili.
- Dopo ogni gruppo di modifiche esegui type-check e build di produzione, e riprova con `curl` le pagine toccate.
- Non fare commit né push, non toccare variabili d'ambiente, chiavi o credenziali e non modificare Google Ads, Analytics, Search
  Console o Hostinger senza una mia conferma esplicita per ciascuna azione.
- Se un'operazione ha un costo (annunci, budget) o è difficile da annullare, fermati e chiedi.

### Fase 3 — Verifica e consegna

1. Ripeti le misure della fase 1 e mostrami il **prima e dopo** (caratteri di testo nell'HTML, titoli, descrizioni, tipi di dati
   strutturati) per le pagine toccate.
2. Elenca i file modificati e cosa fa ciascuno.
3. Dimmi cosa devo fare io dopo la pubblicazione: ricostruire il sito su Hostinger, "Richiedi indicizzazione" in Search Console
   sulle pagine principali, inviare la sitemap, cambiare l'URL finale degli annunci, e quando ricontrollare i risultati (2–4 settimane).
4. Se te lo chiedo, prepara un PDF di sintesi con le scoperte, in italiano, nella cartella `documentazione` (se esiste).

Inizia dalla fase 1.

## FINE DEL PROMPT

---

## Note per chi usa il prompt

**Cosa abbiamo imparato su Cube Academy (utile se il problema è lo stesso)**

- Il sito era un'applicazione React in Next.js: il server consegnava solo titolo, H1 e un breve testo (~460 caratteri), mentre
  programma, destinatari, prerequisiti e FAQ comparivano dopo il caricamento. Il concorrente ne aveva ~9.800 già nell'HTML.
- La struttura tecnica era corretta (canonical, hreflang, sitemap, JSON-LD): il vantaggio del concorrente non era tecnico, era di
  contenuto e di titoli.
- La CDN di Hostinger (`hcdn`) risponde 403 a chi usa lo user-agent di Googlebot da un indirizzo non Google: non è un blocco al
  vero Googlebot. Il test affidabile è "Testa URL pubblicato" in Search Console.
- Le variabili `NEXT_PUBLIC_*` si incorporano al momento della build: cambiarle su Hostinger richiede di **ricostruire** il sito,
  non basta riavviarlo.
- In modalità di sviluppo React esegue gli effetti due volte: gli eventi di tracciamento vanno protetti con un controllo "una sola
  volta per sessione".
- Per spostare un sito da WordPress al nuovo dominio, il redirect 301 sul vecchio server è la condizione che permette il "Cambio di
  indirizzo" di Search Console (la convalida controlla la home e alcune pagine di esempio).

**Quando serve altro che questo prompt**

- Se il sito è un'app a pagina singola senza alcun rendering sul server (per esempio Vite + React servito da Express), l'aggiunta del
  testo nell'HTML è una soluzione ponte; per le pagine di vendita conviene valutare la pre-generazione delle pagine o il passaggio
  a un framework con rendering lato server.
- Se il sito è su WordPress, usa invece un plugin SEO e un tema leggero: questo prompt è pensato per siti Node.js.
