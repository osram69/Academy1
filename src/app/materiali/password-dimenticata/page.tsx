import Link from "next/link";
import { mailConfigured } from "@server/mail.mjs";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded-lg border border-sand bg-paper px-3 py-2.5 outline-none focus:border-flame";

export default async function PasswordDimenticata({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const q = await searchParams;
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-card">
      <h1 className="font-display text-2xl font-bold">Password dimenticata</h1>
      {q.ok ? (
        <>
          <p role="status" className="mt-4 rounded-lg bg-mint/10 px-4 py-3 text-sm text-mint">
            Se l'indirizzo è registrato, tra pochi minuti riceverai un'email con il link per scegliere una nuova password. Controlla anche la cartella spam.
          </p>
          <Link href="/materiali" className="mt-5 inline-block text-sm text-flame hover:underline">Torna all'accesso</Link>
        </>
      ) : !mailConfigured() ? (
        <p className="mt-4 text-sm text-err">Il servizio email non è al momento disponibile: scrivi a <a className="underline" href="mailto:academy@cubeng.eu">academy@cubeng.eu</a>.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-steel">Inserisci l'email o il nome utente del tuo accesso: ti inviamo un link per scegliere una nuova password.</p>
          <form method="post" action="/materiali/reset-richiesta" className="mt-5 space-y-4">
            <label className="block text-sm font-medium">
              Email o nome utente
              <input name="id" required autoFocus autoComplete="username" className={input} />
            </label>
            <button className="w-full rounded-lg bg-flame px-4 py-2.5 font-semibold text-white shadow-flame hover:bg-ember">Invia il link</button>
          </form>
          <Link href="/materiali" className="mt-5 inline-block text-sm text-steel hover:underline">← Torna all'accesso</Link>
        </>
      )}
    </div>
  );
}
