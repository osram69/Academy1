import { adminAccountAdd, adminAccountDelete, adminAccountResetPassword, adminAccountUpdate, adminAccountsList, adminIdentity } from "@server/core.mjs";
import { respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

// Amministratori del pannello e loro livello: solo superuser.
const email = (request: Request) => new URL(request.url).searchParams.get("email") || "";
const guard = (request: Request) => adminIdentity(request.headers.get("authorization"), "superuser");

export async function GET(request: Request) {
  const who = await guard(request);
  return respond(who.denied ?? (await adminAccountsList()));
}

export async function POST(request: Request) {
  const who = await guard(request);
  return respond(who.denied ?? (await adminAccountAdd(await request.json().catch(() => ({})))));
}

// PATCH: { action: "reset", password? } reimposta la password provvisoria; altrimenti { ruolo } cambia il livello
export async function PATCH(request: Request) {
  const who = await guard(request);
  if (who.denied) return respond(who.denied);
  const body = await request.json().catch(() => ({}));
  return respond(body?.action === "reset" ? await adminAccountResetPassword(email(request), body) : await adminAccountUpdate(email(request), body, who.email));
}

export async function DELETE(request: Request) {
  const who = await guard(request);
  return respond(who.denied ?? (await adminAccountDelete(email(request), who.email)));
}
