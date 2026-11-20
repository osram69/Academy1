import { cookieHeader, isSecure } from "@server/materiali.mjs";
import { sameOrigin, see } from "@server/materiali-http.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Richiesta non valida.", { status: 403 });
  return see("/materiali", { "Set-Cookie": cookieHeader("", isSecure(request)) });
}
