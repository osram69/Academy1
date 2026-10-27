import { apiConfig } from "@server/core.mjs";
import { respond } from "@server/http.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  return respond(await apiConfig());
}
