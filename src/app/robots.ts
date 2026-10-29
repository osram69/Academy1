import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/pagamento/", "/admin", "/esito/", "/iscriviti/", ...["en", "fr", "de"].flatMap((l) => [`/${l}/esito/`, `/${l}/iscriviti/`])] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
