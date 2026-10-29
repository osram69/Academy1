import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

// Il sito usa rotte con hash (#/corsi, #/corso/...): per i motori di ricerca il frammento non è un URL distinto,
// quindi l'unica pagina indicizzabile è la radice. Con rotte reali qui andrebbero elencati anche corsi ed eventi.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
