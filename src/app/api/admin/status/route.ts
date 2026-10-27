import { adminGate, adminStatus } from "@server/core.mjs";
import { respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  return respond(denied ?? (await adminStatus()));
}
