import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../lib/supabase";

/* Pannello di gestione corsi (sostituisce il plugin WordPress "Cube Academy - Gestione Corsi").
   Rotte: #/admin (elenco) · #/admin/corso/new · #/admin/corso/<id>
   Accesso: utenti Supabase Auth la cui email è in public.admin_emails (RLS lato database). */

type Row = Record<string, string | number | boolean | null>;
type Errors = Record<string, string>;

const STATI: Record<number, string> = {
  0: "In Programma",
  1: "Confermato",
  2: "Non visualizzato",
  3: "Non Confermato",
  4: "In corso",
  5: "Completato",
};
const LANGS: [string, string][] = [
  ["it", "Italiano"],
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
];

/* ------------------------ tipi dei campi e conversioni ------------------------ */

const INTS = ["standard_price", "early_bird_price", "posti_totali", "posti_disponibili"];
const DECS = ["early_bird_percentuale", ...[1, 2, 3].map((i) => `codice_sconto_${i}_percentuale`)];
const DTS = ["early_bird_start", "early_bird_end", ...[1, 2, 3].flatMap((i) => [`codice_sconto_${i}_data_inizio`, `codice_sconto_${i}_data_fine`])];
const DATES = ["data_inizio", "data_fine"];
const BOOLS = ["in_evidenza", "iscrizioni_aperte"];
// testo NOT NULL nel DB: vuoto = stringa vuota (gli altri testi vuoti diventano NULL)
const TEXT_REQUIRED = ["titolo", "livello", ...LANGS.flatMap(([l]) => [`link_readmore_${l}`, `link_booking_${l}`, `home_subtitle_${l}`])];
const URLS = LANGS.flatMap(([l]) => [`link_readmore_${l}`, `link_booking_${l}`]);
const LIMITS: Record<string, number> = { livello: 10, titolo: 255 };

const pad = (n: number) => String(n).padStart(2, "0");
/** timestamptz ISO (UTC) -> valore per <input type="datetime-local"> nel fuso del browser */
const toLocalDT = (v: unknown) => {
  if (!v) return "";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toDate = (v: unknown) => String(v ?? "").slice(0, 10);
const strip = (h: unknown) => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/&reg;/g, "®").replace(/\s+/g, " ").trim();

/** Valida e converte lo stato del form nel payload per Supabase. */
function toPayload(f: Row): { data: Row; errors: Errors } {
  const data: Row = {};
  const errors: Errors = {};
  const empty = (v: unknown) => v === undefined || v === null || String(v).trim() === "";

  for (const [k, raw] of Object.entries(f)) {
    if (k === "id_corso") continue;
    if (BOOLS.includes(k)) data[k] = raw === true || raw === 1 || raw === "1";
    else if (k === "stato") data[k] = Number(raw);
    else if (INTS.includes(k)) {
      if (empty(raw)) data[k] = null;
      else if (!Number.isInteger(Number(raw)) || Number(raw) < 0) errors[k] = "numero intero non valido";
      else data[k] = Number(raw);
    } else if (DECS.includes(k)) {
      const n = Number(String(raw).replace(",", "."));
      if (empty(raw)) data[k] = k === "early_bird_percentuale" ? 0 : null;
      else if (!Number.isFinite(n) || n < 0 || n > 100) errors[k] = "percentuale non valida";
      else data[k] = n;
    } else if (DTS.includes(k)) {
      if (empty(raw)) data[k] = null;
      else {
        const d = new Date(String(raw));
        if (isNaN(d.getTime())) errors[k] = "data/ora non valida";
        else data[k] = /[zZ]|[+-]\d\d:?\d\d$/.test(String(raw)) ? String(raw) : d.toISOString(); // il valore locale diventa UTC
      }
    } else if (DATES.includes(k)) data[k] = empty(raw) ? null : String(raw).slice(0, 10);
    else {
      const v = empty(raw) ? "" : String(raw);
      if (URLS.includes(k) && v && !/^https?:\/\//i.test(v)) errors[k] = "URL non valido (deve iniziare con http:// o https://)";
      if (LIMITS[k] && v.length > LIMITS[k]) errors[k] = `massimo ${LIMITS[k]} caratteri`;
      data[k] = v === "" && !TEXT_REQUIRED.includes(k) ? null : v;
    }
  }
  if (!String(data.titolo ?? "").trim()) errors.titolo = "il titolo è obbligatorio";
  return { data, errors };
}

const go = (hash: string) => {
  window.location.hash = hash;
};

/* ------------------------------- UI helpers ------------------------------ */

const inputCls =
  "w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-flame focus:ring-2 focus:ring-flame/20";
const btnCls = "inline-flex items-center rounded-full px-4 py-2 text-[13px] font-semibold transition-colors";
const btnPrimary = `${btnCls} bg-ink text-white hover:bg-flame disabled:opacity-50`;

function Shell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#/admin" className="font-display text-lg font-bold tracking-tight">
            Cube Academy · <span className="text-ember">Gestione corsi</span>
          </a>
          <div className="flex items-center gap-3 text-[13px]">
            <a href="#/" className="text-white/70 hover:text-white">Vai al sito</a>
            {right}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}

function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-ink/70">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-steel">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] font-medium text-err">{error}</span>}
    </label>
  );
}

/* --------------------------------- login --------------------------------- */

function Login() {
  const [email, setEmail] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // messaggio reale di Supabase: distingue password errata, email non confermata, ecc.
      const m = error.message.toLowerCase();
      setErr(
        m.includes("invalid login")
          ? "Email o password non corretti (Supabase: invalid login credentials)."
          : m.includes("not confirmed")
            ? "Email non confermata: in Supabase apri Authentication → Users e conferma l'utente."
            : `Accesso non riuscito: ${error.message}`
      );
    }
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-7 shadow-card">
        <h1 className="font-display text-2xl font-bold tracking-tight">Accesso amministratori</h1>
        <p className="mt-1 text-[13px] text-steel">Gestione corsi Cube Academy</p>
        <div className="mt-6 space-y-4">
          <Field label="Email">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus required />
          </Field>
          <Field label="Password">
            <input className={inputCls} type="password" value={password} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
          </Field>
        </div>
        {err && <p role="alert" className="mt-4 text-[13px] font-medium text-err">{err}</p>}
        <button className={`${btnPrimary} mt-6 w-full justify-center`} disabled={busy}>
          {busy ? "Accesso…" : "Accedi"}
        </button>
      </form>
    </div>
  );
}

/* --------------------------------- elenco -------------------------------- */

function List() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState("");
  const [isErr, setIsErr] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("corsi")
      .select("id_corso, titolo, stato, in_evidenza, iscrizioni_aperte, data_it, data_inizio")
      .order("id_corso", { ascending: false });
    if (error) {
      setIsErr(true);
      setMsg(error.message);
    }
    // con RLS un utente non admin riceve semplicemente zero righe
    setRows((data as Row[]) ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await fn();
    setIsErr(!!error);
    setMsg(error ? error.message : ok);
    if (!error) await load();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">Corsi</h1>
        <button className={btnPrimary} onClick={() => go("#/admin/corso/new")}>+ Nuovo corso</button>
      </div>
      {msg && (
        <p role="status" className={`mt-4 rounded-lg px-4 py-2 text-[13px] ${isErr ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>{msg}</p>
      )}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[820px] text-left text-[13.5px]">
          <thead className="border-b border-ink/10 bg-sand/40 text-[11.5px] uppercase tracking-wider text-steel">
            <tr>
              {["ID", "Titolo", "Stato", "Iscrizioni", "Date", "Evid.", "Azioni"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={String(r.id_corso)} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-mono text-[12px] text-steel">{r.id_corso}</td>
                <td className="px-4 py-3">{strip(r.titolo)}</td>
                <td className="px-4 py-3">{STATI[Number(r.stato)] ?? "?"}</td>
                <td className="px-4 py-3">
                  <button
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${r.iscrizioni_aperte ? "bg-mint/15 text-mint" : "bg-err/10 text-err"}`}
                    onClick={() =>
                      act(() => supabase.from("corsi").update({ iscrizioni_aperte: !r.iscrizioni_aperte }).eq("id_corso", r.id_corso as number), "Stato iscrizioni aggiornato.")
                    }
                  >
                    {r.iscrizioni_aperte ? "Aperte" : "Chiuse"}
                  </button>
                </td>
                <td className="px-4 py-3 text-ink/70">{r.data_it}</td>
                <td className="px-4 py-3">{r.in_evidenza ? "✓" : ""}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button className="mr-3 font-semibold text-flame hover:underline" onClick={() => go(`#/admin/corso/${r.id_corso}`)}>Modifica</button>
                  <button
                    className="mr-3 font-semibold text-ink/70 hover:underline"
                    onClick={async () => {
                      const { data, error } = await supabase.from("corsi").select("*").eq("id_corso", r.id_corso as number).single();
                      if (error || !data) return act(async () => ({ error: error ?? { message: "Corso non trovato." } }), "");
                      const copy = { ...(data as Row) };
                      delete copy.id_corso;
                      const ins = await supabase.from("corsi").insert(copy).select("id_corso").single();
                      if (ins.error) return act(async () => ({ error: ins.error }), "");
                      go(`#/admin/corso/${(ins.data as Row).id_corso}`);
                    }}
                  >
                    Duplica
                  </button>
                  <button
                    className="font-semibold text-err hover:underline"
                    onClick={() => {
                      if (confirm("Eliminare definitivamente questo corso? L'operazione non è reversibile."))
                        act(() => supabase.from("corsi").delete().eq("id_corso", r.id_corso as number), "Corso eliminato.");
                    }}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {rows && !rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-steel">
                  Nessun corso visibile. Se sai che ce ne sono, l'email con cui hai fatto l'accesso potrebbe non essere abilitata (tabella admin_emails).
                </td>
              </tr>
            )}
            {!rows && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-steel">Caricamento…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --------------------------------- modifica ------------------------------- */

const EMPTY: Row = { titolo: "", livello: "Foundation", stato: 0, in_evidenza: false, iscrizioni_aperte: false };

function Edit({ id }: { id: string }) {
  const isNew = id === "new";
  const [f, setF] = useState<Row | null>(isNew ? EMPTY : null);
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState("it");

  useEffect(() => {
    if (isNew) return;
    supabase
      .from("corsi")
      .select("*")
      .eq("id_corso", Number(id))
      .single()
      .then(({ data, error }) => (error ? setMsg(error.message) : setF(data as Row)));
  }, [id, isNew]);

  if (!f) return <p className="text-steel">{msg || "Caricamento…"}</p>;

  const set = (k: string, v: string | number | boolean | null) => setF((p) => ({ ...(p as Row), [k]: v }));
  const text = (k: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <input className={inputCls} value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value)} {...extra} />
  );
  const F = (k: string, label: string, node: ReactNode, hint?: string) => (
    <Field label={label} error={errors[k]} hint={hint}>{node}</Field>
  );

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg("");
    const { data, errors: errs } = toPayload(f);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setMsg("Controlla i campi evidenziati.");
      setBusy(false);
      return;
    }
    if (isNew) {
      const r = await supabase.from("corsi").insert(data).select("id_corso").single();
      if (r.error) setMsg(r.error.message);
      else go(`#/admin/corso/${(r.data as Row).id_corso}`);
    } else {
      const r = await supabase.from("corsi").update(data).eq("id_corso", Number(id)).select("id_corso");
      setMsg(r.error ? r.error.message : r.data?.length ? "Corso salvato." : "Nessuna modifica salvata: permessi insufficienti?");
    }
    setBusy(false);
  };

  const check = (k: string, label: string) => (
    <label className="flex items-center gap-2 text-[14px]">
      <input type="checkbox" checked={!!f[k]} onChange={(e) => set(k, e.target.checked)} className="size-4 accent-flame" />
      {label}
    </label>
  );
  const dt = (k: string) => (
    <input type="datetime-local" className={inputCls} value={toLocalDT(f[k])} onChange={(e) => set(k, e.target.value)} />
  );

  const card = "rounded-2xl border border-ink/10 bg-white p-6";
  const h2 = "mb-4 font-display text-lg font-bold tracking-tight";
  const failed = Object.keys(errors).length > 0 || /permess|error|violat|denied/i.test(msg);

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="#/admin" className="text-[13px] text-flame hover:underline">← Torna all'elenco</a>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{isNew ? "Nuovo corso" : `Modifica corso #${id}`}</h1>
        </div>
        <button className={btnPrimary} disabled={busy}>{busy ? "Salvataggio…" : "Salva corso"}</button>
      </div>
      {msg && (
        <p role="status" className={`rounded-lg px-4 py-2 text-[13px] ${failed ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>{msg}</p>
      )}

      <section className={card}>
        <h2 className={h2}>Dati generali</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">{F("titolo", "Titolo (accetta HTML, es. <br>)", text("titolo", { maxLength: 255, required: true }))}</div>
          {F("livello", "Livello", text("livello", { maxLength: 10 }))}
          {F("stato", "Stato", (
            <select className={inputCls} value={Number(f.stato)} onChange={(e) => set("stato", Number(e.target.value))}>
              {Object.entries(STATI).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ), "“Completato” mostra la card tra le edizioni concluse; “Non visualizzato” la nasconde dal sito.")}
          {F("data_inizio", "Data inizio", <input type="date" className={inputCls} value={toDate(f.data_inizio)} onChange={(e) => set("data_inizio", e.target.value)} />, "Usata per ordinamento e calendario sul sito.")}
          {F("data_fine", "Data fine", <input type="date" className={inputCls} value={toDate(f.data_fine)} onChange={(e) => set("data_fine", e.target.value)} />)}
          {F("posti_totali", "Posti totali", text("posti_totali", { type: "number", min: 0 }), "Opzionale: se vuoto, il sito non mostra la barra dei posti.")}
          {F("posti_disponibili", "Posti disponibili", text("posti_disponibili", { type: "number", min: 0 }))}
          <div className="flex flex-wrap items-center gap-6 md:col-span-2">
            {check("in_evidenza", "In evidenza")}
            {check("iscrizioni_aperte", "Iscrizioni aperte")}
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Prezzi ed early bird</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {F("standard_price", "Prezzo standard (€)", text("standard_price", { type: "number", min: 0 }))}
          {F("early_bird_price", "Prezzo early bird (€)", text("early_bird_price", { type: "number", min: 0 }), "Se impostato ha la precedenza sulla percentuale.")}
          {F("early_bird_percentuale", "Sconto early bird (%)", text("early_bird_percentuale", { type: "number", step: "0.01", min: 0, max: 100 }))}
          {F("early_bird_start", "Early bird dal", dt("early_bird_start"))}
          {F("early_bird_end", "Early bird fino al", dt("early_bird_end"))}
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Codici sconto</h2>
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid gap-4 md:grid-cols-4">
              {F(`codice_sconto_${i}`, `Codice ${i}`, text(`codice_sconto_${i}`, { maxLength: 50 }))}
              {F(`codice_sconto_${i}_data_inizio`, "Dal", dt(`codice_sconto_${i}_data_inizio`))}
              {F(`codice_sconto_${i}_data_fine`, "Al", dt(`codice_sconto_${i}_data_fine`))}
              {F(`codice_sconto_${i}_percentuale`, "Sconto (%)", text(`codice_sconto_${i}_percentuale`, { type: "number", step: "0.01", min: 0, max: 100 }))}
            </div>
          ))}
          <div className="max-w-xs">{F("codice_sconto_privati", "Codice sconto privati", text("codice_sconto_privati", { maxLength: 10 }))}</div>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Contenuti per lingua</h2>
        <div role="tablist" className="mb-5 flex flex-wrap gap-2">
          {LANGS.map(([code, label]) => (
            <button
              type="button"
              role="tab"
              aria-selected={lang === code}
              key={code}
              onClick={() => setLang(code)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${lang === code ? "bg-ink text-white" : "border border-ink/20 text-ink/70 hover:bg-sand"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {LANGS.map(([code]) => (
          <div key={code} hidden={lang !== code} className="grid gap-4 md:grid-cols-2">
            {F(`data_${code}`, "Data (testo mostrato)", text(`data_${code}`, { maxLength: 60 }), "Es. “25 - 27 Marzo 2026”")}
            {F(`luogo_${code}`, "Luogo", text(`luogo_${code}`, { maxLength: 15 }))}
            {F(`lingua_${code}`, "Lingua del corso", text(`lingua_${code}`, { maxLength: 11 }))}
            {F(`note_${code}`, "Note", text(`note_${code}`, { maxLength: 10 }))}
            {F(`link_readmore_${code}`, "Link “Scopri di più”", text(`link_readmore_${code}`, { type: "url", maxLength: 150 }))}
            {F(`link_booking_${code}`, "Link iscrizione (booking)", text(`link_booking_${code}`, { type: "url", maxLength: 150 }))}
            <div className="md:col-span-2">
              {F(`home_subtitle_${code}`, "Sottotitolo home (HTML libero)", (
                <textarea className={`${inputCls} font-mono text-[12.5px]`} rows={3} value={String(f[`home_subtitle_${code}`] ?? "")} onChange={(e) => set(`home_subtitle_${code}`, e.target.value)} />
              ))}
            </div>
            <div className="md:col-span-2">
              {F(`read_more_${code}`, "Descrizione corso (read more, HTML)", (
                <textarea className={`${inputCls} font-mono text-[12.5px]`} rows={12} value={String(f[`read_more_${code}`] ?? "")} onChange={(e) => set(`read_more_${code}`, e.target.value)} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <button className={btnPrimary} disabled={busy}>{busy ? "Salvataggio…" : "Salva corso"}</button>
      </div>
    </form>
  );
}

/* --------------------------------- entry --------------------------------- */

export function Admin({ hash }: { hash: string }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabaseConfigured) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // l'utente può essere autenticato ma non abilitato (email assente in admin_emails)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) {
      setIsAdmin(null);
      return;
    }
    supabase.rpc("is_admin").then(({ data, error }) => setIsAdmin(error ? false : data === true));
  }, [uid]);

  if (!supabaseConfigured)
    return <div className="grid min-h-screen place-items-center px-6 text-center text-err">Supabase non configurato: mancano VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.</div>;
  if (session === undefined) return <div className="grid min-h-screen place-items-center text-steel">Caricamento…</div>;
  if (!session) return <Login />;

  const m = hash.match(/^#\/admin\/corso\/([^/]+)/);
  return (
    <Shell
      right={
        <button className="text-white/70 hover:text-white" onClick={() => supabase.auth.signOut()}>
          Esci ({session.user.email})
        </button>
      }
    >
      {isAdmin === false ? (
        <div className="max-w-2xl rounded-2xl border border-err/30 bg-white p-6">
          <h1 className="font-display text-xl font-bold text-err">Accesso riuscito, ma questo utente non è abilitato</h1>
          <p className="mt-2 text-[14px] text-ink/70">
            Sei entrato come <strong>{session.user.email}</strong>, ma questa email non è nell'elenco degli amministratori.
            In Supabase, nel SQL Editor, esegui:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-ink p-4 text-[12.5px] text-white">
            {`insert into public.admin_emails (email) values ('${session.user.email}');`}
          </pre>
          <p className="mt-3 text-[13px] text-steel">Poi ricarica questa pagina.</p>
        </div>
      ) : isAdmin === null ? (
        <p className="text-steel">Verifica permessi…</p>
      ) : m ? (
        <Edit key={m[1]} id={m[1]} />
      ) : (
        <List />
      )}
    </Shell>
  );
}
