import { t } from "./i18n";

/** Collegamenti esterni al mondo iSAQB (stessi usati sul vecchio sito academy.cubeng.eu). */
export const ISAQB_URL = {
  cpsaF: "https://www.isaqb.org/certifications/cpsa-certifications/cpsa-foundation-level/",
  about: "https://www.isaqb.org/about/association/",
  certification: "https://www.isaqb.org/certifications/cpsa-foundation-level-examinations/",
  examsIt: "https://isaqb.ita-stqb.org/index.php/it/ita-stqb-isaqb/esami",
  isaqbIt: "https://isaqb.ita-stqb.org/index.php/it/",
};

export const isaqbLinks = () => ({
  cpsaF: { label: t("Scopri di più su CPSA-F"), href: ISAQB_URL.cpsaF },
  about: { label: t("Scopri di più su iSAQB"), href: ISAQB_URL.about },
  certification: { label: t("La Certificazione"), href: ISAQB_URL.certification },
  exams: { label: t("Dettagli sugli esami di certificazione"), href: ISAQB_URL.examsIt },
  isaqbIt: { label: t("iSAQB Italia"), href: ISAQB_URL.isaqbIt },
});
