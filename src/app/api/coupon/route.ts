import { apiCoupon } from "@server/core.mjs";
import { ipOf, respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return respond(await apiCoupon(body, ipOf(request)));
}
