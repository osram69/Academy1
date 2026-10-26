import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

interface Order {
  ref: string; id_corso: number; created_at: string; paid_at: string | null; status: string; method: string; test_mode: boolean;
  seats: number; total_cents: number; coupon: string | null;
  participants: { nome: string; cognome: string; email: string }[]; billing: { type: string; ragione: string; nome: string; cognome: string };
}

const STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Pagato", cls: "bg-mint/15 text-mint" },
  pending: { label: "In attesa", cls: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Annullato", cls: "bg-ink/8 text-steel" },
  failed: { label: "Fallito", cls: "bg-err/10 text-err" },
  refunded: { label: "Rimborsato", cls: "bg-ink/8 text-steel" },
};
const METHOD: Record<string, string> = { stripe: "Stripe", paypal: "PayPal", sumup: "SumUp", bonifico: "Bonifico" };
const eur2 = (c: number) => (c / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });

/** Elenco iscrizioni (sola lettura) servito dal server agli amministratori. */
export function OrdersPage({ session }: { session: Session }) {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error || "Server non raggiungibile"))))
      .then(setRows)
      .catch((e: Error) => setErr(e.message));
  }, [session.access_token]);

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Iscrizioni</h1>
      <p className="mt-1 text-[13px] text-steel">Ultime 200. Gli ordini in sandbox sono marcati “prova”.</p>
      {err && <p role="alert" className="mt-4 rounded-lg bg-err/10 px-4 py-2 text-[13px] text-err">{err}</p>}
      {!rows && !err && <p className="mt-4 text-steel">Caricamento…</p>}
      {rows && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="border-b border-ink/10 bg-sand/40 text-[11.5px] uppercase tracking-wider text-steel">
              <tr>{["Data", "Rif.", "Corso", "Partecipanti", "Fatturazione", "Metodo", "Stato", "Totale"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const st = STATUS[o.status] ?? { label: o.status, cls: "bg-ink/8 text-steel" };
                return (
                  <tr key={o.ref} className="border-b border-ink/5 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{new Date(o.created_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{o.ref}</td>
                    <td className="px-4 py-3">#{o.id_corso}</td>
                    <td className="px-4 py-3">
                      {o.participants.map((p) => <div key={p.email}>{p.nome} {p.cognome} <span className="text-steel">· {p.email}</span></div>)}
                    </td>
                    <td className="px-4 py-3">{o.billing.ragione || `${o.billing.nome} ${o.billing.cognome}`}<div className="text-steel">{o.billing.type}{o.coupon ? ` · ${o.coupon}` : ""}</div></td>
                    <td className="px-4 py-3">{METHOD[o.method] ?? o.method}{o.test_mode && o.method !== "bonifico" ? <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">prova</span> : null}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${st.cls}`}>{st.label}</span></td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{eur2(o.total_cents)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-steel">Nessuna iscrizione.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
