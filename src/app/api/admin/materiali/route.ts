import { adminGate } from "@server/core.mjs";
import { originOf, respond } from "@server/http.mjs";
import { adminMaterialiCreate, adminMaterialiDelete, adminMaterialiList, adminMaterialiUpdate } from "@server/materiali-admin.mjs";

export const dynamic = "force-dynamic";

// Utenti dell'area /materiali: solo amministratori (stesso controllo delle altre API /api/admin).
const user = (request: Request) => new URL(request.url).searchParams.get("user") || "";
const bodyOf = (request: Request) => request.json().catch(() => ({}));

export async function GET(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  return respond(denied ?? adminMaterialiList());
}

export async function POST(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  return respond(denied ?? (await adminMaterialiCreate(await bodyOf(request), originOf(request))));
}

export async function PATCH(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  return respond(denied ?? (await adminMaterialiUpdate(user(request), await bodyOf(request), originOf(request))));
}

export async function DELETE(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  return respond(denied ?? adminMaterialiDelete(user(request)));
}
