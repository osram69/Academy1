import { SITE_URL } from "../../lib/site";
import { getCourses, getEvents } from "../../lib/server-data";
import { LANG_CODES, type L } from "../../lib/seo-text";
import { toLocalPath } from "../../lib/slugs";

export const revalidate = 3600;

const loc = (path: string, l: L) => {
  const p = l === "it" ? path : toLocalPath(path, l); // pagine con indirizzo tradotto (lib/slugs.ts)
  return `${SITE_URL}${l === "it" ? (p === "/" ? "" : p) : `/${l}${p === "/" ? "" : p}`}`;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
/** Data nel formato W3C usato dal sitemap: 2026-11-06T09:30:00+00:00 */
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "+00:00");

type Entry = { url: string; lastmod?: Date; priority: number };

/** Ogni pagina compare in tutte e quattro le lingue (i collegamenti hreflang stanno nell'head delle pagine). */
const page = (path: string, priority: number, lastmod?: Date): Entry[] =>
  LANG_CODES.map((l) => ({ url: loc(path, l), lastmod, priority }));

export async function GET() {
  const now = new Date();
  const fixed = [
    ...page("/", 1, now),
    ...page("/corso-architettura-software", 0.9, now),
    ...page("/corsi", 0.9, now),
    ...page("/certificazione-isaqb", 0.8, now),
    ...page("/esame-cpsa-f", 0.8, now),
    ...page("/chi-siamo", 0.6, now),
    ...page("/eventi", 0.6, now),
    ...page("/contatti", 0.5),
    ...page("/privacy", 0.2),
    ...page("/condizioni", 0.2),
    ...page("/cookie-policy", 0.2),
  ];
  const courses = ((await getCourses()) ?? []).filter((c) => !c.concluded).flatMap((c) => page(`/corso/${c.slug}`, 0.9, now));
  const events = ((await getEvents()) ?? []).flatMap((e) => page(`/eventi/${e.slug}`, 0.5, e.end ? new Date(e.end) : undefined));

  const urls = [...fixed, ...courses, ...events]
    .map((u) => `<url>\n  <loc>${esc(u.url)}</loc>\n${u.lastmod && !isNaN(+u.lastmod) ? `  <lastmod>${iso(u.lastmod)}</lastmod>\n` : ""}  <priority>${u.priority.toFixed(2)}</priority>\n</url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${urls}

</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
