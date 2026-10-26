import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Field, btnPrimary, inputCls } from "./Admin";

/* Impostazioni del sito (tabella public.impostazioni, una riga): metodi di pagamento, sandbox,
   sconto privati e codici sconto globali. Le chiavi segrete NON stanno qui: sono variabili d'ambiente
   del server (Hostinger); questa pagina mostra solo quali mancano. */

type MethodId = "stripe" | "paypal" | "sumup" | "bonifico";
interface Coupon { code: string; label: string; percent: number; start: string; end: string; scopes: string[]; enabled: boolean }
interface Config {
  methods: Record<MethodId, { enabled: boolean; sandbox?: boolean }>;
  private: { enabled: boolean; percent: number };
  coupons: Coupon[];
}
interface MethodStatus { enabled: boolean; sandbox: boolean; configured: boolean; missing: string[]; available: boolean }

const METHOD_LABELS: Record<MethodId, string> = { stripe: "Carta · Stripe", paypal: "PayPal", sumup: "Carta · SumUp", bonifico: "Bonifico bancario" };
const SCOPES: [string, string][] = [["privato", "Privato"], ["pro", "Libero professionista"], ["azienda", "Azienda italiana"], ["estera", "Azienda estera"]];
const MAX_COUPONS = 20;

const DEFAULT_CONFIG: Config = {
  methods: { stripe: { enabled: true, sandbox: true }, paypal: { enabled: true, sandbox: true }, sumup: { enabled: true, sandbox: true }, bonifico: { enabled: true } },
  private: { enabled: true, percent: 50 },
  coupons: [],
};

/** Completa la config salvata con i default (stessa logica del server). */
function withDefaults(raw: Partial<Config> | null | undefined): Config {
  const r = raw ?? {};
  const methods = { ...DEFAULT_CONFIG.methods };
  (Object.keys(methods) as MethodId[]).forEach((k) => {
    const m = r.methods?.[k];
    methods[k] = { enabled: m?.enabled !== false, ...(k === "bonifico" ? {} : { sandbox: m?.sandbox !== false }) };
  });
  return {
    methods,
    private: { enabled: r.private?.enabled !== false, percent: r.private?.percent ?? 50 },
    coupons: (r.coupons ?? []).map((c) => ({ code: c.code, label: c.label ?? "", percent: c.percent, start: c.start ?? "", end: c.end ?? "", scopes: c.scopes ?? SCOPES.map(([s]) => s), enabled: c.enabled !== false })),
  };
}

const card = "rounded-2xl border border-ink/10 bg-white p-6";
const h2 = "mb-1 font-display text-lg font-bold tracking-tight";
const hint = "mb-4 text-[13px] text-steel";

export function SettingsPage({ session }: { session: Session }) {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [status, setStatus] = useState<Record<MethodId, MethodStatus> | null>(null);
  const [statusErr, setStatusErr] = useState("");
  const [msg, setMsg] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("impostazioni").select("config").eq("id", 1).maybeSingle().then(({ data, error }) => {
      if (error) { setBad(true); setMsg(`${error.message} — hai eseguito supabase/migrazione-2.sql?`); }
      setCfg(withDefaults(data?.config as Partial<Config> | undefined));
    });
    fetch("/api/admin/status", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error || "Server non raggiungibile"))))
      .then((j) => setStatus(j.methods))
      .catch((e: Error) => setStatusErr(e.message));
  }, [session.access_token]);

  if (!cfg) return <p className="text-steel">{msg || "Caricamento…"}</p>;

  const setMethod = (id: MethodId, patch: Partial<Config["methods"][MethodId]>) =>
    setCfg({ ...cfg, methods: { ...cfg.methods, [id]: { ...cfg.methods[id], ...patch } } });
  const setCoupon = (i: number, patch: Partial<Coupon>) =>
    setCfg({ ...cfg, coupons: cfg.coupons.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });
  const toggleScope = (i: number, scope: string) => {
    const cur = cfg.coupons[i].scopes;
    setCoupon(i, { scopes: cur.includes(scope) ? cur.filter((s) => s !== scope) : [...cur, scope] });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const codes = cfg.coupons.map((c) => c.code.trim().toUpperCase());
    if (cfg.coupons.some((c, i) => !codes[i] || !(c.percent > 0 && c.percent <= 100))) { setBad(true); setMsg("Ogni codice sconto deve avere un codice e una percentuale tra 0 e 100."); return; }
    if (new Set(codes).size !== codes.length) { setBad(true); setMsg("Ci sono codici sconto duplicati."); return; }
    if (cfg.coupons.some((c) => c.scopes.length === 0)) { setBad(true); setMsg("Seleziona almeno una tipologia di fatturazione per ogni codice."); return; }
    setBusy(true);
    const config: Config = { ...cfg, coupons: cfg.coupons.map((c, i) => ({ ...c, code: codes[i] })) };
    const { error } = await supabase.from("impostazioni").upsert({ id: 1, config, updated_at: new Date().toISOString() });
    setBad(!!error);
    setMsg(error ? error.message : "Impostazioni salvate. Il sito le applica entro pochi secondi.");
    setBusy(false);
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">Impostazioni</h1>
        <button className={btnPrimary} disabled={busy}>{busy ? "Salvataggio…" : "Salva impostazioni"}</button>
      </div>
      {msg && <p role="status" className={`rounded-lg px-4 py-2 text-[13px] ${bad ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>{msg}</p>}

      <section className={card}>
        <h2 className={h2}>Metodi di pagamento</h2>
        <p className={hint}>
          Attiva o disattiva ogni metodo e scegli se usa la <strong>sandbox</strong> (prove, nessun addebito reale) o la modalità <strong>live</strong>.
          Le chiavi sono variabili d'ambiente del server (Hostinger): qui vedi solo se sono presenti.
        </p>
        {statusErr && <p className="mb-3 rounded-lg bg-err/10 px-3 py-2 text-[12.5px] text-err">Stato chiavi non disponibile: {statusErr}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead className="border-b border-ink/10 text-[11.5px] uppercase tracking-wider text-steel">
              <tr><th className="py-2 pr-4">Metodo</th><th className="px-4">Attivo</th><th className="px-4">Modalità</th><th className="px-4">Chiavi sul server</th></tr>
            </thead>
            <tbody>
              {(Object.keys(METHOD_LABELS) as MethodId[]).map((id) => {
                const m = cfg.methods[id];
                const st = status?.[id];
                return (
                  <tr key={id} className="border-b border-ink/5 last:border-0">
                    <td className="py-3 pr-4 font-semibold">{METHOD_LABELS[id]}</td>
                    <td className="px-4">
                      <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-flame" checked={m.enabled} onChange={(e) => setMethod(id, { enabled: e.target.checked })} />{m.enabled ? "Sì" : "No"}</label>
                    </td>
                    <td className="px-4">
                      {id === "bonifico" ? <span className="text-steel">—</span> : (
                        <select className={`${inputCls} max-w-[150px]`} value={m.sandbox ? "sandbox" : "live"} onChange={(e) => setMethod(id, { sandbox: e.target.value === "sandbox" })} aria-label={`Modalità ${METHOD_LABELS[id]}`}>
                          <option value="sandbox">Sandbox (prova)</option>
                          <option value="live">Live (reale)</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4">
                      {!st ? <span className="text-steel">…</span> : st.configured
                        ? <span className="rounded-full bg-mint/15 px-2.5 py-1 text-[12px] font-semibold text-mint">Presenti</span>
                        : <span className="text-[12px] text-err">Mancano: <span className="font-mono">{st.missing.join(", ")}</span></span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-steel">
          Un metodo compare nel checkout solo se è attivo <em>e</em> ha le chiavi della modalità scelta. Passare a Live richiede le variabili senza suffisso <span className="font-mono">_TEST</span>.
        </p>
      </section>

      <section className={card}>
        <h2 className={h2}>Sconto privati</h2>
        <p className={hint}>
          Si applica in automatico a chi si iscrive come <strong>privato</strong> (persona fisica senza P.IVA), in percentuale sul <strong>prezzo di listino</strong>,
          in aggiunta all'early bird quando attivo. Non si somma a un codice sconto: vale la combinazione più conveniente.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" className="size-4 accent-flame" checked={cfg.private.enabled} onChange={(e) => setCfg({ ...cfg, private: { ...cfg.private, enabled: e.target.checked } })} />
            Sconto privati attivo
          </label>
          <div className="w-40">
            <Field label="Percentuale sul listino">
              <input type="number" min={0} max={100} step={0.5} className={inputCls} value={cfg.private.percent} onChange={(e) => setCfg({ ...cfg, private: { ...cfg.private, percent: Number(e.target.value) } })} />
            </Field>
          </div>
        </div>
        <p className="mt-3 text-[12.5px] text-steel">
          Esempio: listino 1.500 €, early bird 1.300 €, sconto 50% → 1.500 − 200 − 750 = <strong>550 € + IVA</strong>.
        </p>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={h2}>Codici sconto</h2>
            <p className={hint}>
              Validi per tutti i corsi, per le tipologie di fatturazione scelte e nel periodo indicato. La percentuale si applica al prezzo già scontato early bird.
              I codici per singola edizione si impostano ancora nella scheda del corso.
            </p>
          </div>
          <button type="button" className={`${btnPrimary} shrink-0`} disabled={cfg.coupons.length >= MAX_COUPONS}
            onClick={() => setCfg({ ...cfg, coupons: [...cfg.coupons, { code: "", label: "", percent: 10, start: "", end: "", scopes: SCOPES.map(([s]) => s), enabled: true }] })}>
            + Nuovo codice
          </button>
        </div>
        {cfg.coupons.length === 0 && <p className="text-[13.5px] text-steel">Nessun codice sconto configurato.</p>}
        <div className="space-y-4">
          {cfg.coupons.map((c, i) => (
            <div key={i} className="rounded-xl border border-ink/10 bg-paper/50 p-4">
              <div className="grid gap-3 md:grid-cols-[1.2fr_1.5fr_0.7fr_1fr_1fr]">
                <Field label="Codice"><input className={`${inputCls} uppercase`} value={c.code} maxLength={50} onChange={(e) => setCoupon(i, { code: e.target.value.toUpperCase() })} /></Field>
                <Field label="Etichetta (interna)"><input className={inputCls} value={c.label} maxLength={100} onChange={(e) => setCoupon(i, { label: e.target.value })} /></Field>
                <Field label="Sconto %"><input type="number" min={0} max={100} step={0.5} className={inputCls} value={c.percent} onChange={(e) => setCoupon(i, { percent: Number(e.target.value) })} /></Field>
                <Field label="Valido dal"><input type="date" className={inputCls} value={c.start} onChange={(e) => setCoupon(i, { start: e.target.value })} /></Field>
                <Field label="Valido fino al"><input type="date" className={inputCls} value={c.end} onChange={(e) => setCoupon(i, { end: e.target.value })} /></Field>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                <span className="font-semibold text-ink/70">Per:</span>
                {SCOPES.map(([s, l]) => (
                  <label key={s} className="flex items-center gap-1.5"><input type="checkbox" className="size-4 accent-flame" checked={c.scopes.includes(s)} onChange={() => toggleScope(i, s)} />{l}</label>
                ))}
                <label className="ml-auto flex items-center gap-1.5"><input type="checkbox" className="size-4 accent-flame" checked={c.enabled} onChange={(e) => setCoupon(i, { enabled: e.target.checked })} />Attivo</label>
                <button type="button" className="text-err hover:underline" onClick={() => setCfg({ ...cfg, coupons: cfg.coupons.filter((_, idx) => idx !== i) })}>Elimina</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
