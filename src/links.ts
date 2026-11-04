import { lang, t } from "./i18n";

/** Collegamenti esterni al mondo iSAQB (stessi usati sul vecchio sito academy.cubeng.eu). */
export const ISAQB_URL = {
  cpsaF: "https://www.isaqb.org/certifications/cpsa-certifications/cpsa-foundation-level/",
  about: "https://www.isaqb.org/about/association/",
  certification: "https://www.isaqb.org/certifications/cpsa-foundation-level-examinations/",
  examsIt: "https://isaqb.ita-stqb.org/index.php/it/ita-stqb-isaqb/esami",
};

/** Curriculum ufficiale CPSA-Foundation, nella lingua del sito (il francese rimanda all'inglese: non esiste una versione francese). */
const CURRICULUM = "https://public.isaqb.org/curriculum-foundation/curriculum-foundation-";
const CURRICULUM_LANG = { it: "it", en: "en", fr: "en", de: "de" } as const;

export const isaqbLinks = () => ({
  curriculum: { label: t("Curriculum ufficiale CPSA-F"), href: `${CURRICULUM}${CURRICULUM_LANG[lang]}.pdf` },
  cpsaF: { label: t("Scopri di più su CPSA-F"), href: ISAQB_URL.cpsaF },
  about: { label: t("Scopri di più su iSAQB"), href: ISAQB_URL.about },
  certification: { label: t("La Certificazione"), href: ISAQB_URL.certification },
  exams: { label: t("Esame di Certificazione"), href: ISAQB_URL.examsIt },
});
