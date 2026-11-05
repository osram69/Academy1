/**
 * Indirizzi tradotti. Nel codice ogni pagina ha il suo percorso italiano (/corsi, /corso/<edizione>, /esame-cpsa-f…);
 * nelle altre lingue il primo segmento ha un nome proprio (/en/courses, /en/course/<edizione>, /en/cpsa-f-exam…).
 * Qui sta la tabella e le funzioni per passare dall'uno all'altro. Va tenuta uguale a quella di next.config.ts (redirect dei vecchi indirizzi).
 * Senza dipendenze, così la usano sia il browser sia il server (sitemap, canonical, hreflang).
 * Non si traducono le pagine operative (iscriviti, esito, admin, api, pagamento): non vanno in indice.
 */

type SlugLang = "en" | "fr" | "de";

/** Primo segmento italiano → primo segmento nelle altre lingue (senza accenti né spazi). */
const SEGMENTS: Record<string, Record<SlugLang, string>> = {
  corsi: { en: "courses", fr: "formations", de: "kurse" },
  corso: { en: "course", fr: "formation", de: "kurs" },
  "corso-architettura-software": { en: "software-architect-course", fr: "formation-architecte-logiciel", de: "software-architekt-kurs" },
  "esame-cpsa-f": { en: "cpsa-f-exam", fr: "examen-cpsa-f", de: "cpsa-f-pruefung" },
  "certificazione-isaqb": { en: "isaqb-certification", fr: "certification-isaqb", de: "isaqb-zertifizierung" },
  "chi-siamo": { en: "about-us", fr: "a-propos", de: "ueber-uns" },
  eventi: { en: "events", fr: "evenements", de: "veranstaltungen" },
  contatti: { en: "contact", fr: "contact", de: "kontakt" },
  privacy: { en: "privacy", fr: "confidentialite", de: "datenschutz" },
  condizioni: { en: "terms", fr: "conditions-generales", de: "agb" },
  "cookie-policy": { en: "cookie-policy", fr: "politique-cookies", de: "cookie-richtlinie" },
};

const REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(SEGMENTS).flatMap(([it, byLang]) => Object.entries(byLang).map(([l, seg]) => [`${l}:${seg}`, it]))
);

/** Traduce solo il primo segmento ("/corso/23-x" → "/course/23-x"): il resto del percorso resta com'è. */
function mapFirst(path: string, fn: (seg: string) => string): string {
  const m = /^\/([^/]+)(.*)$/.exec(path);
  return m ? `/${fn(m[1])}${m[2]}` : path;
}

/** Percorso (senza prefisso di lingua) nella lingua richiesta: l'italiano resta quello del codice. */
export const toLocalPath = (itPath: string, l: string): string =>
  l === "it" ? itPath : mapFirst(itPath, (seg) => SEGMENTS[seg]?.[l as SlugLang] ?? seg);

/** Dal percorso tradotto (senza prefisso di lingua) a quello italiano usato nel codice. */
export const toItalianPath = (path: string, l: string): string =>
  l === "it" ? path : mapFirst(path, (seg) => REVERSE[`${l}:${seg}`] ?? seg);

/** Indirizzo interno (con eventuali ?query o #ancora) con prefisso di lingua e percorso tradotto: "/contatti?x=1" → "/en/contact?x=1". */
export function localizeHref(href: string, l: string): string {
  if (l === "it") return href;
  const i = href.search(/[?#]/);
  const path = i < 0 ? href : href.slice(0, i);
  const rest = i < 0 ? "" : href.slice(i);
  const local = toLocalPath(path, l);
  return `/${l}${local === "/" ? "" : local}${rest}`;
}
