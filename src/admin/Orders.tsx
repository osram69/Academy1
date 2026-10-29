import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Pencil, Trash2, X } from "lucide-react";

interface Participant {
  nome: string; cognome: string; email: string; telefono?: string;
  consensoPrivacy?: boolean; consensoMarketing?: boolean; consensoAudioVideo?: boolean;
}
type Billing = Record<string, string | undefined> & { type: string; ragione: string; nome: string; cognome: string };
interface Order {
  ref: string; id_corso: number; created_at: string; paid_at: string | null; status: string; method: string; test_mode: boolean;
  provider_ref: string | null; seats: number; unit_cents: number; subtotal_cents: number; discount_cents: number; vat_cents: number;
  total_cents: number; coupon: string | null; participants: Participant[]; billing: Billing;
  course: { titolo: string; livello: string; data_inizio: string | null; data_fine: string | null } | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Pagato", cls: "bg-mint/15 text-mint" },
  pending: { label: "In attesa", cls: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Annullato", cls: "bg-ink/8 text-steel" },
  failed: { label: "Fallito", cls: "bg-err/10 text-err" },
  refunded: { label: "Rimborsato", cls: "bg-ink/8 text-steel" },
};
const METHOD: Record<string, string> = { stripe: "Stripe", paypal: "PayPal", sumup: "SumUp", bonifico: "Bonifico" };
const BILLING_TYPE: Record<string, string> = { privato: "Privato", pro: "Professionista / P.IVA", azienda: "Azienda", estera: "Azienda estera (UE)" };
const eur2 = (c: number) => (c / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const when = (iso: string) => new Date(iso).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("it-IT") : "");
const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-steel">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1.5 text-[13px]">
      {rows.filter(([, v]) => v !== "" && v != null && v !== false).map(([k, v]) => (
        <div key={k} className="contents"><dt className="text-steel">{k}</dt><dd className="break-words font-medium">{v}</dd></div>
      ))}
    </dl>
  );
}

const BILLING_FIELDS: [string, string][] = [
  ["ragione", "Ragione sociale"], ["nome", "Nome"], ["cognome", "Cognome"], ["cf", "Codice fiscale"], ["piva", "P.IVA"], ["vatId", "VAT ID"],
  ["sdi", "Codice SDI"], ["pec", "PEC"], ["via", "Via"], ["cap", "CAP"], ["citta", "Città"], ["paese", "Paese"],
];

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block text-[12px] text-steel">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-[13px] font-medium text-ink outline-none focus:border-flame" />
    </label>
  );
}

function OrderDetail({ o, startEditing, onClose, onDelete, onSave }: {
  o: Order; startEditing: boolean; onClose: () => void; onDelete: () => void;
  onSave: (participants: Participant[], billing: Billing) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [parts, setParts] = useState<Participant[]>(o.participants);
  const [bill, setBill] = useState<Billing>(o.billing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const setPart = (i: number, patch: Partial<Participant>) => setParts((cur) => cur.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const save = async () => {
    setSaving(true);
    setError("");
    const msg = await onSave(parts, bill);
    setSaving(false);
    if (msg) setError(msg);
    else setEditing(false);
  };
  const b = o.billing;
  const st = STATUS[o.status] ?? { label: o.status, cls: "bg-ink/8 text-steel" };
  const who = b.ragione || `${b.nome} ${b.cognome}`.trim();
  const address = [b.via, `${b.cap || ""} ${b.citta || ""}`.trim(), b.paese].filter(Boolean).join(", ");
  const yn = (v?: boolean) => (v ? "sì" : "no");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:py-10" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Iscrizione ${o.ref}`} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] text-steel">Iscrizione</p>
            <h2 className="font-display text-xl font-bold tracking-tight">{o.ref}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${st.cls}`}>{st.label}</span>
              {o.test_mode && o.method !== "bonifico" && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">prova</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="grid size-9 place-items-center rounded-full border border-ink/10 hover:bg-sand/60"><X className="size-4" /></button>
        </div>

        <Section title="Ordine">
          <Rows rows={[
            ["Corso", o.course ? `${plain(o.course.titolo)} (#${o.id_corso})` : `#${o.id_corso}`],
            ["Date", o.course?.data_inizio ? [day(o.course.data_inizio), day(o.course.data_fine)].filter((d, i, a) => d && a.indexOf(d) === i).join(" – ") : ""],
            ["Data ordine", when(o.created_at)],
            ["Pagato il", o.paid_at ? when(o.paid_at) : ""],
            ["Metodo", METHOD[o.method] ?? o.method],
            ["Rif. provider", o.provider_ref ? <span className="font-mono text-[12px]">{o.provider_ref}</span> : ""],
          ]} />
        </Section>

        <Section title="Importi">
          <Rows rows={[
            ["Posti", String(o.seats)],
            ["Prezzo unitario", eur2(o.unit_cents)],
            ["Imponibile", eur2(o.subtotal_cents - o.discount_cents)],
            ["Sconto", o.discount_cents > 0 ? `− ${eur2(o.discount_cents)}${o.coupon ? ` (${o.coupon})` : ""}` : ""],
            ["IVA", eur2(o.vat_cents)],
            ["Totale", <strong key="t">{eur2(o.total_cents)}</strong>],
          ]} />
        </Section>

        {editing ? (
          <>
            <Section title={`Partecipanti (${parts.length})`}>
              <div className="space-y-3">
                {parts.map((p, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-ink/10 p-3 sm:grid-cols-2">
                    <Field label="Nome" value={p.nome} onChange={(v) => setPart(i, { nome: v })} />
                    <Field label="Cognome" value={p.cognome} onChange={(v) => setPart(i, { cognome: v })} />
                    <Field label="Email" type="email" value={p.email} onChange={(v) => setPart(i, { email: v })} />
                    <Field label="Telefono" value={p.telefono || ""} onChange={(v) => setPart(i, { telefono: v })} />
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] sm:col-span-2">
                      {([["consensoPrivacy", "Privacy"], ["consensoMarketing", "Marketing"], ["consensoAudioVideo", "Audio/video"]] as const).map(([k, l]) => (
                        <label key={k} className="inline-flex items-center gap-1.5"><input type="checkbox" checked={!!p[k]} onChange={(e) => setPart(i, { [k]: e.target.checked })} />{l}</label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Dati di fatturazione">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[12px] text-steel">
                  Tipologia
                  <select value={bill.type} onChange={(e) => setBill({ ...bill, type: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[13px] font-medium text-ink outline-none focus:border-flame">
                    {Object.entries(BILLING_TYPE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </label>
                <label className="block text-[12px] text-steel">
                  Lingua email
                  <select value={bill.lang || "it"} onChange={(e) => setBill({ ...bill, lang: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[13px] font-medium text-ink outline-none focus:border-flame">
                    {["it", "en", "fr", "de"].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                  </select>
                </label>
                {BILLING_FIELDS.map(([k, l]) => <Field key={k} label={l} value={bill[k] || ""} onChange={(v) => setBill({ ...bill, [k]: v })} />)}
              </div>
            </Section>
            <p className="mt-3 text-[12px] text-steel">Si correggono solo i dati anagrafici e di fatturazione: importi, stato e pagamento non cambiano.</p>
            {error && <p role="alert" className="mt-3 rounded-lg bg-err/10 px-4 py-2 text-[13px] text-err">{error}</p>}
          </>
        ) : (
          <>
        <Section title={`Partecipanti (${o.participants.length})`}>
          <div className="space-y-3">
            {o.participants.map((p, i) => (
              <div key={`${p.email}-${i}`} className="rounded-xl border border-ink/10 p-3">
                <Rows rows={[
                  ["Nome", `${p.nome} ${p.cognome}`],
                  ["Email", <a key="e" className="text-flame hover:underline" href={`mailto:${p.email}`}>{p.email}</a>],
                  ["Telefono", p.telefono || ""],
                  ["Privacy", yn(p.consensoPrivacy)],
                  ["Marketing", yn(p.consensoMarketing)],
                  ["Audio/video", yn(p.consensoAudioVideo)],
                ]} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Dati di fatturazione">
          <Rows rows={[
            ["Tipologia", BILLING_TYPE[b.type] ?? b.type],
            [b.ragione ? "Ragione sociale" : "Nome", who],
            ["Codice fiscale", b.cf || ""],
            ["P.IVA", b.piva || ""],
            ["VAT ID", b.vatId || ""],
            ["Codice SDI", b.sdi || ""],
            ["PEC", b.pec || ""],
            ["Indirizzo", address],
            ["Lingua email", (b.lang || "it").toUpperCase()],
          ]} />
        </Section>

          </>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
          <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-full border border-err/30 px-4 py-2 text-[13px] font-semibold text-err hover:bg-err/10">
            <Trash2 className="size-4" aria-hidden="true" />Elimina iscrizione
          </button>
          {editing ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setParts(o.participants); setBill(o.billing); setError(""); setEditing(false); }} className="rounded-full border border-ink/15 px-4 py-2 text-[13px] font-semibold hover:bg-sand/60">Annulla</button>
              <button type="button" onClick={save} disabled={saving} className="rounded-full bg-ink px-5 py-2 text-[13px] font-semibold text-white hover:bg-flame disabled:opacity-60">{saving ? "Salvataggio…" : "Salva modifiche"}</button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-flame">
              <Pencil className="size-4" aria-hidden="true" />Modifica dati
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Elenco iscrizioni servito dal server agli amministratori: dettaglio al clic sul riferimento, eliminazione dal cestino. */
export function OrdersPage({ session }: { session: Session }) {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<{ ref: string; edit: boolean } | null>(null);
  const auth = { Authorization: `Bearer ${session.access_token}` };

  useEffect(() => {
    fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error || "Server non raggiungibile"))))
      .then(setRows)
      .catch((e: Error) => setErr(e.message));
  }, [session.access_token]);

  const remove = async (o: Order) => {
    const warn = o.status === "paid" ? "\n\nATTENZIONE: l'iscrizione risulta PAGATA." : "";
    if (!window.confirm(`Eliminare definitivamente l'iscrizione ${o.ref}?${warn}\nL'operazione non si può annullare.`)) return;
    try {
      const r = await fetch(`/api/admin/orders?ref=${encodeURIComponent(o.ref)}`, { method: "DELETE", headers: auth });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Eliminazione non riuscita");
      setRows((cur) => (cur ? cur.filter((x) => x.ref !== o.ref) : cur));
      setOpen(null);
      setErr("");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const save = async (o: Order, participants: Participant[], billing: Billing): Promise<string | null> => {
    try {
      const r = await fetch(`/api/admin/orders?ref=${encodeURIComponent(o.ref)}`, { method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ participants, billing }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return j.error || "Salvataggio non riuscito";
      setRows((cur) => (cur ? cur.map((x) => (x.ref === o.ref ? { ...x, participants: j.participants, billing: j.billing } : x)) : cur));
      return null;
    } catch {
      return "Server non raggiungibile";
    }
  };
  const current = open ? rows?.find((x) => x.ref === open.ref) ?? null : null;

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Iscrizioni</h1>
      <p className="mt-1 text-[13px] text-steel">Ultime 200. Gli ordini in sandbox sono marcati “prova”. Clicca sul riferimento per vedere tutti i dati.</p>
      {err && <p role="alert" className="mt-4 rounded-lg bg-err/10 px-4 py-2 text-[13px] text-err">{err}</p>}
      {!rows && !err && <p className="mt-4 text-steel">Caricamento…</p>}
      {rows && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="border-b border-ink/10 bg-sand/40 text-[11.5px] uppercase tracking-wider text-steel">
              <tr>
                {["Data", "Rif.", "Corso", "Partecipanti", "Fatturazione", "Metodo", "Stato", "Totale"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                <th className="px-4 py-3"><span className="sr-only">Azioni</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const st = STATUS[o.status] ?? { label: o.status, cls: "bg-ink/8 text-steel" };
                return (
                  <tr key={o.ref} className="border-b border-ink/5 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{when(o.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">
                      <button type="button" onClick={() => setOpen({ ref: o.ref, edit: false })} className="font-semibold text-flame underline-offset-2 hover:underline" title="Mostra i dati dell'iscrizione">{o.ref}</button>
                    </td>
                    <td className="px-4 py-3">#{o.id_corso}</td>
                    <td className="px-4 py-3">
                      {o.participants.map((p) => <div key={p.email}>{p.nome} {p.cognome} <span className="text-steel">· {p.email}</span></div>)}
                    </td>
                    <td className="px-4 py-3">{o.billing.ragione || `${o.billing.nome} ${o.billing.cognome}`}<div className="text-steel">{o.billing.type}{o.coupon ? ` · ${o.coupon}` : ""}</div></td>
                    <td className="px-4 py-3">{METHOD[o.method] ?? o.method}{o.test_mode && o.method !== "bonifico" ? <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">prova</span> : null}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${st.cls}`}>{st.label}</span></td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{eur2(o.total_cents)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" onClick={() => setOpen({ ref: o.ref, edit: true })} aria-label={`Modifica l'iscrizione ${o.ref}`} title="Modifica" className="inline-grid size-8 place-items-center rounded-full text-steel hover:bg-ink/8 hover:text-ink">
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => remove(o)} aria-label={`Elimina l'iscrizione ${o.ref}`} title="Elimina" className="inline-grid size-8 place-items-center rounded-full text-steel hover:bg-err/10 hover:text-err">
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-steel">Nessuna iscrizione.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {open && current && <OrderDetail key={`${current.ref}-${open.edit}`} o={current} startEditing={open.edit} onClose={() => setOpen(null)} onDelete={() => remove(current)} onSave={(p, b) => save(current, p, b)} />}
    </>
  );
}
