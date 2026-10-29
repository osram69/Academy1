import { adminGate, apiTranslate } from "@server/core.mjs";
import { ipOf, respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  if (denied) return respond(denied);
  const body = await request.json().catch(() => ({}));
  return respond(await apiTranslate(body, ipOf(request)));
}
