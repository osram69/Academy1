import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { CalendarClock, CheckCheck, CircleCheck, CircleHelp, EyeOff, Play, type LucideIcon } from "lucide-react";
import { MODALITA, workshopTimes } from "../data";
import { SettingsPage } from "./Settings";
import { OrdersPage } from "./Orders";
import { EventsAdmin } from "./Events";
import { translateFromItalian } from "./translate";
import { RichEditor } from "./RichEditor";

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
/** Nell'elenco lo stato è mostrato come icona (il nome completo resta nel tooltip). */
const STATO_ICON: Record<number, [LucideIcon, string]> = {
  0: [CalendarClock, "text-sky-600"],
  1: [CircleCheck, "text-mint"],
  2: [EyeOff, "text-steel"],
  3: [CircleHelp, "text-amber-600"],
  4: [Play, "text-flame"],
  5: [CheckCheck, "text-ink/60"],
};
const LEVELS = ["Foundation", "Advanced", "Workshop"];
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
const BOOLS = ["in_evidenza", "iscrizioni_aperte", "sconto_privati"];
// testo NOT NULL nel DB: vuoto = stringa vuota (gli altri testi vuoti diventano NULL)
const TEXT_REQUIRED = ["titolo", "livello", ...LANGS.flatMap(([l]) => [`link_readmore_${l}`, `link_booking_${l}`, `home_subtitle_${l}`])];
const URLS = [...LANGS.flatMap(([l]) => [`link_readmore_${l}`, `link_booking_${l}`]), "link_evento", "link_zoom", "immagine_url"];
const LIMITS: Record<string, number> = { livello: 10, titolo: 255 };

const SCOPES: [string, string][] = [["privato", "Privati"], ["pro", "Liberi professionisti"], ["azienda", "Aziende italiane"], ["estera", "Aziende estere"]];
const round2 = (n: number) => Math.round(n * 100) / 100;

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
  if (!data.modalita) data.modalita = "intensivo";
  if (!String(data.titolo ?? "").trim()) errors.titolo = "il titolo è obbligatorio";
  return { data, errors };
}

const go = (hash: string) => {
  window.location.hash = hash;
};

/* ------------------------------- UI helpers ------------------------------ */

export const inputCls =
  "w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-flame focus:ring-2 focus:ring-flame/20";
export const btnCls = "inline-flex items-center rounded-full px-4 py-2 text-[13px] font-semibold transition-colors";
export const btnPrimary = `${btnCls} bg-ink text-white hover:bg-flame disabled:opacity-50`;

function Shell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#/admin" className="flex items-center gap-3" aria-label="Cube Academy — Gestione corsi">
            <img src="/img/logo-cube-academy.png" alt="Cube Academy" width={1000} height={173} className="h-7 w-auto" />
            <span className="border-l border-white/20 pl-3 font-display text-[15px] font-semibold tracking-tight text-ember">Gestione</span>
          </a>
          <nav className="flex items-center gap-5 text-[13px] font-medium" aria-label="Sezioni del pannello">
            {[["#/admin", "Corsi"], ["#/admin/eventi", "Eventi"], ["#/admin/iscrizioni", "Iscrizioni"], ["#/admin/impostazioni", "Impostazioni"]].map(([h, l]) => (
              <a key={h} href={h} className="text-white/75 hover:text-white">{l}</a>
            ))}
          </nav>
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

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
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
      .select("id_corso, titolo, livello, stato, in_evidenza, iscrizioni_aperte, data_it, data_inizio")
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
        <div className="flex flex-wrap gap-2">
          <button className={btnPrimary} onClick={() => go("#/admin/corso/new")}>+ Nuovo corso</button>
          <button className={`${btnCls} border border-ink/20 text-ink hover:bg-sand`} onClick={() => go("#/admin/corso/new-workshop")}>+ Nuovo workshop</button>
        </div>
      </div>
      {msg && (
        <p role="status" className={`mt-4 rounded-lg px-4 py-2 text-[13px] ${isErr ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>{msg}</p>
      )}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[820px] text-left text-[13.5px]">
          <thead className="border-b border-ink/10 bg-sand/40 text-[11.5px] uppercase tracking-wider text-steel">
            <tr>
              {["ID", "Titolo", "Tipo", "Stato", "Iscrizioni", "Date", "Evid.", "Azioni"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={String(r.id_corso)} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-mono text-[12px] text-steel">{r.id_corso}</td>
                <td className="px-4 py-3">{strip(r.titolo)}</td>
                <td className="px-4 py-3 text-ink/70">{r.livello}</td>
                <td className="px-4 py-3">
                  {(() => {
                    const [Icon, cls] = STATO_ICON[Number(r.stato)] ?? [CircleHelp, "text-steel"];
                    const label = STATI[Number(r.stato)] ?? "?";
                    return <span title={label} aria-label={label} role="img" className="inline-flex"><Icon className={`size-5 ${cls}`} aria-hidden="true" /></span>;
                  })()}
                </td>
                <td className="px-4 py-3">
                  {r.livello === "Workshop" ? <span className="text-steel" title="Gratuito: si prenota su LinkedIn">—</span> : <button
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${r.iscrizioni_aperte ? "bg-mint/15 text-mint" : "bg-err/10 text-err"}`}
                    onClick={() =>
                      act(() => supabase.from("corsi").update({ iscrizioni_aperte: !r.iscrizioni_aperte }).eq("id_corso", r.id_corso as number), "Stato iscrizioni aggiornato.")
                    }
                  >
                    {r.iscrizioni_aperte ? "Aperte" : "Chiuse"}
                  </button>}
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
                <td colSpan={8} className="px-4 py-8 text-center text-steel">
                  Nessun corso visibile. Se sai che ce ne sono, l'email con cui hai fatto l'accesso potrebbe non essere abilitata (tabella admin_emails).
                </td>
              </tr>
            )}
            {!rows && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-steel">Caricamento…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --------------------------------- modifica ------------------------------- */

const EMPTY: Row = { titolo: "", livello: "Foundation", modalita: "intensivo", sconto_privati: true, stato: 0, in_evidenza: false, iscrizioni_aperte: false };

/** Il workshop è una presentazione gratuita di circa un'ora: la prenotazione avviene sull'evento LinkedIn. */
const EMPTY_WS: Row = { titolo: "", livello: "Workshop", ora_inizio: "", ora_fine: "", link_zoom: "", stato: 0, in_evidenza: true, iscrizioni_aperte: false, luogo_it: "Online", lingua_it: "Italiano" };
const WS_STATI = [0, 5, 2];

function Edit({ id }: { id: string }) {
  const isNew = id === "new" || id === "new-workshop";
  const [f, setF] = useState<Row | null>(id === "new-workshop" ? EMPTY_WS : isNew ? EMPTY : null);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
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
      .then(({ data, error }) => {
        if (error) return setMsg(error.message);
        const r = data as Row;
        // workshop salvati prima degli orari strutturati: ricava inizio e fine dal testo (es. "18:00–19:00")
        if (r.livello === "Workshop" && !r.ora_inizio && r.orario_it) {
          const tm = workshopTimes({ orario_it: String(r.orario_it) });
          r.ora_inizio = tm.from || null;
          r.ora_fine = tm.to || null;
        }
        setF(r);
      });
  }, [id, isNew]);

  if (!f) return <p className="text-steel">{msg || "Caricamento…"}</p>;

  const set = (k: string, v: string | number | boolean | null) => setF((p) => ({ ...(p as Row), [k]: v }));
  const setMany = (patch: Row) => setF((p) => ({ ...(p as Row), ...patch }));
  const text = (k: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <input className={inputCls} value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value)} {...extra} />
  );
  const F = (k: string, label: string, node: ReactNode, hint?: string) => (
    <Field label={label} error={errors[k]} hint={hint}>{node}</Field>
  );

  const isWs = String(f.livello) === "Workshop";

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return setMsg("Scegli un file immagine (JPG, PNG o WebP).");
    if (file.size > 5 * 1024 * 1024) return setMsg("L'immagine supera i 5 MB: riducila prima di caricarla.");
    setUploading(true);
    setMsg("");
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const up = await supabase.storage.from("workshop").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (up.error) setMsg(`Caricamento non riuscito: ${up.error.message} (hai eseguito supabase/migrazione-4.sql?)`);
    else set("immagine_url", supabase.storage.from("workshop").getPublicUrl(path).data.publicUrl);
    setUploading(false);
  };

  /** Workshop: genera titolo, luogo e descrizione in en/fr/de partendo dall'italiano. */
  const translateWs = async () => {
    const OTHERS = ["en", "fr", "de"] as const;
    const src = { titolo: String(f.titolo ?? ""), luogo: String(f.luogo_it ?? ""), descrizione: String(f.home_subtitle_it ?? "") };
    const present = OTHERS.some((l) => f[`titolo_${l}`] || f[`luogo_${l}`] || f[`home_subtitle_${l}`]);
    if (present && !confirm("Alcune traduzioni sono già presenti: vuoi sostituirle con quelle generate?")) return;
    setTranslating(true);
    setMsg("");
    try {
      const tr = await translateFromItalian(src);
      const patch: Row = {};
      for (const l of OTHERS) {
        if (tr[l].titolo) patch[`titolo_${l}`] = tr[l].titolo;
        if (tr[l].luogo) patch[`luogo_${l}`] = tr[l].luogo;
        if (tr[l].descrizione) patch[`home_subtitle_${l}`] = tr[l].descrizione;
      }
      setMany(patch);
      setMsg("Traduzioni generate: controllale nelle schede English, Français e Deutsch, poi premi “Salva workshop”.");
    } catch (e) {
      setMsg(`Traduzione non riuscita: ${(e as Error).message}`);
    }
    setTranslating(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg("");
    const { data, errors: errs } = toPayload(f);
    if (isWs) {
      if (!data.data_inizio) errs.data_inizio = "indica la data del workshop";
      if (!data.link_evento) errs.link_evento = "inserisci il link all'evento LinkedIn";
      const from = String(data.ora_inizio ?? "");
      const to = String(data.ora_fine ?? "");
      if (data.link_zoom && !from) errs.ora_inizio = "per il link Zoom serve l'ora di inizio";
      if (from && to && to <= from) errs.ora_fine = "l'ora di fine deve essere successiva all'inizio";
      if (from) data.orario_it = to ? `${from}–${to}` : from; // testo mostrato sul sito
      data.data_fine = data.data_inizio; // evento di un'ora: un solo giorno
      data.iscrizioni_aperte = false;
    }
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
  const failed = Object.keys(errors).length > 0 || /permess|error|violat|denied|non riuscit/i.test(msg);

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="#/admin" className="text-[13px] text-flame hover:underline">← Torna all'elenco</a>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{isNew ? (isWs ? "Nuovo workshop" : "Nuovo corso") : `${isWs ? "Modifica workshop" : "Modifica corso"} #${id}`}</h1>
        </div>
        <button className={btnPrimary} disabled={busy}>{busy ? "Salvataggio…" : "Salva corso"}</button>
      </div>
      {msg && (
        <p role="status" className={`rounded-lg px-4 py-2 text-[13px] ${failed ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>{msg}</p>
      )}

      {isWs ? (
        <>
          <section className={card}>
            <h2 className={h2}>Dati del workshop</h2>
            <p className="mb-4 text-[13px] text-steel">
              Presentazione gratuita di circa un'ora, pensata per far conoscere iSAQB®: non ha prezzi, iscrizioni o codici sconto.
              Chi vuole partecipare si registra sull'evento LinkedIn.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">{F("titolo", "Titolo (accetta HTML, es. <br>)", text("titolo", { maxLength: 255, required: true }))}</div>
              {F("livello", "Tipo", (
                <select className={inputCls} value="Workshop" onChange={(e) => set("livello", e.target.value)}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              ), "Cambiandolo in Foundation o Advanced il record torna a essere un corso a pagamento.")}
              {F("stato", "Stato", (
                <select className={inputCls} value={Number(f.stato)} onChange={(e) => set("stato", Number(e.target.value))}>
                  {WS_STATI.map((v) => <option key={v} value={v}>{STATI[v]}</option>)}
                </select>
              ), "“In Programma” lo mostra come prossimo workshop (anche in home); dopo la data passa da solo tra i workshop svolti.")}
              {F("data_inizio", "Data", <input type="date" className={inputCls} value={toDate(f.data_inizio)} onChange={(e) => set("data_inizio", e.target.value)} />)}
              {F("ora_inizio", "Ora di inizio (ora italiana)", <input type="time" className={inputCls} value={String(f.ora_inizio ?? "")} onChange={(e) => set("ora_inizio", e.target.value)} />)}
              {F("ora_fine", "Ora di fine", <input type="time" className={inputCls} value={String(f.ora_fine ?? "")} onChange={(e) => set("ora_fine", e.target.value)} />, "Se vuota, il workshop dura 1 ora dall'inizio.")}
              {F("lingua_it", "Lingua", text("lingua_it", { maxLength: 11, placeholder: "Italiano" }))}
              <div className="md:col-span-2">
                {F("link_evento", "Link all'evento LinkedIn", text("link_evento", { type: "url", maxLength: 300, placeholder: "https://www.linkedin.com/events/…" }), "Il sito non gestisce iscrizioni: il pulsante “Iscriviti su LinkedIn” porta a questo indirizzo.")}
              </div>
              <div className="md:col-span-2">
                {F("link_zoom", "Link alla sessione Zoom", text("link_zoom", { type: "url", maxLength: 400, placeholder: "https://…zoom.us/j/…" }), "Il pulsante “Partecipa su Zoom” compare disattivato e si attiva da 1 ora prima dell'ora di inizio (nel giorno del workshop) fino alla fine; durante il workshop la card mostra “In corso”. Richiede l'ora di inizio.")}
              </div>
              <div className="md:col-span-2">
                {check("in_evidenza", "Attiva nastro: mostra il nastro scorrevole sotto il menu, in tutte le pagine, finché il workshop non è concluso")}
                <p className="mt-1 text-[11.5px] text-steel">Se è spuntato su più workshop in programma, il nastro annuncia il più vicino. Senza spunta il nastro non compare (la sezione in home e la card restano).</p>
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className={h2}>Immagine di presentazione</h2>
            <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_1fr]">
              <div className="grid aspect-[16/9] place-items-center overflow-hidden rounded-xl border border-ink/10 bg-sand/40 text-[12px] text-steel">
                {f.immagine_url ? <img src={String(f.immagine_url)} alt="Anteprima" className="size-full object-cover" /> : "Nessuna immagine"}
              </div>
              <div className="space-y-4">
                <Field label="Carica un file (JPG, PNG, WebP · max 5 MB)" hint="Formato consigliato 16:9, ad esempio 1200 × 675 px.">
                  <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file); e.target.value = ""; }} className="block w-full text-[13px] file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-white" />
                </Field>
                {uploading && <p className="text-[12.5px] text-steel">Caricamento…</p>}
                {F("immagine_url", "…oppure indirizzo dell'immagine", text("immagine_url", { type: "url", maxLength: 500, placeholder: "https://…" }))}
                {!!f.immagine_url && <button type="button" className="text-[12.5px] font-semibold text-err hover:underline" onClick={() => set("immagine_url", "")}>Rimuovi immagine</button>}
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className={h2}>Contenuti per lingua</h2>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <button type="button" disabled={translating} onClick={translateWs} className={`${btnCls} bg-flame text-white hover:bg-ink disabled:opacity-50`}>
                {translating ? "Traduzione in corso…" : "Traduci per le altre lingue"}
              </button>
              <span className="text-[12.5px] text-steel">Genera titolo, luogo e descrizione in inglese, francese e tedesco partendo dall'italiano. Controlla il risultato prima di salvare.</span>
            </div>
            <div role="tablist" className="mb-5 flex flex-wrap gap-2">
              {LANGS.map(([code, label]) => (
                <button type="button" role="tab" aria-selected={lang === code} key={code} onClick={() => setLang(code)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${lang === code ? "bg-ink text-white" : "border border-ink/20 text-ink/70 hover:bg-sand"}`}>
                  {label}
                </button>
              ))}
            </div>
            {LANGS.map(([code]) => (
              <div key={code} hidden={lang !== code} className="grid gap-4">
                {code !== "it" && F(`titolo_${code}`, `Titolo (${code.toUpperCase()})`, text(`titolo_${code}`, { maxLength: 255 }), "Se vuoto, il sito usa il titolo italiano.")}
                {F(`luogo_${code}`, "Dove / modalità", text(`luogo_${code}`, { maxLength: 40, placeholder: "Es. Online (LinkedIn Live)" }))}
                {F(`home_subtitle_${code}`, "Descrizione breve (testo semplice)", (
                  <textarea className={inputCls} rows={4} value={String(f[`home_subtitle_${code}`] ?? "")} onChange={(e) => set(`home_subtitle_${code}`, e.target.value)} />
                ), "Compare nella scheda del workshop e nel richiamo in home. Se vuota in una lingua, si usa quella italiana.")}
              </div>
            ))}
          </section>
        </>
      ) : (
      <>
      <section className={card}>
        <h2 className={h2}>Dati generali</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">{F("titolo", "Titolo (accetta HTML, es. <br>)", text("titolo", { maxLength: 255, required: true }))}</div>
          {F("livello", "Tipo di corso", (
            <select className={inputCls} value={LEVELS.includes(String(f.livello)) ? String(f.livello) : "Foundation"} onChange={(e) => set("livello", e.target.value)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          ), "Foundation (CPSA-F), Advanced (CPSA-A) o Workshop: determina filtro del catalogo, causale di pagamento ed email.")}
          {F("stato", "Stato", (
            <select className={inputCls} value={Number(f.stato)} onChange={(e) => set("stato", Number(e.target.value))}>
              {Object.entries(STATI).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ), "“Completato” mostra la card tra le edizioni concluse; “Non visualizzato” la nasconde dal sito.")}
          {F("data_inizio", "Data inizio", <input type="date" className={inputCls} value={toDate(f.data_inizio)} onChange={(e) => set("data_inizio", e.target.value)} />, "Usata per ordinamento e calendario sul sito.")}
          {F("data_fine", "Data fine", <input type="date" className={inputCls} value={toDate(f.data_fine)} onChange={(e) => set("data_fine", e.target.value)} />)}
          {F("modalita", "Modalità di fruizione", (
            <select className={inputCls} value={String(f.modalita ?? "intensivo")} onChange={(e) => set("modalita", e.target.value)}>
              {Object.entries(MODALITA).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
            </select>
          ), "Come sono distribuite le 24 ore del corso.")}
          {F("orario_it", "Calendario sessioni (testo mostrato)", text("orario_it", { maxLength: 160, placeholder: "Es. Martedì e giovedì, 18:00–21:00" }), "Opzionale: se vuoto si usa il testo standard della modalità.")}
          {F("posti_totali", "Posti totali", text("posti_totali", { type: "number", min: 0 }), "Opzionale: se vuoto, il sito non mostra la barra dei posti.")}
          {F("posti_disponibili", "Posti disponibili", text("posti_disponibili", { type: "number", min: 0 }))}
          <div className="flex flex-wrap items-center gap-6 md:col-span-2">
            {check("in_evidenza", "In evidenza")}
            {check("iscrizioni_aperte", "Iscrizioni aperte")}
            {check("sconto_privati", "Sconto privati attivo per questa edizione")}
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Prezzi ed early bird</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {F("standard_price", "Prezzo standard (€)", (
            <input type="number" min={0} className={inputCls} value={String(f.standard_price ?? "")} onChange={(e) => {
              const std = Number(e.target.value);
              const pct = Number(f.early_bird_percentuale);
              setMany({ standard_price: e.target.value, ...(std > 0 && pct > 0 ? { early_bird_price: Math.round(std * (1 - pct / 100)) } : {}) });
            }} />
          ), "Cambiandolo, il prezzo early bird si ricalcola dalla percentuale.")}
          {F("early_bird_price", "Prezzo early bird (€)", (
            <input type="number" min={0} className={inputCls} value={String(f.early_bird_price ?? "")} onChange={(e) => {
              const std = Number(f.standard_price);
              const price = Number(e.target.value);
              setMany({ early_bird_price: e.target.value, ...(std > 0 && price > 0 && price <= std ? { early_bird_percentuale: round2((1 - price / std) * 100) } : {}) });
            }} />
          ), "È il prezzo realmente applicato: cambiandolo, la percentuale si aggiorna.")}
          {F("early_bird_percentuale", "Sconto early bird (%)", (
            <input type="number" step="0.01" min={0} max={100} className={inputCls} value={String(f.early_bird_percentuale ?? "")} onChange={(e) => {
              const std = Number(f.standard_price);
              const pct = Number(e.target.value);
              setMany({ early_bird_percentuale: e.target.value, ...(std > 0 && pct >= 0 && pct <= 100 ? { early_bird_price: Math.round(std * (1 - pct / 100)) } : {}) });
            }} />
          ), "Cambiandola, il prezzo early bird si ricalcola.")}
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
              <div className="md:col-span-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
                <span className="font-semibold text-ink/70">Valido per:</span>
                {SCOPES.map(([sc, label]) => {
                  const cur = String(f[`codice_sconto_${i}_ambiti`] ?? "").split(",").map((x) => x.trim()).filter(Boolean);
                  const effective = cur.length ? cur : SCOPES.map(([x]) => x);
                  return (
                    <label key={sc} className="flex items-center gap-1.5">
                      <input type="checkbox" className="size-4 accent-flame" checked={effective.includes(sc)} onChange={() => {
                        const next = effective.includes(sc) ? effective.filter((x) => x !== sc) : [...effective, sc];
                        if (next.length === 0) return; // almeno una tipologia
                        set(`codice_sconto_${i}_ambiti`, next.length === SCOPES.length ? "" : next.join(","));
                      }} />
                      {label}
                    </label>
                  );
                })}
              </div>
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
              {/* fuori da <label>: i pulsanti della barra non devono attivare il primo controllo */}
              <span className="mb-1 block text-[12px] font-semibold text-ink/70">Descrizione corso (read more)</span>
              <RichEditor value={String(f[`read_more_${code}`] ?? "")} onChange={(v) => set(`read_more_${code}`, v)} />
              <span className="mt-1 block text-[11.5px] text-steel">Scheda “Visuale” per scrivere con la barra degli strumenti, “Codice” per modificare l'HTML.</span>
            </div>
          </div>
        ))}
      </section>

      </>
      )}

      <div className="flex justify-end">
        <button className={btnPrimary} disabled={busy}>{busy ? "Salvataggio…" : isWs ? "Salva workshop" : "Salva corso"}</button>
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
      ) : /^#\/admin\/(eventi|evento\/)/.test(hash) ? (
        <EventsAdmin hash={hash} />
      ) : /^#\/admin\/impostazioni/.test(hash) ? (
        <SettingsPage session={session} />
      ) : /^#\/admin\/iscrizioni/.test(hash) ? (
        <OrdersPage session={session} />
      ) : (
        <List />
      )}
    </Shell>
  );
}
