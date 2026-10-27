import { apiCreateOrder } from "@server/core.mjs";
import { ipOf, originOf, respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return respond(await apiCreateOrder(body, { origin: originOf(request), ip: ipOf(request) }));
}
