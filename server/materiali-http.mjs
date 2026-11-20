// Helper HTTP per le rotte /materiali (Route Handler di Next.js).
import { COOKIE, userFromToken } from "./materiali.mjs";

export const tokenOf = (request) => new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(request.headers.get("cookie") || "")?.[1] || "";
export const userOf = (request) => userFromToken(tokenOf(request));

/** Segmenti del percorso: Next li consegna già decodificati (decodificarli ancora romperebbe i nomi con "%"). */
export const decodeParts = (arr) => (arr || []).map(String);

/** Redirect 303 con indirizzo relativo: funziona anche dietro il proxy di Hostinger. */
export const see = (to, headers = {}) => new Response(null, { status: 303, headers: { Location: to, ...headers } });

/** Le richieste che modificano qualcosa devono arrivare dallo stesso sito (oltre al cookie SameSite=Lax). */
export function sameOrigin(request) {
  const o = request.headers.get("origin");
  if (!o) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return new URL(o).host === host;
  } catch {
    return false;
  }
}

export const areaUrl = (parts) => (parts.length ? `/materiali/area/${parts.map(encodeURIComponent).join("/")}` : "/materiali");
