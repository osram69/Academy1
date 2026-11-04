/** Contenuto del corso per i crawler, già nell'HTML del server: programma, destinatari, prerequisiti, cosa include e domande frequenti.
 *  I testi sono quelli del sito (src/content/*.ts), tradotti con gli stessi dizionari usati nel browser (src/i18n). */
import { en } from "../i18n/en";
import { fr } from "../i18n/fr";
import { de } from "../i18n/de";
import * as COPY from "../content/course-copy";
import { LANDING } from "../content/landing-copy";
import { EXAM, EXAM_FAQS } from "../content/exam-copy";
import { CERT, CERT_FAQS } from "../content/cert-copy";
import { ABOUT, PERSON } from "../content/about-copy";
import type { L } from "./seo-text";

const DICT: Record<L, Record<string, string>> = { it: {}, en, fr, de };
/** Traduce un testo italiano nella lingua richiesta (come t() nel browser). */
export const tr = (l: L, s: string) => {
  const v = DICT[l][s] ?? s;
  // link interni scritti come [etichetta](/percorso): nelle altre lingue puntano alla pagina con il prefisso (/en/…), come nel browser
  return l === "it" ? v : v.replace(/\]\(\//g, `](/${l}/`);
};
/** Toglie i link in sintassi markdown: "[scrivici](/contatti)" → "scrivici". */
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();

export interface ShellSection {
  heading?: string;
  items?: string[];
  faqs?: { q: string; a: string }[];
}

/** Domande frequenti (le stesse della home, delle schede corso e della pagina del corso Software Architect). */
export const faqSection = (l: L): ShellSection => ({
  heading: tr(l, LANDING.faq),
  faqs: faqItems(l),
});

/** Risposte con i link in sintassi markdown: la shell per i crawler li mostra come link, i dati strutturati usano il testo semplice. */
export const faqItems = (l: L) => COPY.FAQS_COPY.map((f) => ({ q: tr(l, f.q), a: tr(l, f.a) }));

/** Frase sulla sede dei corsi in aula (Roma Office Sharing), per le pagine che parlano dell'edizione in aula. */
export const venueSection = (l: L): ShellSection => ({ items: [tr(l, COPY.VENUE_NOTE)] });

/** Contenuto della scheda corso: obiettivi, programma, destinatari, prerequisiti, cosa include e FAQ (tutto ciò che la pagina mostra). */
export function courseSections(l: L): ShellSection[] {
  return [
    { heading: tr(l, LANDING.objectives), items: COPY.OBJECTIVES.map((s) => tr(l, s)) },
    { heading: tr(l, LANDING.program), items: [tr(l, COPY.CURRICULUM_NOTE), ...COPY.MODULES.map((m) => `${tr(l, m.title)}: ${tr(l, m.outcome)} ${m.topics.map((s) => tr(l, s)).join("; ")}.`)] },
    { heading: tr(l, LANDING.audience), items: COPY.AUDIENCE.map((s) => tr(l, s)) },
    { heading: tr(l, LANDING.prerequisites), items: COPY.PREREQUISITES.map((s) => tr(l, s)) },
    { heading: tr(l, LANDING.includes), items: COPY.INCLUDES.map((s) => tr(l, s)) },
    faqSection(l),
  ];
}

/** Contenuto della pagina dedicata al corso Software Architect. */
export function landingSections(l: L): ShellSection[] {
  const [objectives, program, audience, prereq, includes, faq] = courseSections(l);
  return [
    { items: LANDING.facts.map((s) => tr(l, s)) },
    { heading: tr(l, LANDING.formats), items: COPY.FORMATS_COPY.map((f) => `${tr(l, f.title)}: ${tr(l, f.text)} ${f.points.map((p) => tr(l, p)).join("; ")}.`) },
    objectives,
    program,
    audience,
    prereq,
    includes,
    venueSection(l),
    { heading: tr(l, LANDING.examTitle), items: [tr(l, LANDING.examText), tr(l, LANDING.examLimit)] },
    faq,
  ];
}

/** Contenuto della pagina dedicata all'esame CPSA-F. */
export const examFaqItems = (l: L) => EXAM_FAQS.map((f) => ({ q: tr(l, f.q), a: tr(l, f.a) }));

export function examSections(l: L): ShellSection[] {
  return [
    { items: EXAM.facts.map((s) => tr(l, s)) },
    { heading: tr(l, EXAM.stepsTitle), items: EXAM.steps.map((s) => tr(l, s)) },
    { heading: tr(l, EXAM.prepTitle), items: [tr(l, EXAM.prepText), tr(l, COPY.CURRICULUM_NOTE)] },
    { heading: tr(l, EXAM.limitTitle), items: [tr(l, LANDING.examLimit), tr(l, EXAM.source)] },
    { heading: tr(l, EXAM.faq), faqs: examFaqItems(l) },
  ];
}

export const examFaqJsonLd = (l: L) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: examFaqItems(l).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
});

/** Contenuto della pagina "Chi siamo". */
export function aboutSections(l: L): ShellSection[] {
  return [
    { heading: tr(l, ABOUT.whoTitle), items: [tr(l, ABOUT.whoText)] },
    { heading: tr(l, ABOUT.howTitle), items: ABOUT.how.map((s) => tr(l, s)) },
    { heading: tr(l, ABOUT.originTitle), items: [tr(l, ABOUT.originText)] },
    { heading: tr(l, ABOUT.skillsTitle), items: [tr(l, ABOUT.skillsIntro), ...ABOUT.skills.map((s) => tr(l, s)), tr(l, ABOUT.skillsNote)] },
    { heading: tr(l, ABOUT.teamTitle), items: [`${PERSON.name}: ${tr(l, ABOUT.personRole)}`, tr(l, ABOUT.personBio), `[${tr(l, ABOUT.linkedinLabel)}](${PERSON.linkedin})`] },
    { heading: tr(l, ABOUT.whereTitle), items: [tr(l, COPY.VENUE_NOTE), tr(l, ABOUT.contactText)] },
  ];
}

/** Contenuto della pagina dedicata alla certificazione iSAQB®. */
export const certFaqItems = (l: L) => CERT_FAQS.map((f) => ({ q: tr(l, f.q), a: tr(l, f.a) }));

export function certSections(l: L): ShellSection[] {
  return [
    { items: CERT.facts.map((s) => tr(l, s)) },
    { heading: tr(l, CERT.whatTitle), items: [tr(l, CERT.whatText)] },
    { heading: tr(l, CERT.levelsTitle), items: [tr(l, COPY.CURRICULUM_NOTE), ...CERT.levels.map((v) => `${tr(l, v.name)}: ${tr(l, v.text)}`)] },
    { heading: tr(l, CERT.audienceTitle), items: COPY.AUDIENCE.map((s) => tr(l, s)) },
    { heading: tr(l, CERT.limitTitle), items: [tr(l, LANDING.examLimit)] },
    { heading: tr(l, CERT.pathTitle), items: CERT.path.map((s) => tr(l, s)) },
    { heading: tr(l, CERT.faq), faqs: certFaqItems(l) },
  ];
}

export const certFaqJsonLd = (l: L) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: certFaqItems(l).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
});

/** Dati strutturati FAQPage per le pagine che mostrano le domande frequenti. */
export const faqJsonLd = (l: L) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems(l).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
});
