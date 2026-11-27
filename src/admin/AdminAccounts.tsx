import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { generatePassword } from "../../shared/password.mjs";
import { Field, btnCls, btnPrimary, inputCls } from "./Admin";

/* Utenti del pannello e loro livello (tabella public.admin_emails). Solo il superuser vede questa sezione.
   superuser: tutto, comprese Impostazioni e questa sezione; si definisce solo da SQL e qui è in sola lettura.
   administrator: tutto tranne le Impostazioni. trainer: solo Materiali (file) e "Accedi alla board".
   Qui si crea l'utente (con una password provvisoria mostrata una sola volta) e gli si assegna il livello: non serve passare da Supabase. */

type Role = "trainer" | "administrator" | "superuser";
type Assignable = Exclude<Role, "superuser">;
interface Row { email: string; ruolo: Role }
interface Shown { email: string; password: string }

const ASSIGNABLE: Assignable[] = ["administrator", "trainer"];
const LABEL: Record<Role, string> = { superuser: "Superuser", administrator: "Administrator", trainer: "Trainer (solo Materiali e Board)" };

export function AdminAccounts({ session }: { session: Session }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [migrated, setMigrated] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [ruolo, setRuolo] = useState<Assignable>("administrator");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState<Shown | null>(null);
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (method: string, query = "", body?: unknown) => {
      const r = await fetch(`/api/admin/amministratori${query}`, {
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
  const load = useCallback(() => call("GET").then((j) => { setRows(j.admins); setMigrated(j.migrated !== false); }).catch((e: Error) => setErr(e.message)), [call]);
  useEffect(() => void load(), [load]);

  const reset = () => {
    setErr("");
    setMsg("");
    setShown(null);
  };

  const run = async (fn: () => Promise<unknown>, done: string) => {
    reset();
    try {
      await fn();
      setMsg(done);
      await load();
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    setBusy(true);
    try {
      const r = await call("POST", "", { email, ruolo, ...(password ? { password } : {}) });
      if (r.password) setShown({ email: r.email, password: r.password });
      else setMsg("L'utente esisteva già in Supabase: gli ho assegnato il livello (la sua password non cambia).");
      setEmail("");
      setPassword("");
      await load();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (r: Row) => {
    if (!window.confirm(`Impostare una nuova password per ${r.email}? Quella attuale smette di valere.`)) return;
    reset();
    try {
      const j = await call("PATCH", `?email=${encodeURIComponent(r.email)}`, { action: "reset" });
      setShown({ email: j.email, password: j.password });
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).then(() => setMsg("Password copiata."), () => setErr("Non riesco a copiare: seleziona il testo e copialo a mano."));

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="mb-1 font-display text-lg font-bold tracking-tight">Utenti del pannello</h2>
      <p className="mb-4 text-[13px] text-steel">
        <strong>Superuser</strong>: accesso completo, si definisce solo da SQL. <strong>Administrator</strong>: vede e gestisce tutto tranne le Impostazioni. <strong>Trainer</strong>: solo Materiali (file) e "Accedi alla board".
        Crea qui l'utente con una password provvisoria: non serve passare da Supabase.
      </p>
      {!migrated && (
        <p className="mb-3 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">Per usare i livelli esegui <code>supabase/migrazione-9.sql</code> e <code>supabase/migrazione-10.sql</code> nel SQL Editor di Supabase: finché non lo fai tutti gli amministratori restano superuser.</p>
      )}
      {msg && <p className="mb-3 rounded-lg bg-mint/10 px-4 py-2.5 text-[13px] font-medium text-mint">{msg}</p>}
      {err && <p className="mb-3 rounded-lg bg-err/10 px-4 py-2.5 text-[13px] font-medium text-err">{err}</p>}
      {shown && (
        <div className="mb-4 rounded-xl border border-flame/40 bg-flame/5 px-4 py-3 text-[13.5px]" role="status">
          <p className="font-semibold">Password provvisoria per {shown.email} (mostrata una sola volta)</p>
          <p className="mt-1 flex flex-wrap items-center gap-3">
            <code className="rounded bg-white px-2 py-1 text-[14px]">{shown.password}</code>
            <button type="button" className="text-flame hover:underline" onClick={() => copy(shown.password)}>Copia</button>
          </p>
          <p className="mt-1 text-[12px] text-steel">Comunicala all'interessato: il sito non la conserva e non potrai rivederla (potrai impostarne una nuova).</p>
        </div>
      )}

      {!rows ? (
        <p className="text-steel">Caricamento…</p>
      ) : (
        <table className="w-full text-left text-[13.5px]">
          <tbody className="divide-y divide-ink/5">
            {rows.map((r) => (
              <tr key={r.email}>
                <td className="py-2.5 pr-3">{r.email}</td>
                <td className="py-2.5 pr-3">
                  {r.ruolo === "superuser" ? (
                    <span className="text-ink/70">{LABEL.superuser} <span className="text-[12px] text-steel">(solo da SQL)</span></span>
                  ) : (
                    <select className={`${inputCls} !w-auto`} value={r.ruolo} aria-label={`Livello di ${r.email}`} onChange={(e) => void run(() => call("PATCH", `?email=${encodeURIComponent(r.email)}`, { ruolo: e.target.value }), "Livello aggiornato.")}>
                      {ASSIGNABLE.map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
                    </select>
                  )}
                </td>
                <td className="whitespace-nowrap py-2.5 text-right">
                  {r.ruolo !== "superuser" && (
                    <>
                      <button type="button" className="mr-3 text-flame hover:underline" onClick={() => void resetPassword(r)}>Reimposta password</button>
                      <button
                        type="button"
                        className="text-err hover:underline"
                        onClick={() => window.confirm(`Togliere l'accesso al pannello a ${r.email}?`) && void run(() => call("DELETE", `?email=${encodeURIComponent(r.email)}`), "Utente rimosso dal pannello.")}
                      >
                        Rimuovi
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={add} className="mt-5 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-2">
        <Field label="Email del nuovo utente">
          <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Livello">
          <select className={inputCls} value={ruolo} onChange={(e) => setRuolo(e.target.value as Assignable)}>
            {ASSIGNABLE.map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
          </select>
        </Field>
        <Field label="Password provvisoria (facoltativa)" hint="Da 10 caratteri. Se la lasci vuota ne genero una io. Se l'utente esiste già in Supabase la sua password non cambia.">
          <div className="flex gap-2">
            <input className={inputCls} type="text" autoComplete="off" value={password} minLength={10} maxLength={200} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className={`${btnCls} shrink-0 border border-ink/20 hover:border-flame`} onClick={() => setPassword(generatePassword(12))}>Genera</button>
          </div>
        </Field>
        <div className="self-end">
          <button className={btnPrimary} disabled={busy}>{busy ? "Creo…" : "Crea utente"}</button>
        </div>
      </form>
    </section>
  );
}
