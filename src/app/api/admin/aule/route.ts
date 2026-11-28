import { adminIdentity } from "@server/core.mjs";
import { createAula, deleteAula, listAule, updateAula } from "@server/board.mjs";
import { respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

// Aule della board. L'elenco lo vedono anche i trainer (per scegliere dove entrare, senza password); creare, modificare ed eliminare
// spetta ad administrator e superuser.

export async function GET(request: Request) {
  const { denied, ruolo } = await adminIdentity(request.headers.get("authorization"), "trainer");
  return respond(denied ?? (await listAule(ruolo)));
}

export async function POST(request: Request) {
  const { denied } = await adminIdentity(request.headers.get("authorization"));
  if (denied) return respond(denied);
  return respond(await createAula(await request.json().catch(() => ({}))));
}

export async function PATCH(request: Request) {
  const { denied } = await adminIdentity(request.headers.get("authorization"));
  if (denied) return respond(denied);
  const room = new URL(request.url).searchParams.get("room");
  return respond(await updateAula(room, await request.json().catch(() => ({}))));
}

export async function DELETE(request: Request) {
  const { denied } = await adminIdentity(request.headers.get("authorization"));
  if (denied) return respond(denied);
  return respond(await deleteAula(new URL(request.url).searchParams.get("room")));
}
