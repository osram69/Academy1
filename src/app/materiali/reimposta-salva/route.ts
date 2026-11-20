import { checkResetToken, cookieHeader, isSecure, makeSession, passwordOk, setPassword } from "@server/materiali.mjs";
import { sameOrigin, see } from "@server/materiali-http.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Richiesta non valida.", { status: 403 });
  const form = await request.formData().catch(() => null);
  const token = String(form?.get("t") ?? "");
  const user = checkResetToken(token);
  if (!user) return see(`/materiali/reimposta?t=${encodeURIComponent(token)}`); // mostra "link non valido"

  const password = String(form?.get("password") ?? "");
  const back = (e: number) => see(`/materiali/reimposta?t=${encodeURIComponent(token)}&e=${e}`);
  if (!passwordOk(password)) return back(2);
  if (password !== String(form?.get("conferma") ?? "")) return back(1);

  setPassword(user, password); // da qui il link smette di valere (cambia l'impronta della password)
  // il link ricevuto per email dimostra chi è l'utente: lo si fa entrare subito
  return see("/materiali?m=pwok", { "Set-Cookie": cookieHeader(makeSession(user), isSecure(request)) });
}
