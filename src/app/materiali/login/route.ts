import { cookieHeader, isSecure, login } from "@server/materiali.mjs";
import { sameOrigin, see } from "@server/materiali-http.mjs";
import { ipOf } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Richiesta non valida.", { status: 403 });
  const form = await request.formData().catch(() => null);
  const r = login(form?.get("utente"), form?.get("password"), ipOf(request));
  if (r.token) return see("/materiali", { "Set-Cookie": cookieHeader(r.token, isSecure(request)) });
  return see(`/materiali?e=${r.error === "limit" ? 2 : 1}`);
}
