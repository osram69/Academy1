import { canSee, fileResponse, resolve } from "@server/materiali.mjs";
import { decodeParts, userOf } from "@server/materiali-http.mjs";

export const dynamic = "force-dynamic";

// File riservati: servono il login e l'abilitazione alla cartella del corso.
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const user = userOf(request);
  if (!user) return new Response("Accesso negato.", { status: 403 });
  const r = resolve(decodeParts((await params).path));
  if (!r || r.isRoot || !canSee(user, r.key)) return new Response("File non trovato.", { status: 404 });
  return fileResponse(r.full, request, { isPublic: false });
}
