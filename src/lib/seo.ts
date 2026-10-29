import { LANGS, lang, stripLang, t, withLang, type Lang } from "../i18n";
import { SITE_URL } from "./site";

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

function canonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Versioni nelle altre lingue della pagina corrente (hreflang), assenti per le pagine fuori indice. */
function alternates(noindex?: boolean) {
  document.head.querySelectorAll("link[rel='alternate'][hreflang]").forEach((el) => el.remove());
  if (noindex) return;
  const base = stripLang(window.location.pathname);
  const add = (hreflang: string, l: Lang) => {
    const el = document.createElement("link");
    el.rel = "alternate";
    el.hreflang = hreflang;
    el.href = `${SITE_URL}${withLang(base, l) === "/" ? "" : withLang(base, l)}`;
    document.head.appendChild(el);
  };
  LANGS.forEach((l) => add(l.code, l.code));
  add("x-default", "it");
}

export interface SeoInput {
  title?: string;
  description?: string;
  /** pagine operative (iscrizione, esito, admin): fuori dall'indice */
  noindex?: boolean;
}

let first = true;

/**
 * Il server consegna già titolo, descrizione, canonical e dati strutturati giusti per l'indirizzo richiesto.
 * Qui si aggiornano solo i cambi di pagina fatti nel browser (senza ricaricare) e la lingua scelta dal visitatore.
 */
export function applySeo({ title, description, noindex }: SeoInput) {
  if (first) {
    first = false;
    return;
  }
  // i dati strutturati del server descrivono la pagina caricata per prima: dopo una navigazione non valgono più
  document.querySelectorAll("script[data-page-ld]").forEach((el) => el.remove());
  const full = title ? `${title} | Cube Academy` : t(DEFAULT_TITLE);
  const desc = description ? description.replace(/\s+/g, " ").trim().slice(0, 300) : t(DEFAULT_DESC);
  document.title = full;
  document.documentElement.lang = lang;
  meta("name", "description", desc);
  meta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
  meta("property", "og:title", full);
  meta("property", "og:description", desc);
  meta("property", "og:url", `${SITE_URL}${window.location.pathname}`);
  meta("name", "twitter:title", full);
  meta("name", "twitter:description", desc);
  canonical(`${SITE_URL}${window.location.pathname === "/" ? "" : window.location.pathname}`);
  alternates(noindex);
}
