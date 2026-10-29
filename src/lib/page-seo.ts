import type { Metadata } from "next";
import { SITE, SITE_URL } from "./site";
import { getCourses, getEvents, type SeoCourse, type SeoEvent } from "./server-data";
import { leadingId } from "./slug";
import { LANG_CODES, LOCALE, OG_LOCALE, tx, type L, type TextKey } from "./seo-text";

/** Per ogni percorso del sito: metadati, dati strutturati e testo per i crawler, calcolati sul server.
 *  L'italiano è senza prefisso (/corsi); inglese, francese e tedesco stanno sotto /en, /fr, /de. */

export type Resolved =
  | { kind: "ok"; path: string; canonical: string; meta: Metadata; jsonLd: object[]; shell: ShellContent }
  | { kind: "redirect"; to: string }
  | { kind: "notfound" };

export interface ShellContent {
  h1: string;
  intro: string;
  links: { href: string; label: string }[];
}

/** "10–12 novembre 2026", "30 ottobre – 2 novembre 2026", "5 marzo 2026" (mesi nella lingua richiesta) */
export function dateRange(l: L, a: string, b: string): string {
  const dmy = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return { y, m, d };
  };
  const month = (m: number) => new Date(Date.UTC(2026, m - 1, 1)).toLocaleDateString(LOCALE[l], { month: "long", timeZone: "UTC" });
  const day = (d: number) => (l === "de" ? `${d}.` : `${d}`);
  const s = dmy(a), e = dmy(b || a);
  if (a === b || !b) return `${day(s.d)} ${month(s.m)} ${s.y}`;
  if (s.y === e.y && s.m === e.m) return `${l === "de" ? `${s.d}.` : s.d}–${day(e.d)} ${month(e.m)} ${e.y}`;
  if (s.y === e.y) return `${day(s.d)} ${month(s.m)} – ${day(e.d)} ${month(e.m)} ${e.y}`;
  return `${day(s.d)} ${month(s.m)} ${s.y} – ${day(e.d)} ${month(e.m)} ${e.y}`;
}

const clip = (s: string, n = 158) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`);

/** Indirizzo assoluto di un percorso senza prefisso, nella lingua richiesta. */
const url = (path: string, l: L) => `${SITE_URL}${prefixed(path, l)}`;
const prefixed = (path: string, l: L) => (l === "it" ? (path === "/" ? "" : path) : `/${l}${path === "/" ? "" : path}`);

/** Chiavi e indirizzi hreflang di una pagina: la stessa pagina in ogni lingua. */
const languagesOf = (path: string) => ({
  ...Object.fromEntries(LANG_CODES.map((l) => [l, url(path, l) || SITE_URL])),
  "x-default": url(path, "it") || SITE_URL,
});

export const LANG_SEGMENTS = ["en", "fr", "de"];

export async function resolvePath(all: string[]): Promise<Resolved> {
  const L: L = LANG_SEGMENTS.includes(all[0]) ? (all[0] as L) : "it";
  const segments = L === "it" ? all : all.slice(1);
  const [a, b, c] = segments;
  const path = `/${segments.join("/")}`; // percorso senza prefisso di lingua
  const P = (p: string) => prefixed(p, L) || "/"; // …con il prefisso, per i link interni
  const T = (k: TextKey, vars?: Record<string, string | number>) => tx(k, L, vars);
  const eur = (n: number) => n.toLocaleString(LOCALE[L], { maximumFractionDigits: 0 });

  function base(p: string, title: string | null, description: string, opts: { noindex?: boolean; image?: string; type?: "website" | "article" } = {}): Metadata {
    const image = opts.image || SITE.image;
    const full = title ? `${title} | ${SITE.name}` : T("homeTitle");
    const here = url(p, L) || SITE_URL;
    return {
      title: title ?? { absolute: T("homeTitle") },
      description,
      alternates: { canonical: here, ...(opts.noindex ? {} : { languages: languagesOf(p) }) },
      robots: opts.noindex ? { index: false, follow: false } : undefined,
      openGraph: { type: opts.type ?? "website", url: here, siteName: SITE.name, title: full, description, locale: OG_LOCALE[L], images: [{ url: image }] },
      twitter: { card: "summary_large_image", title: full, description, images: [image] },
    };
  }

  const crumbs = (items: [string, string][]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: url(p, L) || SITE_URL })),
  });

  const MAIN_LINKS = [
    { href: P("/corsi"), label: T("catalogLink") },
    { href: P("/eventi"), label: T("events") },
    { href: P("/contatti"), label: T("contacts") },
    { href: P("/privacy"), label: T("privacy") },
    { href: P("/condizioni"), label: T("terms") },
  ];

  const courseDescription = (x: SeoCourse) => {
    const mode = x.online ? T("modeOnline") : x.residential ? T("modeResidential") : T("modeClassroom", { loc: x.location });
    const price = x.price ? ` ${T("priceFrom", { p: eur(x.earlyBirdPrice && x.earlyBirdPrice < x.price ? x.earlyBirdPrice : x.price) })}` : "";
    return clip(`${T("courseKind")} ${mode}, ${dateRange(L, x.start, x.end)}.${price} ${T("courseTail")}`);
  };

  function courseJsonLd(x: SeoCourse, p: string) {
    const price = x.earlyBirdPrice && x.price && x.earlyBirdPrice < x.price ? x.earlyBirdPrice : x.price;
    const here = url(p, L);
    return {
      "@context": "https://schema.org",
      "@type": "Course",
      "@id": `${here}#course`,
      name: x.title,
      description: courseDescription(x),
      url: here,
      inLanguage: x.language,
      educationalLevel: x.level,
      provider: { "@id": `${SITE_URL}/#organization` },
      offers: price != null ? { "@type": "Offer", price, priceCurrency: "EUR", category: "Paid", url: here, availability: x.open && (x.seatsLeft == null || x.seatsLeft > 0) ? "https://schema.org/InStock" : "https://schema.org/SoldOut" } : undefined,
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: x.online ? "Online" : "Onsite",
        startDate: x.start,
        endDate: x.end,
        courseSchedule: x.schedule ? { "@type": "Schedule", description: x.schedule } : undefined,
        location: x.online ? { "@type": "VirtualLocation", url: here } : { "@type": "Place", name: x.location, address: x.location },
        instructor: { "@type": "Person", name: T("instructor") },
      },
    };
  }

  const courseLinks = (courses: SeoCourse[]) =>
    courses.filter((x) => !x.concluded).map((x) => ({ href: P(`/corso/${x.slug}`), label: `${x.title} — ${dateRange(L, x.start, x.end)}` }));

  if (!a) {
    const courses = (await getCourses())?.filter((x) => !x.concluded) ?? [];
    return {
      kind: "ok", path: P("/"), canonical: P("/"),
      meta: base("/", null, T("homeDesc")),
      jsonLd: courses.length
        ? [{ "@context": "https://schema.org", "@type": "ItemList", name: T("nextEditions"), itemListElement: courses.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: url(`/corso/${x.slug}`, L), name: x.title })) }]
        : [],
      shell: { h1: T("homeH1"), intro: T("homeIntro"), links: [...courseLinks(courses), ...MAIN_LINKS] },
    };
  }

  if (!b && a === "corsi") {
    const courses = (await getCourses())?.filter((x) => !x.concluded) ?? [];
    return {
      kind: "ok", path: P(path), canonical: P("/corsi"),
      meta: base("/corsi", T("catalogTitle"), T("catalogDesc")),
      jsonLd: [
        crumbs([[T("home"), "/"], [T("catalogCrumb"), "/corsi"]]),
        { "@context": "https://schema.org", "@type": "ItemList", name: T("catalogLink"), itemListElement: courses.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: url(`/corso/${x.slug}`, L), name: x.title })) },
      ],
      shell: { h1: T("catalogLink"), intro: T("catalogDesc"), links: courseLinks(courses) },
    };
  }

  if (a === "corso" && b && !c) {
    const courses = await getCourses();
    const id = leadingId(b);
    const course = courses?.find((x) => x.id === id);
    if (courses && (!course || course.concluded)) return { kind: "notfound" };
    if (!course) return { kind: "ok", path: P(path), canonical: P(path), meta: { robots: { index: false } }, jsonLd: [], shell: { h1: T("courseFallback"), intro: "", links: MAIN_LINKS } };
    if (course.slug !== b) return { kind: "redirect", to: P(`/corso/${course.slug}`) };
    const p = `/corso/${course.slug}`;
    const description = courseDescription(course);
    return {
      kind: "ok", path: P(p), canonical: P(p),
      meta: base(p, `${course.title} — ${dateRange(L, course.start, course.end)}`, description),
      jsonLd: [crumbs([[T("home"), "/"], [T("catalogCrumb"), "/corsi"], [course.title, p]]), courseJsonLd(course, p)],
      shell: {
        h1: `${course.title} — ${dateRange(L, course.start, course.end)}`,
        intro: `${description}${course.schedule ? ` ${T("schedule", { s: course.schedule })}` : ""}`,
        links: [{ href: P(`/iscriviti/${course.slug}`), label: T("enroll") }, ...MAIN_LINKS],
      },
    };
  }

  if (!b && a === "eventi") {
    const events = (await getEvents()) ?? [];
    return {
      kind: "ok", path: P(path), canonical: P("/eventi"),
      meta: base("/eventi", T("eventsTitle"), T("eventsDesc")),
      jsonLd: [crumbs([[T("home"), "/"], [T("events"), "/eventi"]])],
      shell: { h1: T("events"), intro: T("eventsDesc"), links: events.map((e) => ({ href: P(`/eventi/${e.slug}`), label: e.title })) },
    };
  }

  if (a === "eventi" && b && !c) {
    const events = await getEvents();
    const id = leadingId(b);
    const ev: SeoEvent | undefined = events?.find((x) => x.slug === b || x.id === b || (id != null && x.id === String(id)));
    if (events && !ev) return { kind: "notfound" };
    if (!ev) return { kind: "ok", path: P(path), canonical: P(path), meta: { robots: { index: false } }, jsonLd: [], shell: { h1: T("eventFallback"), intro: "", links: MAIN_LINKS } };
    if (ev.slug !== b) return { kind: "redirect", to: P(`/eventi/${ev.slug}`) };
    const p = `/eventi/${ev.slug}`;
    const text = ev.texts[L];
    const description = clip(text.split(/\n\s*\n/)[0] || `${ev.title}${ev.place ? ` — ${ev.place}` : ""}`);
    return {
      kind: "ok", path: P(p), canonical: P(p),
      meta: base(p, ev.title, description, { image: ev.image || undefined, type: "article" }),
      jsonLd: [
        crumbs([[T("home"), "/"], [T("events"), "/eventi"], [ev.title, p]]),
        {
          "@context": "https://schema.org", "@type": "Event", name: ev.title, description,
          startDate: ev.start ?? undefined, endDate: ev.end ?? undefined,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
          location: ev.place ? { "@type": "Place", name: ev.place, address: ev.place } : undefined,
          image: ev.image ? [ev.image.startsWith("http") ? ev.image : `${SITE_URL}${ev.image}`] : undefined,
          url: url(p, L), organizer: { "@id": `${SITE_URL}/#organization` },
        },
      ],
      shell: { h1: ev.title, intro: text || description, links: [{ href: P("/eventi"), label: T("allEvents") }, ...MAIN_LINKS] },
    };
  }

  const STATIC: Record<string, { title: TextKey; h1: TextKey; description: TextKey }> = {
    contatti: { title: "contacts", h1: "contacts", description: "contactsDesc" },
    privacy: { title: "privacy", h1: "privacy", description: "privacyDesc" },
    condizioni: { title: "termsTitle", h1: "terms", description: "termsDesc" },
    "cookie-policy": { title: "cookies", h1: "cookies", description: "cookiesDesc" },
  };
  if (!b && a in STATIC) {
    const s = STATIC[a];
    return {
      kind: "ok", path: P(path), canonical: P(path),
      meta: base(path, T(s.title), T(s.description)),
      jsonLd: [crumbs([[T("home"), "/"], [T(s.title), path]]), ...(a === "contatti" ? [{ "@context": "https://schema.org", "@type": "ContactPage", name: T(s.title), url: url(path, L), about: { "@id": `${SITE_URL}/#organization` } }] : [])],
      shell: { h1: T(s.h1), intro: T(s.description), links: MAIN_LINKS },
    };
  }

  // pagine operative: non vanno in indice
  const hidden = (title: string): Resolved => ({ kind: "ok", path: P(path), canonical: P(path), meta: base(path, title, T("homeDesc"), { noindex: true }), jsonLd: [], shell: { h1: title, intro: "", links: [{ href: P("/"), label: T("home") }] } });
  if (a === "iscriviti" && b && !c) return hidden(T("enrollment"));
  if (a === "esito" && b) return hidden(T("outcome"));
  if (a === "admin") return L === "it" ? hidden("Gestione") : { kind: "notfound" };

  return { kind: "notfound" };
}
