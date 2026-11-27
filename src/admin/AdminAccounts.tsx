import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Field, btnPrimary, inputCls } from "./Admin";

/* Amministratori del pannello e loro livello (tabella public.admin_emails). Solo il superuser vede questa sezione.
   superuser: tutto, comprese Impostazioni e questa sezione. administrator: tutto tranne le Impostazioni.
   L'utente si crea prima da Supabase > Authentication > Users; qui gli si assegna il livello. */

type Role = "trainer" | "administrator" | "superuser";
interface Row { email: string; ruolo: Role }

const LABEL: Record<Role, string> = { superuser: "Superuser", administrator: "Administrator", trainer: "Trainer (solo Materiali e Board)" };

export function AdminAccounts({ session }: { session: Session }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [migrated, setMigrated] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [ruolo, setRuolo] = useState<Role>("administrator");

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

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setErr("");
    setMsg("");
    try {
      await fn();
      setMsg(done);
      await load();
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    void run(() => call("POST", "", { email, ruolo }), "Amministratore aggiunto.").then(() => setEmail(""));
  };

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="mb-1 font-display text-lg font-bold tracking-tight">Amministratori del pannello</h2>
      <p className="mb-4 text-[13px] text-steel">
        <strong>Superuser</strong>: accesso completo, comprese Impostazioni e questa sezione. <strong>Administrator</strong>: vede e gestisce tutto tranne le Impostazioni.
        Crea prima l'utente in Supabase (Authentication → Users), poi assegna qui il livello.
      </p>
      {!migrated && (
        <p className="mb-3 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">Per usare i livelli esegui <code>supabase/migrazione-9.sql</code> nel SQL Editor di Supabase: finché non lo fai tutti gli amministratori restano superuser.</p>
      )}
      {msg && <p className="mb-3 rounded-lg bg-mint/10 px-4 py-2.5 text-[13px] font-medium text-mint">{msg}</p>}
      {err && <p className="mb-3 rounded-lg bg-err/10 px-4 py-2.5 text-[13px] font-medium text-err">{err}</p>}

      {!rows ? (
        <p className="text-steel">Caricamento…</p>
      ) : (
        <table className="w-full text-left text-[13.5px]">
          <tbody className="divide-y divide-ink/5">
            {rows.map((r) => (
              <tr key={r.email}>
                <td className="py-2.5 pr-3">{r.email}</td>
                <td className="py-2.5 pr-3">
                  <select className={`${inputCls} !w-auto`} value={r.ruolo} aria-label={`Livello di ${r.email}`} onChange={(e) => void run(() => call("PATCH", `?email=${encodeURIComponent(r.email)}`, { ruolo: e.target.value }), "Livello aggiornato.")}>
                    {(Object.keys(LABEL) as Role[]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
                  </select>
                </td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    className="text-err hover:underline"
                    onClick={() => window.confirm(`Togliere l'accesso al pannello a ${r.email}?`) && void run(() => call("DELETE", `?email=${encodeURIComponent(r.email)}`), "Amministratore rimosso.")}
                  >
                    Rimuovi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={add} className="mt-5 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-5">
        <div className="min-w-[240px] flex-1">
          <Field label="Email dell'utente Supabase">
            <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <Field label="Livello">
          <select className={inputCls} value={ruolo} onChange={(e) => setRuolo(e.target.value as Role)}>
            {(Object.keys(LABEL) as Role[]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
          </select>
        </Field>
        <button className={btnPrimary}>Aggiungi</button>
      </form>
    </section>
  );
}
