import { paypalWebhook } from "@server/core.mjs";
import { respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const raw = await request.text();
  return respond(await paypalWebhook(raw, Object.fromEntries(request.headers.entries())));
}
