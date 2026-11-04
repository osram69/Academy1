/** Contenuto del corso per i crawler, già nell'HTML del server: programma, destinatari, prerequisiti, cosa include e domande frequenti.
 *  I testi sono quelli del sito (src/content/course-copy.ts), tradotti con gli stessi dizionari usati nel browser. */
import { en } from "../i18n/en";
import { fr } from "../i18n/fr";
import { de } from "../i18n/de";
import * as COPY from "../content/course-copy";
import { tx, type L } from "./seo-text";

const DICT: Record<L, Record<string, string>> = { it: {}, en, fr, de };
const tr = (l: L, s: string) => DICT[l][s] ?? s;
/** Toglie i link in sintassi markdown: "[scrivici](/contatti)" → "scrivici". */
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();

export interface ShellSection {
  heading: string;
  items?: string[];
  faqs?: { q: string; a: string }[];
}

/** Domande frequenti (le stesse della home e della scheda corso). */
export const faqSection = (l: L): ShellSection => ({
  heading: tx("secFaq", l),
  faqs: COPY.FAQS_COPY.filter((f) => f.inSearch !== false).map((f) => ({ q: tr(l, f.q), a: plain(tr(l, f.a)) })),
});

/** Contenuto della scheda corso: obiettivi, programma, destinatari, prerequisiti e cosa include (tutto ciò che la pagina mostra). */
export function courseSections(l: L): ShellSection[] {
  return [
    { heading: tx("secObjectives", l), items: COPY.OBJECTIVES.map((s) => tr(l, s)) },
    { heading: tx("secProgram", l), items: COPY.MODULES.map((m) => `${tr(l, m.title)}: ${m.topics.map((s) => tr(l, s)).join("; ")}`) },
    { heading: tx("secAudience", l), items: COPY.AUDIENCE.map((s) => tr(l, s)) },
    { heading: tx("secPrereq", l), items: COPY.PREREQUISITES.map((s) => tr(l, s)) },
    { heading: tx("secIncludes", l), items: COPY.INCLUDES.map((s) => tr(l, s)) },
  ];
}
