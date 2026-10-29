import type { Metadata } from "next";
import { SITE, SITE_URL } from "./site";
import { getCourses, getEvents, type SeoCourse, type SeoEvent } from "./server-data";
import { leadingId } from "./slug";

/** Per ogni percorso del sito: metadati, dati strutturati e testo per i crawler, calcolati sul server. */

export type Resolved =
  | { kind: "ok"; path: string; canonical: string; meta: Metadata; jsonLd: object[]; shell: ShellContent }
  | { kind: "redirect"; to: string }
  | { kind: "notfound" };

export interface ShellContent {
  h1: string;
  intro: string;
  links: { href: string; label: string }[];
}

const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const dmy = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
};
/** "10–12 novembre 2026", "30 ottobre – 2 novembre 2026", "5 marzo 2026" */
export function dateRangeIt(a: string, b: string): string {
  const s = dmy(a), e = dmy(b || a);
  if (a === b || !b) return `${s.d} ${MONTHS[s.m - 1]} ${s.y}`;
  if (s.y === e.y && s.m === e.m) return `${s.d}–${e.d} ${MONTHS[e.m - 1]} ${e.y}`;
  if (s.y === e.y) return `${s.d} ${MONTHS[s.m - 1]} – ${e.d} ${MONTHS[e.m - 1]} ${e.y}`;
  return `${s.d} ${MONTHS[s.m - 1]} ${s.y} – ${e.d} ${MONTHS[e.m - 1]} ${e.y}`;
}

const eur = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 0 });
const abs = (p: string) => `${SITE_URL}${p === "/" ? "" : p}`;
const clip = (s: string, n = 158) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`);

function base(path: string, title: string | null, description: string, opts: { noindex?: boolean; image?: string; type?: "website" | "article" } = {}): Metadata {
  const image = opts.image || SITE.image;
  const full = title ? `${title} | ${SITE.name}` : SITE.title;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: { type: opts.type ?? "website", url: path, siteName: SITE.name, title: full, description, locale: "it_IT", images: [{ url: image }] },
    twitter: { card: "summary_large_image", title: full, description, images: [image] },
  };
}

const crumbs = (items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
});

const MAIN_LINKS = [
  { href: "/corsi", label: "Catalogo corsi iSAQB® CPSA-F" },
  { href: "/eventi", label: "Eventi" },
  { href: "/contatti", label: "Contatti" },
  { href: "/privacy", label: "Informativa privacy" },
  { href: "/condizioni", label: "Condizioni generali" },
];

const courseDescription = (c: SeoCourse) =>
  clip(
    `Corso iSAQB® CPSA Foundation Level ${c.online ? "online (aula virtuale live)" : c.residential ? "residenziale" : `in aula a ${c.location}`}, ${dateRangeIt(c.start, c.end)}.` +
      `${c.price ? ` Da € ${eur(c.earlyBirdPrice && c.earlyBirdPrice < c.price ? c.earlyBirdPrice : c.price)} + IVA.` : ""} Docente accreditato iSAQB®, gruppi fino a 12 partecipanti, Cube Academy Training Provider accreditato.`
  );

function courseJsonLd(c: SeoCourse, path: string) {
  const price = c.earlyBirdPrice && c.price && c.earlyBirdPrice < c.price ? c.earlyBirdPrice : c.price;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${abs(path)}#course`,
    name: c.title,
    description: courseDescription(c),
    url: abs(path),
    inLanguage: c.language,
    educationalLevel: c.level,
    provider: { "@id": `${SITE_URL}/#organization` },
    offers: price != null ? { "@type": "Offer", price, priceCurrency: "EUR", category: "Paid", url: abs(path), availability: c.open && (c.seatsLeft == null || c.seatsLeft > 0) ? "https://schema.org/InStock" : "https://schema.org/SoldOut" } : undefined,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: c.online ? "Online" : "Onsite",
      startDate: c.start,
      endDate: c.end,
      courseSchedule: c.schedule ? { "@type": "Schedule", description: c.schedule } : undefined,
      location: c.online ? { "@type": "VirtualLocation", url: abs(path) } : { "@type": "Place", name: c.location, address: c.location },
      instructor: { "@type": "Person", name: "Docente accreditato iSAQB®" },
    },
  };
}

function courseLinks(courses: SeoCourse[]) {
  return courses.filter((c) => !c.concluded).map((c) => ({ href: `/corso/${c.slug}`, label: `${c.title} — ${dateRangeIt(c.start, c.end)}` }));
}

export async function resolvePath(segments: string[]): Promise<Resolved> {
  const [a, b, c] = segments;
  const path = `/${segments.join("/")}`;

  if (!a) {
    const courses = (await getCourses())?.filter((x) => !x.concluded) ?? [];
    return {
      kind: "ok", path: "/", canonical: "/",
      meta: { alternates: { canonical: "/" } },
      jsonLd: courses.length
        ? [{ "@context": "https://schema.org", "@type": "ItemList", name: "Prossime edizioni dei corsi iSAQB® CPSA-F", itemListElement: courses.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/corso/${x.slug}`), name: x.title })) }]
        : [],
      shell: {
        h1: "Cube Academy — Corsi di certificazione iSAQB® CPSA-F",
        intro: "Cube Academy è Training Provider accreditato iSAQB® dal 2024. Corsi CPSA-Foundation online e in aula a Roma per diventare architetto del software certificato, con docenti accreditati e gruppi fino a 12 partecipanti.",
        links: [...courseLinks(courses), ...MAIN_LINKS],
      },
    };
  }

  if (!b && a === "corsi") {
    const courses = (await getCourses())?.filter((x) => !x.concluded) ?? [];
    const description = "Calendario 2026 dei corsi iSAQB® CPSA-F Foundation: edizioni online e in aula a Roma, date, prezzi e iscrizione. Docenti accreditati, gruppi fino a 12 partecipanti.";
    return {
      kind: "ok", path, canonical: "/corsi",
      meta: base("/corsi", "Catalogo corsi iSAQB® CPSA-F 2026 — date e prezzi", description),
      jsonLd: [
        crumbs([["Home", "/"], ["Catalogo corsi", "/corsi"]]),
        { "@context": "https://schema.org", "@type": "ItemList", name: "Catalogo corsi iSAQB® CPSA-F", itemListElement: courses.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/corso/${x.slug}`), name: x.title })) },
      ],
      shell: { h1: "Catalogo corsi iSAQB® CPSA-F", intro: description, links: courseLinks(courses) },
    };
  }

  if (a === "corso" && b && !c) {
    const courses = await getCourses();
    const id = leadingId(b);
    const course = courses?.find((x) => x.id === id);
    if (courses && (!course || course.concluded)) return { kind: "notfound" };
    if (!course) return { kind: "ok", path, canonical: path, meta: { robots: { index: false } }, jsonLd: [], shell: { h1: "Corso iSAQB® CPSA-F", intro: "", links: MAIN_LINKS } };
    if (course.slug !== b) return { kind: "redirect", to: `/corso/${course.slug}` };
    const p = `/corso/${course.slug}`;
    const description = courseDescription(course);
    return {
      kind: "ok", path: p, canonical: p,
      meta: base(p, `${course.title} — ${dateRangeIt(course.start, course.end)}`, description),
      jsonLd: [crumbs([["Home", "/"], ["Catalogo corsi", "/corsi"], [course.title, p]]), courseJsonLd(course, p)],
      shell: {
        h1: `${course.title} — ${dateRangeIt(course.start, course.end)}`,
        intro: `${description}${course.schedule ? ` Orario: ${course.schedule}.` : ""}`,
        links: [{ href: `/iscriviti/${course.slug}`, label: "Iscriviti a questa edizione" }, ...MAIN_LINKS],
      },
    };
  }

  if (!b && a === "eventi") {
    const events = (await getEvents()) ?? [];
    const description = "Gli appuntamenti di Cube Academy e della community iSAQB®: conferenze, forum e incontri sull'architettura del software.";
    return {
      kind: "ok", path, canonical: "/eventi",
      meta: base("/eventi", "Eventi iSAQB® e architettura software", description),
      jsonLd: [crumbs([["Home", "/"], ["Eventi", "/eventi"]])],
      shell: { h1: "Eventi", intro: description, links: events.map((e) => ({ href: `/eventi/${e.slug}`, label: e.title })) },
    };
  }

  if (a === "eventi" && b && !c) {
    const events = await getEvents();
    const id = leadingId(b);
    const ev: SeoEvent | undefined = events?.find((x) => x.slug === b || x.id === b || (id != null && x.id === String(id)));
    if (events && !ev) return { kind: "notfound" };
    if (!ev) return { kind: "ok", path, canonical: path, meta: { robots: { index: false } }, jsonLd: [], shell: { h1: "Evento", intro: "", links: MAIN_LINKS } };
    if (ev.slug !== b) return { kind: "redirect", to: `/eventi/${ev.slug}` };
    const p = `/eventi/${ev.slug}`;
    const description = clip(ev.text.split(/\n\s*\n/)[0] || `${ev.title}${ev.place ? ` — ${ev.place}` : ""}`);
    return {
      kind: "ok", path: p, canonical: p,
      meta: base(p, ev.title, description, { image: ev.image || undefined, type: "article" }),
      jsonLd: [
        crumbs([["Home", "/"], ["Eventi", "/eventi"], [ev.title, p]]),
        {
          "@context": "https://schema.org", "@type": "Event", name: ev.title, description,
          startDate: ev.start ?? undefined, endDate: ev.end ?? undefined,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
          location: ev.place ? { "@type": "Place", name: ev.place, address: ev.place } : undefined,
          image: ev.image ? [ev.image.startsWith("http") ? ev.image : abs(ev.image)] : undefined,
          url: abs(p), organizer: { "@id": `${SITE_URL}/#organization` },
        },
      ],
      shell: { h1: ev.title, intro: ev.text || description, links: [{ href: "/eventi", label: "Tutti gli eventi" }, ...MAIN_LINKS] },
    };
  }

  const STATIC: Record<string, { title: string; description: string; h1: string }> = {
    contatti: { title: "Contatti", h1: "Contatti", description: "Contatta Cube Academy per informazioni su corsi iSAQB® CPSA-F, liste d'attesa, edizioni dedicate per aziende e team. Sede a Roma." },
    privacy: { title: "Informativa privacy", h1: "Informativa privacy", description: "Informativa sul trattamento dei dati personali di Cube Academy, Cube Engineering S.r.l." },
    condizioni: { title: "Condizioni generali di vendita", h1: "Condizioni generali", description: "Condizioni generali di iscrizione ai corsi di Cube Academy: pagamenti, rimborsi, annullamento e modalità di erogazione." },
    "cookie-policy": { title: "Cookie policy", h1: "Cookie policy", description: "Informazioni sui cookie utilizzati da Cube Academy e su come gestire le preferenze." },
  };
  if (!b && a in STATIC) {
    const s = STATIC[a];
    return {
      kind: "ok", path, canonical: path,
      meta: base(path, s.title, s.description),
      jsonLd: [crumbs([["Home", "/"], [s.title, path]]), ...(a === "contatti" ? [{ "@context": "https://schema.org", "@type": "ContactPage", name: s.title, url: abs(path), about: { "@id": `${SITE_URL}/#organization` } }] : [])],
      shell: { h1: s.h1, intro: s.description, links: MAIN_LINKS },
    };
  }

  // pagine operative: non vanno in indice
  const hidden = (title: string): Resolved => ({ kind: "ok", path, canonical: path, meta: base(path, title, SITE.description, { noindex: true }), jsonLd: [], shell: { h1: title, intro: "", links: [{ href: "/", label: "Home" }] } });
  if (a === "iscriviti" && b && !c) return hidden("Iscrizione");
  if (a === "esito" && b) return hidden("Esito dell'iscrizione");
  if (a === "admin") return hidden("Gestione");

  return { kind: "notfound" };
}
