import { adminDeleteOrder, adminGate, adminOrders, adminUpdateOrder } from "@server/core.mjs";
import { respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  return respond(denied ?? (await adminOrders()));
}

export async function DELETE(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  if (denied) return respond(denied);
  const ref = new URL(request.url).searchParams.get("ref");
  return respond(await adminDeleteOrder(ref));
}

export async function PATCH(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"));
  if (denied) return respond(denied);
  const ref = new URL(request.url).searchParams.get("ref");
  const body = await request.json().catch(() => ({}));
  return respond(await adminUpdateOrder(ref, body));
}
