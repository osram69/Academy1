import Link from "next/link";
import { MIN_PASSWORD, checkResetToken } from "@server/materiali.mjs";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded-lg border border-sand bg-paper px-3 py-2.5 outline-none focus:border-flame";

export default async function Reimposta({ searchParams }: { searchParams: Promise<{ t?: string; e?: string }> }) {
  const q = await searchParams;
  const token = q.t ?? "";
  const user = checkResetToken(token);

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-card">
        <h1 className="font-display text-2xl font-bold">Link non valido</h1>
        <p className="mt-3 text-sm text-steel">Il link è scaduto o è già stato usato. Puoi richiederne uno nuovo.</p>
        <Link href="/materiali/password-dimenticata" className="mt-5 inline-block rounded-lg bg-flame px-4 py-2.5 text-sm font-semibold text-white hover:bg-ember">Richiedi un nuovo link</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-card">
      <h1 className="font-display text-2xl font-bold">Scegli la tua password</h1>
      <p className="mt-2 text-sm text-steel">Utente: <b>{user}</b>. Almeno {MIN_PASSWORD} caratteri.</p>
      <form method="post" action="/materiali/reimposta-salva" className="mt-5 space-y-4">
        <input type="hidden" name="t" value={token} />
        <label className="block text-sm font-medium">
          Nuova password
          <input name="password" type="password" required minLength={MIN_PASSWORD} autoFocus autoComplete="new-password" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Ripeti la password
          <input name="conferma" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={input} />
        </label>
        {q.e && <p role="alert" className="text-sm text-err">{q.e === "2" ? `La password deve avere almeno ${MIN_PASSWORD} caratteri.` : "Le due password non coincidono."}</p>}
        <button className="w-full rounded-lg bg-flame px-4 py-2.5 font-semibold text-white shadow-flame hover:bg-ember">Salva e accedi</button>
      </form>
    </div>
  );
}
