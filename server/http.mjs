// Piccoli helper per i Route Handler di Next.js.
export const ipOf = (request) => (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";

/** Origine pubblica del sito: SITE_URL se impostato, altrimenti quella della richiesta (anche dietro proxy). */
export function originOf(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost";
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Converte il risultato { status, body } della logica server in una Response. */
export const respond = (r) =>
  typeof r.body === "string" ? new Response(r.body, { status: r.status }) : Response.json(r.body, { status: r.status });
