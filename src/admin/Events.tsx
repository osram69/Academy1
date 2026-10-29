import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { Field, btnCls, btnPrimary, inputCls } from "./Admin";

/* Gestione eventi (pagina #/eventi del sito). Rotte: #/admin/eventi (elenco) · #/admin/evento/new · #/admin/evento/<id>
   Ogni evento è un articolo: titolo, immagine, descrizione nelle 4 lingue, link all'evento, date di inizio e fine. */

type Row = Record<string, string | number | boolean | null>;

const LANGS: [string, string][] = [["it", "Italiano"], ["en", "English"], ["fr", "Français"], ["de", "Deutsch"]];
const go = (hash: string) => { window.location.hash = hash; };
const toDate = (v: unknown) => String(v ?? "").slice(0, 10);
const fmt = (v: unknown) => (v ? new Date(`${toDate(v)}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "da definire");

const EMPTY: Row = { titolo: "", pubblicato: true, data_inizio: null, data_fine: null, luogo: "", link_evento: "", immagine_url: "" };

/* --------------------------------- elenco -------------------------------- */

function List() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState("");
  const [isErr, setIsErr] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("eventi").select("id, titolo, pubblicato, data_inizio, data_fine, luogo, immagine_url").order("data_inizio", { ascending: false, nullsFirst: true });
    if (error) {
      setIsErr(true);
      setMsg(`${error.message} — hai eseguito supabase/migrazione-5.sql?`);
    }
    setRows((data as Row[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await fn();
    setIsErr(!!error);
    setMsg(error ? error.message : ok);
    if (!error) await load();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">Eventi</h1>
        <button className={btnPrimary} onClick={() => go("#/admin/evento/new")}>+ Nuovo evento</button>
      </div>
      {msg && <p role="status" className={`mt-4 rounded-lg px-4 py-2 text-[13px] ${isErr ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>{msg}</p>}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[760px] text-left text-[13.5px]">
          <thead className="border-b border-ink/10 bg-sand/40 text-[11.5px] uppercase tracking-wider text-steel">
            <tr>{["Immagine", "Titolo", "Date", "Luogo", "Stato", "Azioni"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={String(r.id)} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">
                  {r.immagine_url ? <img src={String(r.immagine_url)} alt="" className="h-10 w-16 rounded-md object-cover" /> : <span className="text-steel">—</span>}
                </td>
                <td className="px-4 py-3 font-medium">{r.titolo}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                  {fmt(r.data_inizio)}{r.data_fine && r.data_fine !== r.data_inizio ? ` – ${fmt(r.data_fine)}` : ""}
                </td>
                <td className="px-4 py-3 text-ink/70">{r.luogo}</td>
                <td className="px-4 py-3">
                  <button
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${r.pubblicato ? "bg-mint/15 text-mint" : "bg-ink/10 text-ink/60"}`}
                    onClick={() => act(() => supabase.from("eventi").update({ pubblicato: !r.pubblicato }).eq("id", r.id as number), "Stato aggiornato.")}
                  >
                    {r.pubblicato ? "Pubblicato" : "Bozza"}
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button className="mr-3 font-semibold text-flame hover:underline" onClick={() => go(`#/admin/evento/${r.id}`)}>Modifica</button>
                  <button
                    className="font-semibold text-err hover:underline"
                    onClick={() => { if (confirm("Eliminare definitivamente questo evento?")) act(() => supabase.from("eventi").delete().eq("id", r.id as number), "Evento eliminato."); }}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-steel">Nessun evento.</td></tr>}
            {!rows && <tr><td colSpan={6} className="px-4 py-8 text-center text-steel">Caricamento…</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --------------------------------- scheda -------------------------------- */

function Edit({ id }: { id: string }) {
  const isNew = id === "new";
  const [f, setF] = useState<Row | null>(isNew ? EMPTY : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lang, setLang] = useState("it");
  const [multi, setMulti] = useState(false); // evento su più giorni

  useEffect(() => {
    if (isNew) return;
    supabase.from("eventi").select("*").eq("id", Number(id)).single()
      .then(({ data, error }) => {
        if (error) return setMsg(error.message);
        const r = data as Row;
        setMulti(!!r.data_fine && toDate(r.data_fine) !== toDate(r.data_inizio));
        setF(r);
      });
  }, [id, isNew]);

  if (!f) return <p className="text-steel">{msg || "Caricamento…"}</p>;

  const set = (k: string, v: string | boolean | null) => setF((p) => ({ ...(p as Row), [k]: v }));
  const oneDay = !multi;
  const text = (k: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <input className={inputCls} value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value)} {...extra} />
  );
  const F = (k: string, label: string, node: React.ReactNode, hint?: string) => <Field label={label} error={errors[k]} hint={hint}>{node}</Field>;

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return setMsg("Scegli un file immagine (JPG, PNG o WebP).");
    if (file.size > 5 * 1024 * 1024) return setMsg("L'immagine supera i 5 MB: riducila prima di caricarla.");
    setUploading(true);
    setMsg("");
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const up = await supabase.storage.from("eventi").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (up.error) setMsg(`Caricamento non riuscito: ${up.error.message} (hai eseguito supabase/migrazione-5.sql?)`);
    else set("immagine_url", supabase.storage.from("eventi").getPublicUrl(path).data.publicUrl);
    setUploading(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const errs: Record<string, string> = {};
    const s = (k: string) => String(f[k] ?? "").trim();
    if (!s("titolo")) errs.titolo = "il titolo è obbligatorio";
    for (const k of ["link_evento", "immagine_url"]) if (s(k) && !/^https?:\/\//i.test(s(k))) errs[k] = "URL non valido (deve iniziare con http:// o https://)";
    const start = s("data_inizio") ? toDate(f.data_inizio) : null;
    const end = start ? (!multi ? start : s("data_fine") ? toDate(f.data_fine) : start) : null;
    if (start && end && end < start) errs.data_fine = "la data di fine è precedente a quella di inizio";
    setErrors(errs);
    if (Object.keys(errs).length) {
      setMsg("Controlla i campi evidenziati.");
      setBusy(false);
      return;
    }
    const data: Row = {
      titolo: s("titolo"), pubblicato: !!f.pubblicato, data_inizio: start, data_fine: end,
      luogo: s("luogo") || null, link_evento: s("link_evento") || null, immagine_url: s("immagine_url") || null,
      ...Object.fromEntries(LANGS.map(([l]) => [`descrizione_${l}`, s(`descrizione_${l}`) || null])),
    };
    if (isNew) {
      const r = await supabase.from("eventi").insert(data).select("id").single();
      if (r.error) setMsg(r.error.message);
      else go(`#/admin/evento/${(r.data as Row).id}`);
    } else {
      const r = await supabase.from("eventi").update(data).eq("id", Number(id)).select("id");
      setMsg(r.error ? r.error.message : r.data?.length ? "Evento salvato." : "Nessuna modifica salvata: permessi insufficienti?");
    }
    setBusy(false);
  };

  const card = "rounded-2xl border border-ink/10 bg-white p-6";
  const h2 = "mb-4 font-display text-lg font-bold tracking-tight";
  const failed = Object.keys(errors).length > 0 || /permess|error|violat|denied|non riuscito/i.test(msg);

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="#/admin/eventi" className="text-[13px] text-flame hover:underline">← Torna agli eventi</a>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{isNew ? "Nuovo evento" : `Modifica evento #${id}`}</h1>
        </div>
        <div className="flex gap-2">
          {!isNew && <a href={`#/eventi/${id}`} target="_blank" rel="noopener noreferrer" className={`${btnCls} border border-ink/20 text-ink hover:bg-sand`}>Anteprima sul sito</a>}
          <button className={btnPrimary} disabled={busy}>{busy ? "Salvataggio…" : "Salva evento"}</button>
        </div>
      </div>
      {msg && <p role="status" className={`rounded-lg px-4 py-2 text-[13px] ${failed ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>{msg}</p>}

      <section className={card}>
        <h2 className={h2}>Articolo</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">{F("titolo", "Titolo", text("titolo", { maxLength: 200, required: true }))}</div>
          {F("data_inizio", "Data di inizio", <input type="date" className={inputCls} value={toDate(f.data_inizio)} onChange={(e) => set("data_inizio", e.target.value)} />, "Lasciala vuota se la data non è ancora definita.")}
          {F("data_fine", "Data di fine", <input type="date" className={inputCls} disabled={oneDay} value={oneDay ? toDate(f.data_inizio) : toDate(f.data_fine)} min={toDate(f.data_inizio)} onChange={(e) => set("data_fine", e.target.value)} />)}
          <label className="flex items-center gap-2 text-[14px] md:col-span-2">
            <input type="checkbox" className="size-4 accent-flame" checked={oneDay} onChange={(e) => { setMulti(!e.target.checked); if (!e.target.checked && !f.data_fine) set("data_fine", toDate(f.data_inizio)); }} />
            Evento di una sola giornata (fine = inizio)
          </label>
          {F("luogo", "Luogo", text("luogo", { maxLength: 80, placeholder: "Es. Berlino" }))}
          {F("link_evento", "Link all'evento", text("link_evento", { type: "url", maxLength: 300, placeholder: "https://…" }), "Sito ufficiale o pagina dell'evento: compare come “Vai al sito dell'evento”. Facoltativo.")}
          <label className="flex items-center gap-2 text-[14px] md:col-span-2">
            <input type="checkbox" className="size-4 accent-flame" checked={!!f.pubblicato} onChange={(e) => set("pubblicato", e.target.checked)} />
            Pubblicato (se disattivato resta una bozza, non visibile sul sito)
          </label>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Immagine</h2>
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
        <h2 className={h2}>Descrizione</h2>
        <div role="tablist" className="mb-5 flex flex-wrap gap-2">
          {LANGS.map(([code, label]) => (
            <button type="button" role="tab" aria-selected={lang === code} key={code} onClick={() => setLang(code)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${lang === code ? "bg-ink text-white" : "border border-ink/20 text-ink/70 hover:bg-sand"}`}>
              {label}
            </button>
          ))}
        </div>
        {LANGS.map(([code]) => (
          <div key={code} hidden={lang !== code}>
            {F(`descrizione_${code}`, `Testo (${code.toUpperCase()})`, (
              <textarea className={inputCls} rows={10} value={String(f[`descrizione_${code}`] ?? "")} onChange={(e) => set(`descrizione_${code}`, e.target.value)} />
            ), "Testo semplice: separa i paragrafi con una riga vuota. Se vuoto in una lingua, il sito usa quella italiana.")}
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <button className={btnPrimary} disabled={busy}>{busy ? "Salvataggio…" : "Salva evento"}</button>
      </div>
    </form>
  );
}

/** Rotte #/admin/eventi e #/admin/evento/<id|new> */
export function EventsAdmin({ hash }: { hash: string }) {
  const m = hash.match(/^#\/admin\/evento\/([^/?]+)/);
  return m ? <Edit key={m[1]} id={m[1]} /> : <List />;
}
