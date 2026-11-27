import { adminIdentity } from "@server/core.mjs";
import { adminBoardLink, boardConfigured } from "@server/board.mjs";
import { respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

// Link di accesso alla board come trainer: amministratori e trainer del pannello (level "trainer" = qualunque livello abilitato).
export async function GET(request: Request) {
  const { denied } = await adminIdentity(request.headers.get("authorization"), "trainer");
  return respond(denied ?? { status: 200, body: { configured: boardConfigured() } });
}

export async function POST(request: Request) {
  const { denied, email } = await adminIdentity(request.headers.get("authorization"), "trainer");
  if (denied) return respond(denied);
  const body = await request.json().catch(() => ({}));
  return respond(adminBoardLink(email, body));
}
