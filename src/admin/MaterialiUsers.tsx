import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { generatePassword } from "../../shared/password.mjs";
import { Field, btnCls, btnPrimary, inputCls } from "./Admin";

/* Utenti dell'area /materiali (slide e materiali dei corsi). Si salvano nella cartella dati del server (MATERIALI_DIR),
   non in Supabase. Si definiscono solo nome utente, password e cartelle visibili: l'account si comunica a tutti i ragazzi del corso.
   La password resta visibile e copiabile (il server la conserva anche in chiaro). Gli utenti sono in sola lettura;
   i file si gestiscono dalla scheda "File". */

interface MUser { username: string; role: "studente" | "trainer"; folders: string[]; password: string }
interface Data { users: MUser[]; folders: string[]; persistent: boolean }
interface Form { username: string; all: boolean; folders: string[]; extra: string; password: string }

const EMPTY: Form = { username: "", all: false, folders: [], extra: "", password: "" };
const card = "rounded-2xl border border-ink/10 bg-white p-6";

/** Testo da incollare in una mail o in chat per comunicare l'account agli studenti. */
function inviteText(username: string, password: string): string {
  return `Accesso ai materiali del corso\nIndirizzo: ${location.origin}/materiali\nNome utente: ${username}\nPassword: ${password}`;
}

export function MaterialiUsersPage({ session }: { session: Session }) {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<string | "new" | null>(null);
  const [orig, setOrig] = useState("");
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

  const copy = (text: string, done: string) => {
    setErr("");
    navigator.clipboard?.writeText(text).then(() => setMsg(done), () => setErr("Non riesco a copiare: seleziona il testo e copialo a mano."));
  };

  const open = (u?: MUser) => {
    setErr("");
    setMsg("");
    setEdit(u ? u.username : "new");
    setOrig(u?.password ?? "");
    setF(u ? { ...EMPTY, username: u.username, all: u.folders.includes("*"), folders: u.folders.filter((x) => x !== "*"), password: u.password } : EMPTY);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const extra = f.extra.split(",").map((s) => s.trim()).filter(Boolean);
    const folders = f.all ? ["*"] : [...new Set([...f.folders, ...extra])];
    try {
      if (edit === "new") {
        await call("POST", "", { username: f.username.trim(), password: f.password, folders, invite: false });
        setMsg("Utente creato.");
      } else {
        // la password si invia solo se è cambiata: rinviarla uguale chiuderebbe le sessioni già aperte
        await call("PATCH", `?user=${encodeURIComponent(edit!)}`, { folders, ...(f.password && f.password !== orig ? { password: f.password } : {}) });
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
        <p className="text-[13px] text-steel">Un account (nome utente e password) da comunicare a tutti i ragazzi del corso, con le cartelle che possono vedere. Gli utenti leggono e scaricano; i file si gestiscono dalla scheda "File".</p>
        {!edit && <button className={btnPrimary} onClick={() => open()}>Nuovo utente</button>}
      </div>

      {data && !data.persistent && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          La variabile <code>MATERIALI_DIR</code> non è impostata: utenti e file finirebbero dentro l'app e si perderebbero a ogni build. Impostala nel pannello Hostinger.
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
            <Field label="Password" hint={edit === "new" ? "Da 8 caratteri. Resta visibile in elenco." : orig ? "Da 8 caratteri. Cambiarla chiude gli accessi già aperti." : "Password attuale non rileggibile: scrivine una nuova o lascia vuoto per non cambiarla."}>
              <div className="flex gap-2">
                <input className={inputCls} type="text" autoComplete="off" value={f.password} required={edit === "new"} minLength={8} maxLength={200} onChange={(e) => setF({ ...f, password: e.target.value })} />
                <button type="button" className={`${btnCls} shrink-0 border border-ink/20 hover:border-flame`} onClick={() => setF({ ...f, password: generatePassword(8) })} title="Compila il campo con una password casuale di 8 caratteri">Genera</button>
              </div>
            </Field>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-[12px] font-semibold text-ink/70">Cartelle visibili</legend>
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={f.all} onChange={(e) => setF({ ...f, all: e.target.checked })} /> Tutte le cartelle
            </label>
            {!f.all && (
              <>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {data?.folders.map((n) => (
                    <label key={n} className="flex items-center gap-2 text-[14px]">
                      <input type="checkbox" checked={f.folders.includes(n)} onChange={() => toggle(n)} /> {n}
                    </label>
                  ))}
                  {data && !data.folders.length && <span className="text-[13px] text-steel">Nessuna cartella ancora: scrivi i nomi qui sotto, oppure creale dalla scheda "File".</span>}
                </div>
                <input className={inputCls} placeholder="Altre cartelle, separate da virgola (es. CPSA-F_Dic26)" value={f.extra} onChange={(e) => setF({ ...f, extra: e.target.value })} />
                {edit !== "new" && f.folders.filter((x) => !data?.folders.includes(x)).length > 0 && (
                  <p className="text-[12px] text-steel">Già assegnate ma non ancora create: {f.folders.filter((x) => !data?.folders.includes(x)).join(", ")}</p>
                )}
              </>
            )}
          </fieldset>

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
              <tr><th className="px-4 py-3">Utente</th><th className="px-4 py-3">Password</th><th className="px-4 py-3">Cartelle</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.users.map((u) => (
                <tr key={u.username}>
                  <td className="px-4 py-3"><b>{u.username}</b>{u.role === "trainer" && <div className="text-[12px] text-flame">vecchio account trainer</div>}</td>
                  <td className="px-4 py-3">
                    {u.password ? (
                      <><code>{u.password}</code> <button className="ml-2 text-flame hover:underline" onClick={() => copy(u.password, "Password copiata.")}>Copia</button></>
                    ) : (
                      <span className="text-steel">non rileggibile</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{u.folders.includes("*") ? "Tutte" : u.folders.join(", ") || <span className="text-steel">nessuna</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-flame hover:underline" onClick={() => open(u)}>Modifica</button>
                    {u.password && <button className="mr-3 text-flame hover:underline" onClick={() => copy(inviteText(u.username, u.password), "Messaggio copiato: incollalo in una mail o in chat.")}>Copia messaggio</button>}
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
