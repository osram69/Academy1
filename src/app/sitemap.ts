import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";
import { getCourses, getEvents } from "../lib/server-data";
import { LANG_CODES, type L } from "../lib/seo-text";

export const revalidate = 3600;

const loc = (path: string, l: L) => `${SITE_URL}${l === "it" ? (path === "/" ? "" : path) : `/${l}${path === "/" ? "" : path}`}`;

type Entry = Omit<MetadataRoute.Sitemap[number], "url" | "alternates">;

/** Ogni pagina compare in tutte e quattro le lingue, con i collegamenti hreflang alle altre versioni. */
const page = (path: string, entry: Entry): MetadataRoute.Sitemap => {
  const languages = { ...Object.fromEntries(LANG_CODES.map((l) => [l, loc(path, l)])), "x-default": loc(path, "it") };
  return LANG_CODES.map((l) => ({ url: loc(path, l), ...entry, alternates: { languages } }));
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    ...page("/", { lastModified: now, changeFrequency: "weekly", priority: 1 }),
    ...page("/corsi", { lastModified: now, changeFrequency: "daily", priority: 0.9 }),
    ...page("/eventi", { lastModified: now, changeFrequency: "weekly", priority: 0.6 }),
    ...page("/contatti", { changeFrequency: "yearly", priority: 0.5 }),
    ...page("/privacy", { changeFrequency: "yearly", priority: 0.2 }),
    ...page("/condizioni", { changeFrequency: "yearly", priority: 0.2 }),
    ...page("/cookie-policy", { changeFrequency: "yearly", priority: 0.2 }),
  ];
  const courses = ((await getCourses()) ?? []).filter((c) => !c.concluded).flatMap((c) =>
    page(`/corso/${c.slug}`, { lastModified: now, changeFrequency: "daily", priority: 0.9 })
  );
  const events = ((await getEvents()) ?? []).flatMap((e) =>
    page(`/eventi/${e.slug}`, { lastModified: e.end ? new Date(e.end) : undefined, changeFrequency: "monthly", priority: 0.5 })
  );
  return [...fixed, ...courses, ...events];
}
