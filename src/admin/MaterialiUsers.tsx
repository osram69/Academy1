import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Field, btnCls, btnPrimary, inputCls } from "./Admin";

/* Utenti dell'area /materiali (slide e materiali dei corsi). Si salvano nella cartella dati del server (MATERIALI_DIR),
   non in Supabase. Studente: legge le cartelle abilitate. Trainer: in più carica, crea ed elimina file e cartelle.
   L'utente sceglie la password dal link ricevuto per email (invito) e la può reimpostare da solo dalla pagina di accesso. */

interface MUser { username: string; name: string; email: string; role: "studente" | "trainer"; folders: string[] }
interface Data { users: MUser[]; folders: string[]; mail: boolean; persistent: boolean }
interface Form { username: string; name: string; email: string; role: "studente" | "trainer"; all: boolean; folders: string[]; extra: string; password: string; invite: boolean }

const EMPTY: Form = { username: "", name: "", email: "", role: "studente", all: false, folders: [], extra: "", password: "", invite: true };
const card = "rounded-2xl border border-ink/10 bg-white p-6";

export function MaterialiUsersPage({ session }: { session: Session }) {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<string | "new" | null>(null);
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (method: string, query = "", body?: unknown) => {
      const r = await fetch(`/api/admin/materiali${query}`, {
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
  const load = useCallback(() => call("GET").then(setData).catch((e: Error) => setErr(e.message)), [call]);
  useEffect(() => void load(), [load]);

  const open = (u?: MUser) => {
    setErr("");
    setMsg("");
    setEdit(u ? u.username : "new");
    setF(u ? { ...EMPTY, username: u.username, name: u.name, email: u.email, role: u.role, all: u.folders.includes("*"), folders: u.folders.filter((x) => x !== "*"), invite: false } : EMPTY);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const extra = f.extra.split(",").map((s) => s.trim()).filter(Boolean);
    const body = { username: f.username.trim(), name: f.name, email: f.email, role: f.role, folders: f.all ? ["*"] : [...new Set([...f.folders, ...extra])], password: f.password || undefined, invite: f.invite };
    try {
      if (edit === "new") {
        const r = await call("POST", "", body);
        setMsg(r.invited ? `Utente creato: email d'invito inviata a ${f.email}.` : r.mailError ? `Utente creato, ma l'email non è partita (${r.mailError}). Usa "Invia link password".` : "Utente creato.");
      } else {
        await call("PATCH", `?user=${encodeURIComponent(edit!)}`, body);
        setMsg("Utente aggiornato.");
      }
      setEdit(null);
      await load();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendLink = async (u: MUser) => {
    if (!window.confirm(`Inviare a ${u.email} il link per scegliere una nuova password?`)) return;
    setErr("");
    try {
      await call("PATCH", `?user=${encodeURIComponent(u.username)}`, { action: "reset" });
      setMsg(`Link inviato a ${u.email}.`);
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const remove = async (u: MUser) => {
    if (!window.confirm(`Eliminare l'utente "${u.username}"? Non potrà più accedere ai materiali.`)) return;
    setErr("");
    try {
      await call("DELETE", `?user=${encodeURIComponent(u.username)}`);
      setMsg(`Utente "${u.username}" eliminato.`);
      await load();
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const toggle = (name: string) => setF((cur) => ({ ...cur, folders: cur.folders.includes(name) ? cur.folders.filter((x) => x !== name) : [...cur.folders, name] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-steel">Accessi all'area materiali. Lo studente legge le cartelle abilitate; il trainer carica e gestisce anche i file.</p>
        {!edit && <button className={btnPrimary} onClick={() => open()}>Nuovo utente</button>}
      </div>

      {data && !data.persistent && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          La variabile <code>MATERIALI_DIR</code> non è impostata: utenti e file finirebbero dentro l'app e si perderebbero a ogni build. Impostala nel pannello Hostinger.
        </p>
      )}
      {data && !data.mail && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          La posta (SMTP) non è configurata: non si possono inviare inviti né reset. Imposta tu la password di ogni utente.
        </p>
      )}
      {msg && <p className="rounded-lg bg-mint/10 px-4 py-3 text-[13px] font-medium text-mint">{msg}</p>}
      {err && <p className="rounded-lg bg-err/10 px-4 py-3 text-[13px] font-medium text-err">{err}</p>}

      {edit && (
        <form onSubmit={submit} className={`${card} space-y-4`}>
          <h2 className="font-display text-lg font-bold">{edit === "new" ? "Nuovo utente" : `Modifica ${edit}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome utente" hint="3-40 caratteri: lettere, numeri, . _ -">
              <input className={inputCls} value={f.username} disabled={edit !== "new"} required onChange={(e) => setF({ ...f, username: e.target.value })} />
            </Field>
            <Field label="Nome e cognome (facoltativo)">
              <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </Field>
            <Field label="Email (facoltativa con password)" hint="Serve per l'invito e per il reset da parte dell'utente. Lasciala vuota per un account condiviso di corso (imposta la password qui sotto).">
              <input className={inputCls} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </Field>
            <Field label="Ruolo" hint="Il trainer può caricare, creare ed eliminare file e cartelle.">
              <select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Form["role"] })}>
                <option value="studente">Studente (sola lettura)</option>
                <option value="trainer">Trainer (carica e gestisce)</option>
              </select>
            </Field>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-[12px] font-semibold text-ink/70">Cartelle abilitate</legend>
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={f.all} onChange={(e) => setF({ ...f, all: e.target.checked })} /> Tutte le cartelle {f.role === "trainer" && <span className="text-steel">(il trainer può anche creare ed eliminare i corsi)</span>}
            </label>
            {!f.all && (
              <>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {data?.folders.map((n) => (
                    <label key={n} className="flex items-center gap-2 text-[14px]">
                      <input type="checkbox" checked={f.folders.includes(n)} onChange={() => toggle(n)} /> {n}
                    </label>
                  ))}
                  {data && !data.folders.length && <span className="text-[13px] text-steel">Nessuna cartella ancora: scrivi i nomi qui sotto, oppure creale da /materiali.</span>}
                </div>
                <input className={inputCls} placeholder="Altre cartelle, separate da virgola (es. CPSA-F_Dic26)" value={f.extra} onChange={(e) => setF({ ...f, extra: e.target.value })} />
                {edit !== "new" && f.folders.filter((x) => !data?.folders.includes(x)).length > 0 && (
                  <p className="text-[12px] text-steel">Già assegnate ma non ancora create: {f.folders.filter((x) => !data?.folders.includes(x)).join(", ")}</p>
                )}
              </>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={edit === "new" ? "Password (facoltativa)" : "Nuova password (facoltativa)"} hint={edit === "new" ? "Se la lasci vuota, l'utente riceve un'email con il link per sceglierla." : "Lasciala vuota per non cambiarla. Minimo 10 caratteri."}>
              <input className={inputCls} type="text" autoComplete="off" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            </Field>
            {edit === "new" && (
              <label className="flex items-center gap-2 self-end pb-2 text-[14px]">
                <input type="checkbox" checked={f.invite} disabled={!data?.mail} onChange={(e) => setF({ ...f, invite: e.target.checked })} /> Invia l'email d'invito
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <button className={btnPrimary} disabled={busy}>{busy ? "Salvo…" : "Salva"}</button>
            <button type="button" className={`${btnCls} border border-ink/20 hover:border-flame`} onClick={() => setEdit(null)}>Annulla</button>
          </div>
        </form>
      )}

      <div className={`${card} overflow-x-auto p-0`}>
        {!data ? (
          <p className="p-6 text-steel">Caricamento…</p>
        ) : data.users.length === 0 ? (
          <p className="p-6 text-steel">Nessun utente. Crea il primo con "Nuovo utente".</p>
        ) : (
          <table className="w-full text-left text-[13.5px]">
            <thead className="border-b border-ink/10 text-[12px] uppercase tracking-wide text-steel">
              <tr><th className="px-4 py-3">Utente</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Ruolo</th><th className="px-4 py-3">Cartelle</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.users.map((u) => (
                <tr key={u.username}>
                  <td className="px-4 py-3"><b>{u.username}</b>{u.name && <div className="text-[12px] text-steel">{u.name}</div>}</td>
                  <td className="px-4 py-3">{u.email || <span className="text-err">manca</span>}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${u.role === "trainer" ? "bg-flame/10 text-flame" : "bg-ink/5 text-ink/70"}`}>{u.role === "trainer" ? "Trainer" : "Studente"}</span></td>
                  <td className="px-4 py-3">{u.folders.includes("*") ? "Tutte" : u.folders.join(", ") || <span className="text-steel">nessuna</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-flame hover:underline" onClick={() => open(u)}>Modifica</button>
                    {data.mail && u.email && <button className="mr-3 text-flame hover:underline" onClick={() => sendLink(u)}>Invia link password</button>}
                    <button className="text-err hover:underline" onClick={() => remove(u)}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
