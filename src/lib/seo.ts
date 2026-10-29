import { lang, t } from "../i18n";
import { SITE_URL } from "./site";
import type { Course } from "../data";

const DEFAULT_TITLE = "Cube Academy — Certificazione iSAQB® CPSA-F";
const DEFAULT_DESC = "Cube Academy — Training Provider accreditato iSAQB® dal 2024. Corsi CPSA-Foundation online e in aula a Roma.";

function meta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function jsonLd(id: string, data: object | null) {
  document.getElementById(id)?.remove();
  if (!data) return;
  const s = document.createElement("script");
  s.id = id;
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}

export interface SeoInput {
  title?: string;
  description?: string;
  /** pagine operative (iscrizione, esito, admin): fuori dall'indice */
  noindex?: boolean;
  course?: Course;
}

/** Aggiorna titolo, descrizione, Open Graph e dati strutturati a ogni cambio di pagina (le rotte sono con hash). */
export function applySeo({ title, description, noindex, course }: SeoInput) {
  const full = title ? `${title} | Cube Academy` : t(DEFAULT_TITLE);
  const desc = description ? description.replace(/\s+/g, " ").trim().slice(0, 300) : t(DEFAULT_DESC);
  document.title = full;
  document.documentElement.lang = lang;
  meta("name", "description", desc);
  meta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
  meta("property", "og:title", full);
  meta("property", "og:description", desc);
  meta("property", "og:url", `${SITE_URL}/${window.location.hash || ""}`);
  meta("name", "twitter:title", full);
  meta("name", "twitter:description", desc);

  jsonLd(
    "ld-course",
    course
      ? {
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: desc,
          provider: { "@type": "EducationalOrganization", name: "Cube Academy", url: `${SITE_URL}/` },
          inLanguage: course.language,
          offers: { "@type": "Offer", price: course.price, priceCurrency: "EUR", url: `${SITE_URL}/#/corso/${course.slug}`, availability: "https://schema.org/InStock" },
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: /online/i.test(course.location) ? "online" : "onsite",
            startDate: course.start.toISOString().slice(0, 10),
            endDate: course.end.toISOString().slice(0, 10),
            location: course.location,
          },
        }
      : null
  );
}
