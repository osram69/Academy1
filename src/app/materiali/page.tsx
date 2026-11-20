import { cookies } from "next/headers";
import Link from "next/link";
import { COOKIE, canManageRoots, isTrainer, listRoots, userFromToken } from "@server/materiali.mjs";
import { areaUrl } from "@server/materiali-http.mjs";
import { Notice } from "./notice";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ e?: string; m?: string; n?: string }> };

export default async function Materiali({ searchParams }: Props) {
  const q = await searchParams;
  const user = userFromToken((await cookies()).get(COOKIE)?.value);

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-card">
        <h1 className="font-display text-2xl font-bold">Accedi ai materiali</h1>
        <p className="mt-2 text-sm text-steel">Inserisci le credenziali ricevute da Cube Academy per il tuo corso.</p>
        <form method="post" action="/materiali/login" className="mt-5 space-y-4">
          <label className="block text-sm font-medium">
            Utente
            <input name="utente" required autoFocus autoComplete="username" className="mt-1 w-full rounded-lg border border-sand bg-paper px-3 py-2.5 outline-none focus:border-flame" />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border border-sand bg-paper px-3 py-2.5 outline-none focus:border-flame" />
          </label>
          {q.e && <p role="alert" className="text-sm text-err">{q.e === "2" ? "Troppi tentativi: riprova tra qualche minuto." : "Utente o password errati."}</p>}
          <button className="w-full rounded-lg bg-flame px-4 py-2.5 font-semibold text-white shadow-flame hover:bg-ember">Accedi</button>
        </form>
        <p className="mt-5 text-xs text-steel">
          Non hai le credenziali? Scrivi a <a className="underline" href="mailto:academy@cubeng.eu">academy@cubeng.eu</a>.
        </p>
      </div>
    );
  }

  const roots = listRoots(user);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Le tue cartelle</h1>
          <p className="text-sm text-steel">
            Connesso come <b>{user.name}</b>
            {isTrainer(user) && " (trainer)"}
          </p>
        </div>
        <form method="post" action="/materiali/logout">
          <button className="rounded-lg border border-sand bg-white px-3 py-2 text-sm hover:border-flame">Esci</button>
        </form>
      </div>
      <Notice m={q.m} n={q.n} />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {roots.map((r) => (
          <li key={r.key}>
            <Link href={areaUrl([r.key])} className="block rounded-xl bg-white p-5 shadow-card hover:ring-2 hover:ring-flame">
              <span aria-hidden>📁 </span>
              <span className="font-semibold">{r.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      {!roots.length && <p className="mt-6 text-steel">Nessuna cartella abilitata per questo utente.</p>}
      {canManageRoots(user) && (
        <form method="post" action="/materiali/azione" className="mt-8 flex flex-wrap items-end gap-2 rounded-xl bg-sand/50 p-4">
          <input type="hidden" name="action" value="cartella" />
          <input type="hidden" name="dir" value="" />
          <label className="text-sm font-medium">
            Nuova cartella corso
            <input name="nome" required maxLength={150} placeholder="CPSA-F_Dic26" className="mt-1 block rounded-lg border border-sand bg-white px-3 py-2" />
          </label>
          <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink2">Crea</button>
        </form>
      )}
    </>
  );
}
