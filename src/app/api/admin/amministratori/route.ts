import { adminAccountAdd, adminAccountDelete, adminAccountUpdate, adminAccountsList, adminIdentity } from "@server/core.mjs";
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

export async function PATCH(request: Request) {
  const who = await guard(request);
  return respond(who.denied ?? (await adminAccountUpdate(email(request), await request.json().catch(() => ({})), who.email)));
}

export async function DELETE(request: Request) {
  const who = await guard(request);
  return respond(who.denied ?? (await adminAccountDelete(email(request), who.email)));
}
