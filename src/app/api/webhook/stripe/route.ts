import { stripeWebhook } from "@server/core.mjs";
import { respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

// la firma Stripe si verifica sul corpo grezzo: niente JSON.parse prima
export async function POST(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  return respond(await stripeWebhook(raw, request.headers.get("stripe-signature") ?? ""));
}
