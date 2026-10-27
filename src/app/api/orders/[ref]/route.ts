import { apiOrderSummary } from "@server/core.mjs";
import { ipOf, respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ ref: string }> }) {
  const { ref } = await ctx.params;
  return respond(await apiOrderSummary(ref, ipOf(request)));
}
