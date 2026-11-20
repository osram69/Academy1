import { findUser, makeResetToken, resetAllowed } from "@server/materiali.mjs";
import { sameOrigin, see } from "@server/materiali-http.mjs";
import { ipOf, originOf } from "@server/http.mjs";
import { sendPasswordEmail } from "@server/mail.mjs";

export const dynamic = "force-dynamic";

// La risposta è sempre la stessa, anche se l'utente non esiste: non si può usare il modulo per scoprire chi è registrato.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Richiesta non valida.", { status: 403 });
  const form = await request.formData().catch(() => null);
  const done = see("/materiali/password-dimenticata?ok=1");
  if (!resetAllowed(`ip:${ipOf(request)}`, 5, 15 * 60e3)) return done;

  const u = findUser(form?.get("id"));
  if (u?.email && resetAllowed(`user:${u.username}`, 3, 60 * 60e3)) {
    const link = `${originOf(request)}/materiali/reimposta?t=${encodeURIComponent(makeResetToken(u.username))}`;
    // senza attendere l'SMTP: i tempi di risposta non rivelano se l'account esiste
    void sendPasswordEmail({ to: u.email, name: u.name, username: u.username, link, kind: "reset" });
  }
  return done;
}
