import { PUBLIC_KEY, fileResponse, resolve } from "@server/materiali.mjs";
import { decodeParts } from "@server/materiali-http.mjs";

export const dynamic = "force-dynamic";

// File pubblici (slide dei webinar): scaricabili da chi conosce il link, senza login.
// Non esiste nessun indice: l'indirizzo di una cartella dà sempre 404, quindi il contenuto non è visibile.
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = decodeParts((await params).path);
  const r = resolve([PUBLIC_KEY, ...parts]);
  if (!r || r.isRoot) return new Response("File non trovato.", { status: 404 });
  return fileResponse(r.full, request, { isPublic: true });
}
