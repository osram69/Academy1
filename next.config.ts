import type { NextConfig } from "next";

// Le variabili pubbliche di Supabase accettano sia il nome Next (NEXT_PUBLIC_*) sia quello storico (VITE_*).
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
  },
  poweredByHeader: false,
  // Il sito sostituisce il vecchio WordPress sullo stesso dominio: ogni indirizzo già indicizzato da Google porta alla pagina
  // equivalente (redirect permanente), così il posizionamento si trasferisce invece di finire in 404.
  async redirects() {
    const to = (sources: string[], destination: string) => sources.map((source) => ({ source, destination, permanent: true }));
    const other = ["en", "fr", "de"].flatMap((l) => [
      // l'ordine conta: vince la prima regola che corrisponde, e quelle precise vanno prima del prefisso "isaqb-cpsa…" della pagina lunga
      ...to([`/${l}/corsi-${l}`, `/${l}/isaqb-cpsa-f-course-calendar`, `/${l}/isaqb-cpsa-f-kurskalender`, `/${l}/calendrier-formations-isaqb`, `/${l}/course-registration-form-${l}`], `/${l}/corsi`),
      ...to([`/${l}/eventi-${l}`, `/${l}/evento-di-presentazione-isaqb-a-roma`, `/${l}/isaqb-software-architecture-gathering-2024`, `/${l}/cube-academy-:rest(.*)`], `/${l}/eventi`),
      ...to([`/${l}/privacy-policy-${l}`], `/${l}/privacy`),
      // pagina lunga della lingua (corso + certificazione), "chi siamo" e account → home della lingua
      ...to([`/${l}/isaqb-cpsa:rest(.*)`, `/${l}/mein-konto`, `/${l}/mon-compte`, `/${l}/my-account`], `/${l}`),
      ...to([`/${l}/chi-siamo-${l}`], `/${l}/chi-siamo`),
    ]);
    const rules = [
      ...to(["/it/:path*"], "/:path*"),
      ...to(["/mio-account"], "/"),
      ...to(["/corsi-it", "/calendario-corsi-isaqb-cpsa-f", "/calendario-corsi", "/registration-form-it"], "/corsi"),
      ...to(["/berlino", "/berlin", "/cube-academy-al-italian-software-testing-forum-2025:rest(.*)"], "/eventi"),
      ...to(["/privacy-policy"], "/privacy"),
      ...other,
    ];
    // Il sito ha un solo indirizzo ufficiale (SITE_URL): i vecchi domini e la variante www portano lì con un redirect permanente,
    // mantenendo il percorso. Le regole dei vecchi URL WordPress vengono ripetute per i vecchi domini con destinazione assoluta,
    // così basta un solo passaggio. /api, /_next e /pagamento restano sul dominio richiesto: i webhook di Stripe/PayPal non seguono i redirect.
    const site = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://cubeacademy.eu").replace(/\/$/, "");
    const canonicalHost = new URL(site).hostname;
    const oldHosts = ["academy.cubeng.eu", `www.${canonicalHost}`].filter((h) => h !== canonicalHost);
    const fromOldHosts = oldHosts.flatMap((value) => {
      const has = [{ type: "host" as const, value }];
      return [
        ...rules.map((r) => ({ ...r, has, destination: `${site}${r.destination}` })),
        { source: "/:path((?!api/|_next/|pagamento/).*)", has, destination: `${site}/:path`, permanent: true },
      ];
    });
    return [...fromOldHosts, ...rules];
  },
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
    ];
  },
};

export default nextConfig;
