// Gestione utenti dell'area materiali per il pannello /admin (le rotte fanno prima adminGate).
import fs from "node:fs";
import { PUBLIC_KEY, createUser, deleteUser, ensureDirs, fileResponse, findUser, listCourseFolders, listDir, listRoots, listUsers, makeFolder, makeResetToken, maxUploadBytes, privateRoot, removePath, resolve, saveUpload, updateUser } from "./materiali.mjs";
import { mailConfigured, sendPasswordEmail } from "./mail.mjs";

const ok = (body = {}) => ({ status: 200, body });
const fail = (status, error) => ({ status, body: { error } });
const WEEK = 7 * 864e5;

export const resetLink = (origin, username, ttlMs) => `${origin}/materiali/reimposta?t=${encodeURIComponent(makeResetToken(username, ttlMs))}`;

/** Manda a un utente il link per scegliere la password (invito dall'amministratore: valido 7 giorni). */
async function invite(username, origin, kind = "invite") {
  const u = findUser(username);
  if (!u?.email) return { sent: false, reason: "no-email" };
  return sendPasswordEmail({ to: u.email, name: u.name, username: u.username, link: resetLink(origin, u.username, kind === "invite" ? WEEK : undefined), kind });
}

export function adminMaterialiList() {
  return ok({ users: listUsers(), folders: listCourseFolders(), mail: mailConfigured(), persistent: !!process.env.MATERIALI_DIR });
}

export async function adminMaterialiCreate(body, origin) {
  const wantsInvite = body.invite !== false;
  if (!body.password && !(wantsInvite && mailConfigured())) {
    return fail(400, "Imposta una password oppure configura la posta (SMTP) per inviare l'invito.");
  }
  const r = createUser(body);
  if (r.error) return fail(400, r.error);
  const mail = body.password && !wantsInvite ? null : await invite(r.username, origin);
  return ok({ username: r.username, invited: !!mail?.sent, mailError: mail && !mail.sent ? mail.reason : undefined });
}

export async function adminMaterialiUpdate(username, body, origin) {
  if (body.action === "reset") {
    if (!mailConfigured()) return fail(400, "Posta (SMTP) non configurata.");
    const m = await invite(username, origin, "reset");
    return m.sent ? ok({ sent: true }) : fail(500, m.reason === "no-email" ? "L'utente non ha un'email." : "Invio email non riuscito.");
  }
  const r = updateUser(username, body);
  return r.error ? fail(400, r.error) : ok({ username });
}

export function adminMaterialiDelete(username) {
  const r = deleteUser(username);
  return r.error ? fail(404, r.error) : ok({ username });
}

/* ----------------------------- file (l'admin vede tutto) ----------------------------- */

const ADMIN = { role: "trainer", folders: ["*"] }; // l'amministratore ha i poteri del trainer su tutti i corsi
const isDir = (full) => fs.existsSync(full) && fs.statSync(full).isDirectory();
const errText = { nome: "Nome non valido (niente / \ o punto iniziale).", esiste: "Esiste già un elemento con questo nome.", tipo: "Tipo di file non consentito.", grande: "File troppo grande." };

/** Contenuto di una cartella ([] = radice: corsi e cartella pubblica). */
export function adminFilesList(parts) {
  ensureDirs();
  if (!parts.length) return ok({ path: [], items: listRoots(ADMIN).map((r) => ({ name: r.key, label: r.label, isDir: true, size: 0, mtime: 0 })) });
  const r = resolve(parts);
  if (!r || !isDir(r.full)) return fail(404, "Cartella non trovata.");
  return ok({ path: parts, isPublic: r.key === PUBLIC_KEY, items: listDir(r.full) });
}

export function adminFilesMkdir(parts, name) {
  ensureDirs();
  const base = parts.length ? resolve(parts) : { full: privateRoot() };
  if (!base || !isDir(base.full)) return fail(404, "Cartella non trovata.");
  const r = makeFolder(base.full, name);
  return r.error ? fail(400, errText[r.error] || "Operazione non riuscita.") : ok({ name: r.name });
}

export async function adminFilesUpload(parts, files) {
  ensureDirs();
  const t = resolve(parts);
  if (!t || !isDir(t.full)) return fail(404, "Carica i file dentro una cartella (non nella radice).");
  let done = 0;
  let error = "";
  for (const f of files) {
    const r = await saveUpload(t.full, f);
    if (r.error) error ||= errText[r.error] || "Caricamento non riuscito.";
    else done++;
  }
  return done || !error ? ok({ done, warning: error || undefined }) : fail(400, error);
}

export function adminFilesDelete(parts) {
  const t = resolve(parts);
  if (!t || !fs.existsSync(t.full) || (t.isRoot && t.key === PUBLIC_KEY)) return fail(404, "Elemento non trovato (la cartella pubblica non si elimina).");
  removePath(t.full);
  return ok({});
}

export function adminFilesDownload(parts, request) {
  const t = resolve(parts);
  return t && !t.isRoot ? fileResponse(t.full, request, { isPublic: false }) : new Response("File non trovato.", { status: 404 });
}

export const adminMaxUpload = maxUploadBytes;
