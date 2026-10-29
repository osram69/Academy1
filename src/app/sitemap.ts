import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";
import { getCourses, getEvents } from "../lib/server-data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/corsi`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/eventi`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/contatti`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/condizioni`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/cookie-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];
  const courses = ((await getCourses()) ?? []).filter((c) => !c.concluded).map((c) => ({
    url: `${SITE_URL}/corso/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9,
  }));
  const events = ((await getEvents()) ?? []).map((e) => ({
    url: `${SITE_URL}/eventi/${e.slug}`, lastModified: e.end ? new Date(e.end) : undefined, changeFrequency: "monthly" as const, priority: 0.5,
  }));
  return [...fixed, ...courses, ...events];
}
