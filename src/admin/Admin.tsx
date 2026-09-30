import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";

/* Pannello di gestione corsi (sostituisce il plugin WordPress "Cube Academy - Gestione Corsi").
   Rotte: #/admin (elenco) · #/admin/corso/new · #/admin/corso/<id> */

type Row = Record<string, string | number | null>;
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
  ["IT", "Italiano"],
  ["EN", "English"],
  ["FR", "Français"],
  ["DE", "Deutsch"],
];
// colonne per-lingua: alcune nel DB usano il trattino ("Data-IT"), altre l'underscore
const DASH = ["Data", "Luogo", "Lingua", "Note"];
const lc = (base: string, l: string) => `${base}${DASH.includes(base) ? "-" : "_"}${l}`;

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Requested-With": "cube" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Errore ${res.status}`), { status: res.status, errors: data.errors });
  return data as T;
}

const toLocalDT = (v: unknown) => {
  const s = String(v ?? "");
  return !s || s.startsWith("0000") ? "" : s.replace(" ", "T").slice(0, 16);
};
const toDate = (v: unknown) => String(v ?? "").slice(0, 10);
const strip = (h: unknown) => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/&reg;/g, "®").replace(/\s+/g, " ").trim();

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

function Login({ onDone }: { onDone: () => void }) {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("POST", "/api/admin/login", { username, password });
      onDone();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-7 shadow-card">
        <h1 className="font-display text-2xl font-bold tracking-tight">Accesso amministratori</h1>
        <p className="mt-1 text-[13px] text-steel">Gestione corsi Cube Academy</p>
        <div className="mt-6 space-y-4">
          <Field label="Utente">
            <input className={inputCls} value={username} onChange={(e) => setU(e.target.value)} autoComplete="username" autoFocus required />
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
  const load = useCallback(() => api<Row[]>("GET", "/api/admin/corsi").then(setRows).catch((e) => setMsg(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      setMsg(ok);
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">Corsi</h1>
        <button className={btnPrimary} onClick={() => go("#/admin/corso/new")}>+ Nuovo corso</button>
      </div>
      {msg && <p role="status" className="mt-4 rounded-lg bg-mint/10 px-4 py-2 text-[13px] text-mint">{msg}</p>}
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
              <tr key={r.id_corso} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-mono text-[12px] text-steel">{r.id_corso}</td>
                <td className="px-4 py-3">{strip(r.Titolo)}</td>
                <td className="px-4 py-3">{STATI[Number(r.stato)] ?? "?"}</td>
                <td className="px-4 py-3">
                  <button
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${r.iscrizioni_aperte ? "bg-mint/15 text-mint" : "bg-err/10 text-err"}`}
                    onClick={() => act(() => api("POST", `/api/admin/corsi/${r.id_corso}/toggle`), "Stato iscrizioni aggiornato.")}
                  >
                    {r.iscrizioni_aperte ? "Aperte" : "Chiuse"}
                  </button>
                </td>
                <td className="px-4 py-3 text-ink/70">{r["Data-IT"]}</td>
                <td className="px-4 py-3">{r.in_evidenza ? "✓" : ""}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button className="mr-3 font-semibold text-flame hover:underline" onClick={() => go(`#/admin/corso/${r.id_corso}`)}>Modifica</button>
                  <button
                    className="mr-3 font-semibold text-ink/70 hover:underline"
                    onClick={() =>
                      act(async () => {
                        const n = await api<{ id_corso: number }>("POST", `/api/admin/corsi/${r.id_corso}/duplicate`);
                        go(`#/admin/corso/${n.id_corso}`);
                      }, "Corso duplicato. Modifica i dettagli e salva.")
                    }
                  >
                    Duplica
                  </button>
                  <button
                    className="font-semibold text-err hover:underline"
                    onClick={() => {
                      if (confirm("Eliminare definitivamente questo corso? L'operazione non è reversibile."))
                        act(() => api("DELETE", `/api/admin/corsi/${r.id_corso}`), "Corso eliminato.");
                    }}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {rows && !rows.length && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-steel">Nessun corso presente.</td></tr>
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

const EMPTY: Row = { Titolo: "", Livello: "Foundation", stato: 0, in_evidenza: 0, iscrizioni_aperte: 0 };

function Edit({ id }: { id: string }) {
  const isNew = id === "new";
  const [f, setF] = useState<Row | null>(isNew ? EMPTY : null);
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState("IT");

  useEffect(() => {
    if (!isNew) api<Row>("GET", `/api/admin/corsi/${id}`).then(setF).catch((e) => setMsg(e.message));
  }, [id, isNew]);

  if (!f) return <p className="text-steel">{msg || "Caricamento…"}</p>;

  const set = (k: string, v: string | number | null) => setF((p) => ({ ...(p as Row), [k]: v }));
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
    try {
      if (isNew) {
        const r = await api<{ id_corso: number }>("POST", "/api/admin/corsi", f);
        go(`#/admin/corso/${r.id_corso}`);
      } else {
        await api("PUT", `/api/admin/corsi/${id}`, f);
        setMsg("Corso salvato.");
      }
    } catch (x) {
      const err = x as Error & { errors?: Errors };
      setErrors(err.errors ?? {});
      setMsg(err.errors ? "Controlla i campi evidenziati." : err.message);
    } finally {
      setBusy(false);
    }
  };

  const check = (k: string, label: string) => (
    <label className="flex items-center gap-2 text-[14px]">
      <input type="checkbox" checked={!!Number(f[k])} onChange={(e) => set(k, e.target.checked ? 1 : 0)} className="size-4 accent-flame" />
      {label}
    </label>
  );
  const dt = (k: string) => (
    <input type="datetime-local" className={inputCls} value={toLocalDT(f[k])} onChange={(e) => set(k, e.target.value)} />
  );

  const card = "rounded-2xl border border-ink/10 bg-white p-6";
  const h2 = "mb-4 font-display text-lg font-bold tracking-tight";

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
        <p role="status" className={`rounded-lg px-4 py-2 text-[13px] ${Object.keys(errors).length ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>{msg}</p>
      )}

      <section className={card}>
        <h2 className={h2}>Dati generali</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">{F("Titolo", "Titolo (accetta HTML, es. <br>)", text("Titolo", { maxLength: 255, required: true }))}</div>
          {F("Livello", "Livello", text("Livello", { maxLength: 10 }))}
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
            {F(lc("Data", code), "Data (testo mostrato)", text(lc("Data", code), { maxLength: 60 }), "Es. “25 - 27 Marzo 2026”")}
            {F(lc("Luogo", code), "Luogo", text(lc("Luogo", code), { maxLength: 15 }))}
            {F(lc("Lingua", code), "Lingua del corso", text(lc("Lingua", code), { maxLength: 11 }))}
            {F(lc("Note", code), "Note", text(lc("Note", code), { maxLength: 10 }))}
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
  const [user, setUser] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    api<{ username: string }>("GET", "/api/admin/me")
      .then((r) => setUser(r.username))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="grid min-h-screen place-items-center text-steel">Caricamento…</div>;
  if (user === null) return <Login onDone={() => api<{ username: string }>("GET", "/api/admin/me").then((r) => setUser(r.username))} />;

  const m = hash.match(/^#\/admin\/corso\/([^/]+)/);
  return (
    <Shell
      right={
        <button
          className="text-white/70 hover:text-white"
          onClick={() => api("POST", "/api/admin/logout").finally(() => setUser(null))}
        >
          Esci ({user})
        </button>
      }
    >
      {m ? <Edit key={m[1]} id={m[1]} /> : <List />}
    </Shell>
  );
}
