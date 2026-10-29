import { checkoutReturn, rateLimited } from "@server/core.mjs";
import { ipOf, originOf } from "@server/http.mjs";

export const dynamic = "force-dynamic";

// ritorno dai checkout: verifica sul provider, poi torna alla SPA sulla pagina di esito
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref") ?? "";
  const base = originOf(request);
  const to = (state: string) => Response.redirect(`${base}/esito/${encodeURIComponent(ref)}/${state}`, 302);
  if (rateLimited(`${ipOf(request)}:return`, 60, 60000)) return to("error");
  return to(await checkoutReturn(ref, url.searchParams.get("outcome") ?? ""));
}
