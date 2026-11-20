import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { btnCls, btnPrimary, inputCls } from "./Admin";

/* File dell'area /materiali: l'amministratore sfoglia i corsi e la cartella pubblica, carica file, crea ed elimina cartelle e file.
   Radice = un elemento per corso (riservato/<corso>) più "Pubblico", i cui file si scaricano senza login dal link mostrato. */

interface Item { name: string; label?: string; isDir: boolean; size: number; mtime: number }
interface Listing { path: string[]; isPublic?: boolean; items: Item[] }

const PUBLIC_KEY = "_pubblico";
const card = "rounded-2xl border border-ink/10 bg-white";
const size = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const day = (t: number) => (t ? new Date(t).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");

export function MaterialiFilesPage({ session }: { session: Session }) {
  const [path, setPath] = useState<string[]>([]);
  const [data, setData] = useState<Listing | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [folder, setFolder] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const q = (p: string[]) => `path=${encodeURIComponent(p.join("/"))}`;
  const headers = { Authorization: `Bearer ${session.access_token}` };

  const fail = async (r: Response) => (await r.json().catch(() => ({}))).error || "Operazione non riuscita";
  const load = useCallback(
    (p: string[]) => {
      setData(null);
      fetch(`/api/admin/materiali/files?${q(p)}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error(await fail(r)))))
        .then(setData)
        .catch((e: Error) => setErr(e.message));
    },
    [session.access_token]
  );
  useEffect(() => load(path), [path, load]);

  const go = (p: string[]) => {
    setErr("");
    setMsg("");
    setPath(p);
  };

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    const files = fileInput.current?.files;
    if (!files?.length) return;
    const form = new FormData();
    form.set("dir", path.join("/"));
    for (const f of Array.from(files)) form.append("files", f);
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/materiali/files", { method: "POST", headers, body: form });
      if (!r.ok) throw new Error(await fail(r));
      const j = await r.json();
      setMsg(`${j.done} file caricati.${j.warning ? ` Alcuni non sono stati caricati: ${j.warning}` : ""}`);
      if (fileInput.current) fileInput.current.value = "";
      load(path);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const mkdir = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const r = await fetch("/api/admin/materiali/files", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ dir: path.join("/"), nome: folder }) });
      if (!r.ok) throw new Error(await fail(r));
      setMsg("Cartella creata.");
      setFolder("");
      load(path);
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const remove = async (it: Item) => {
    const what = it.isDir ? `la cartella "${it.label ?? it.name}" e tutto il suo contenuto` : `il file "${it.name}"`;
    if (!window.confirm(`Eliminare ${what}? L'operazione non si può annullare.`)) return;
    setErr("");
    try {
      const r = await fetch(`/api/admin/materiali/files?${q([...path, it.name])}`, { method: "DELETE", headers });
      if (!r.ok) throw new Error(await fail(r));
      setMsg("Eliminato.");
      load(path);
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  // il download richiede l'intestazione Authorization: si scarica con fetch e si salva il file ottenuto
  const download = async (it: Item) => {
    setErr("");
    try {
      const r = await fetch(`/api/admin/materiali/files?${q([...path, it.name])}&file=1`, { headers });
      if (!r.ok) throw new Error("Download non riuscito");
      const url = URL.createObjectURL(await r.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: it.name });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const publicLink = (it: Item) => `${window.location.origin}/materiali/p/${[...path.slice(1), it.name].map(encodeURIComponent).join("/")}`;
  const copy = (it: Item) => navigator.clipboard?.writeText(publicLink(it)).then(() => setMsg("Link copiato negli appunti."), () => setMsg(publicLink(it)));
  const crumbName = (p: string, i: number) => (i === 0 && p === PUBLIC_KEY ? "Pubblico" : p);

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-[13.5px] text-steel">
        <button className="text-flame hover:underline" onClick={() => go([])}>Materiali</button>
        {path.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span>/</span>
            {i === path.length - 1 ? <b className="text-ink">{crumbName(p, i)}</b> : <button className="text-flame hover:underline" onClick={() => go(path.slice(0, i + 1))}>{crumbName(p, i)}</button>}
          </span>
        ))}
      </nav>

      {data?.isPublic && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Cartella pubblica: chi conosce il link di un file lo scarica senza login. Il contenuto della cartella non è elencato da nessuna parte.
        </p>
      )}
      {msg && <p className="rounded-lg bg-mint/10 px-4 py-3 text-[13px] font-medium text-mint">{msg}</p>}
      {err && <p className="rounded-lg bg-err/10 px-4 py-3 text-[13px] font-medium text-err">{err}</p>}

      <div className={`${card} overflow-hidden`}>
        {!data ? (
          <p className="p-6 text-steel">Caricamento…</p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-center text-steel">{path.length ? "Cartella vuota." : "Nessuna cartella: creane una per il primo corso."}</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {data.items.map((it) => (
              <li key={it.name} className="flex items-center gap-3 px-4 py-3 text-[14px]">
                <span aria-hidden>{it.isDir ? "📁" : "📄"}</span>
                <div className="min-w-0 flex-1">
                  <button className="block max-w-full truncate text-left font-medium hover:text-flame hover:underline" onClick={() => (it.isDir ? go([...path, it.name]) : download(it))}>
                    {it.label ?? it.name}
                  </button>
                  {data.isPublic && !it.isDir && <div className="truncate text-[12px] text-steel">{publicLink(it)}</div>}
                </div>
                {data.isPublic && !it.isDir && <button className="text-[12.5px] text-flame hover:underline" onClick={() => copy(it)}>Copia link</button>}
                <span className="hidden text-[12px] text-steel sm:block">{day(it.mtime)}</span>
                <span className="w-20 text-right text-[12px] text-steel">{it.isDir ? "" : size(it.size)}</span>
                {it.name !== PUBLIC_KEY && <button className="rounded-md border border-err/30 px-2.5 py-1 text-[12px] font-medium text-err hover:bg-err hover:text-white" onClick={() => remove(it)}>Elimina</button>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form onSubmit={upload} className={`${card} p-4`}>
          <label className="block text-[12px] font-semibold text-ink/70">
            Carica file {path.length === 0 && <span className="font-normal text-steel">(apri prima una cartella)</span>}
            <input ref={fileInput} type="file" multiple required disabled={path.length === 0} className="mt-2 block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-white" />
          </label>
          <button className={`${btnPrimary} mt-3`} disabled={busy || path.length === 0}>{busy ? "Caricamento…" : "Carica"}</button>
        </form>
        <form onSubmit={mkdir} className={`${card} p-4`}>
          <label className="block text-[12px] font-semibold text-ink/70">
            {path.length === 0 ? "Nuova cartella corso" : "Nuova cartella"}
            <input className={`${inputCls} mt-2`} value={folder} required maxLength={150} placeholder={path.length === 0 ? "CPSA-F_Dic26" : "Slide"} onChange={(e) => setFolder(e.target.value)} />
          </label>
          <button className={`${btnCls} mt-3 bg-ink text-white hover:bg-flame`}>Crea cartella</button>
        </form>
      </div>
    </div>
  );
}
