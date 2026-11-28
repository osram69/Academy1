import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { generatePassword } from "../../shared/password.mjs";
import { Field, btnCls, btnPrimary, inputCls, openBoard } from "./Admin";

/* Aule della board (lavagna Cube Academy). Le aule vivono sul server della board (Raspberry): qui si elencano, si creano, si attivano
   o disattivano (la disattivazione ferma i nuovi accessi e scollega gli allievi, non i trainer) e si eliminano con tutti i loro dati.
   Si entra come trainer dal pulsante "Entra". Le password restano visibili e copiabili, come per i materiali. */

export interface Aula {
  name: string;
  configured: boolean;
  password: string | null;
  until: number | null;
  active: boolean;
  online: number;
  stanze: number;
  updatedAt: number;
}
interface Form { name: string; password: string; until: string }

const EMPTY: Form = { name: "", password: "", until: "" };
const card = "rounded-2xl border border-ink/10 bg-white p-6";
const pad = (n: number) => String(n).padStart(2, "0");
const day = (ms: number) => `${pad(new Date(ms).getDate())}/${pad(new Date(ms).getMonth() + 1)}/${new Date(ms).getFullYear()}`;
const toInput = (ms: number | null) => (ms ? `${new Date(ms).getFullYear()}-${pad(new Date(ms).getMonth() + 1)}-${pad(new Date(ms).getDate())}` : "");
/** Fine giornata locale della data scelta (la sessione dura tutto quel giorno). */
const endOfDay = (v: string): number | null => (v ? new Date(`${v}T23:59:59`).getTime() : null);

/** Stato in parole, per l'elenco delle aule. */
export function aulaStatus(a: Aula): string {
  if (!a.configured) return "Senza password";
  if (a.active) return a.until ? `Attiva fino al ${day(a.until)}` : "Attiva";
  return a.until ? `Disattivata (dal ${day(a.until)})` : "Disattivata";
}

export function AulePage({ session }: { session: Session }) {
  const [aule, setAule] = useState<Aula[] | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<string | "new" | null>(null);
  const [orig, setOrig] = useState("");
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (method: string, query = "", body?: unknown) => {
      const r = await fetch(`/api/admin/aule${query}`, {
        method,
        headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Operazione non riuscita");
      return j;
    },
    [session.access_token]
  );
  const load = useCallback(() => call("GET").then((j) => (setErr(""), setAule(j.aule as Aula[]))).catch((e: Error) => (setErr(e.message), setAule((cur) => cur ?? []))), [call]);
  useEffect(() => void load(), [load]);

  const copy = (text: string, done: string) => {
    setErr("");
    navigator.clipboard?.writeText(text).then(() => setMsg(done), () => setErr("Non riesco a copiare: seleziona il testo e copialo a mano."));
  };

  const open = (a?: Aula) => {
    setErr("");
    setMsg("");
    setEdit(a ? a.name : "new");
    setOrig(a?.password ?? "");
    setF(a ? { name: a.name, password: a.password ?? "", until: toInput(a.until) } : { ...EMPTY, password: generatePassword(8) });
  };

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setErr("");
    setMsg("");
    try {
      await fn();
      setMsg(done);
      await load();
      return true;
    } catch (x) {
      setErr((x as Error).message);
      return false;
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const until = endOfDay(f.until);
    const ok =
      edit === "new"
        ? await run(() => call("POST", "", { name: f.name.trim(), password: f.password, ...(until ? { until } : {}) }), `Aula "${f.name.trim()}" creata.`)
        : await run(
            // la password si invia solo se è cambiata: rinviarla uguale non serve e la sessione resterebbe com'è
            () => call("PATCH", `?room=${encodeURIComponent(edit!)}`, { until, ...(f.password && f.password !== orig ? { password: f.password } : {}) }),
            "Aula aggiornata."
          );
    if (ok) setEdit(null);
    setBusy(false);
  };

  const toggle = (a: Aula) =>
    a.active
      ? window.confirm(`Disattivare "${a.name}"? Gli allievi collegati vengono scollegati e nessuno potrà più entrare con la password. I trainer entrano comunque.`) &&
        run(() => call("PATCH", `?room=${encodeURIComponent(a.name)}`, { until: Date.now() }), `Aula "${a.name}" disattivata.`)
      : run(() => call("PATCH", `?room=${encodeURIComponent(a.name)}`, { until: null }), `Aula "${a.name}" attivata.`);

  const remove = (a: Aula) => {
    const warn = `Eliminare definitivamente l'aula "${a.name}"?\n\nSi perdono disegni, immagini, voti e le ${a.stanze} stanze di lavoro. Non si può annullare.${a.online ? `\n\nAttenzione: ora ci sono ${a.online} persone collegate, che verranno scollegate.` : ""}`;
    if (window.confirm(warn)) void run(() => call("DELETE", `?room=${encodeURIComponent(a.name)}`), `Aula "${a.name}" eliminata.`);
  };

  const enter = async (a: Aula) => {
    setErr("");
    const e = await openBoard(session, a.name);
    if (e) setErr(e);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Aule</h1>
          <p className="mt-1 text-[13px] text-steel">Le aule della board: crea quella del corso, comunica la password agli allievi, disattivala a fine corso. Con "Entra" apri la board come trainer.</p>
        </div>
        {!edit && <button className={btnPrimary} onClick={() => open()}>Nuova aula</button>}
      </div>

      {msg && <p role="status" className="rounded-lg bg-mint/10 px-4 py-3 text-[13px] font-medium text-mint">{msg}</p>}
      {err && <p role="alert" className="rounded-lg bg-err/10 px-4 py-3 text-[13px] font-medium text-err">{err}</p>}

      {edit && (
        <form onSubmit={submit} className={`${card} space-y-4`}>
          <h2 className="font-display text-lg font-bold">{edit === "new" ? "Nuova aula" : `Modifica ${edit}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome dell'aula" hint="Solo lettere, numeri, - e _ (es. CPSA-F_Dic26). Non si cambia dopo.">
              <input className={inputCls} value={f.name} disabled={edit !== "new"} required maxLength={64} pattern="[A-Za-z0-9_\-]+" onChange={(e) => setF({ ...f, name: e.target.value })} />
            </Field>
            <Field label="Password della sessione" hint={edit !== "new" && !orig ? "Password attuale non rileggibile: scrivine una nuova o lascia vuoto per non cambiarla." : "Da 8 caratteri. Cambiarla non scollega chi è già dentro."}>
              <div className="flex gap-2">
                <input className={inputCls} type="text" autoComplete="off" value={f.password} required={edit === "new"} minLength={8} maxLength={200} onChange={(e) => setF({ ...f, password: e.target.value })} />
                <button type="button" className={`${btnCls} shrink-0 border border-ink/20 hover:border-flame`} onClick={() => setF({ ...f, password: generatePassword(8) })} title="Compila il campo con una password casuale di 8 caratteri">Genera</button>
              </div>
            </Field>
            <Field label="Attiva fino al (facoltativo)" hint="Vuoto = nessuna fine. Dopo questa data nessuno entra più con la password.">
              <div className="flex gap-2">
                <input className={inputCls} type="date" value={f.until} onChange={(e) => setF({ ...f, until: e.target.value })} />
                {f.until && <button type="button" className={`${btnCls} shrink-0 border border-ink/20 hover:border-flame`} onClick={() => setF({ ...f, until: "" })}>Togli data</button>}
              </div>
            </Field>
          </div>
          <div className="flex gap-2">
            <button className={btnPrimary} disabled={busy}>{busy ? "Salvo…" : edit === "new" ? "Crea aula" : "Salva"}</button>
            <button type="button" className={`${btnCls} border border-ink/20 hover:border-flame`} onClick={() => setEdit(null)}>Annulla</button>
          </div>
        </form>
      )}

      <div className={`${card} overflow-x-auto p-0`}>
        {!aule ? (
          <p className="p-6 text-steel">Caricamento…</p>
        ) : aule.length === 0 ? (
          <p className="p-6 text-steel">Nessuna aula{err ? "" : ". Crea la prima con \"Nuova aula\""}.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <thead className="border-b border-ink/10 text-[12px] uppercase tracking-wide text-steel">
              <tr><th className="px-4 py-3">Aula</th><th className="px-4 py-3">Stato</th><th className="px-4 py-3">Password</th><th className="px-4 py-3">Ora</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {[...aule].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)).map((a) => (
                <tr key={a.name} className={a.active ? "" : "text-ink/55"}>
                  <td className="px-4 py-3"><b>{a.name}</b><div className="text-[12px] text-steel">{a.stanze ? `${a.stanze} stanze · ` : ""}modificata il {day(a.updatedAt)}</div></td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${a.active ? "bg-mint/15 text-mint" : a.configured ? "bg-err/10 text-err" : "bg-sand text-steel"}`}>{aulaStatus(a)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.password ? <><code>{a.password}</code> <button className="ml-2 text-flame hover:underline" onClick={() => copy(a.password!, "Password copiata.")}>Copia</button></> : <span className="text-steel">{a.configured ? "non rileggibile" : "—"}</span>}
                  </td>
                  <td className="px-4 py-3">{a.online ? <b>{a.online} collegati</b> : <span className="text-steel">nessuno</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 font-semibold text-flame hover:underline" onClick={() => enter(a)}>Entra</button>
                    {a.configured && <button className="mr-3 text-flame hover:underline" onClick={() => toggle(a)}>{a.active ? "Disattiva" : "Attiva"}</button>}
                    <button className="mr-3 text-flame hover:underline" onClick={() => open(a)}>{a.configured ? "Modifica" : "Imposta password"}</button>
                    <button className="text-err hover:underline" onClick={() => remove(a)}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
