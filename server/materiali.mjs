// Area materiali: download delle slide (pubbliche o riservate) e gestione file da parte dei trainer.
//
// Tutto vive in MATERIALI_DIR, una cartella FUORI dall'applicazione, così file, utenti e chiave di sessione
// sopravvivono a build e ridistribuzioni:
//
//   <MATERIALI_DIR>/pubblico/…            file scaricabili senza login da /materiali/p/<percorso> (la cartella non si può sfogliare)
//   <MATERIALI_DIR>/riservato/<corso>/…   cartelle visibili solo agli utenti abilitati (elenco + download)
//   <MATERIALI_DIR>/_config/users.json    utenti: { "users": { "nome": { "hash": "scrypt$…", "folders": ["CPSA-F_May26"], "role": "trainer" } } }
//   <MATERIALI_DIR>/_config/session.secret  chiave per firmare i cookie (creata da sola se manca)
//
// Ruoli: "studente" (default) legge le cartelle abilitate; "trainer" in più carica file, crea ed elimina cartelle/file
// e gestisce anche la cartella pubblica. folders = ["*"] abilita tutte le cartelle riservate (e la creazione di nuovi corsi).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Readable } from "node:stream";

export const PUBLIC_KEY = "_pubblico"; // "cartella" virtuale che punta a <MATERIALI_DIR>/pubblico (solo trainer)
export const COOKIE = "materiali_sid";
const SESSION_DAYS = 7;

export const dataDir = () => path.resolve(process.env.MATERIALI_DIR || path.join(process.cwd(), "materiali-data"));
const pubDir = () => path.join(dataDir(), "pubblico");
const privDir = () => path.join(dataDir(), "riservato");
export const privateRoot = () => {
  fs.mkdirSync(privDir(), { recursive: true });
  return privDir();
};
const confDir = () => path.join(dataDir(), "_config");
export const usersFile = () => path.join(confDir(), "users.json");
export const maxUploadBytes = () => (Number(process.env.MATERIALI_MAX_UPLOAD_MB) || 200) * 1024 * 1024;

// ---------- utenti e password ----------
export function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile(), "utf8")).users || {};
  } catch {
    return {};
  }
}
/** Scrittura atomica: file temporaneo + rinomina, così un'interruzione non lascia un users.json a metà. */
export function writeUsers(users) {
  fs.mkdirSync(confDir(), { recursive: true });
  const tmp = `${usersFile()}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ users }, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(tmp, usersFile());
}
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
function verifyPassword(pw, stored) {
  const [alg, salt, hash] = String(stored || "").split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = crypto.scryptSync(pw, salt, a.length);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const DUMMY = hashPassword("dummy"); // per non rivelare con i tempi se un utente esiste
export const MIN_PASSWORD = 8;

let secretCache = "";
function secret() {
  if (process.env.MATERIALI_SESSION_SECRET) return process.env.MATERIALI_SESSION_SECRET;
  if (secretCache) return secretCache;
  const f = path.join(confDir(), "session.secret");
  try {
    secretCache = fs.readFileSync(f, "utf8").trim();
  } catch {
    fs.mkdirSync(confDir(), { recursive: true });
    secretCache = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(f, secretCache, { mode: 0o600 });
  }
  return secretCache;
}

// ---------- token firmati (sessione e reset password), senza stato sul server ----------
const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (domain, s) => crypto.createHmac("sha256", secret()).update(`${domain}:${s}`).digest("base64url");
/** Impronta della password attuale: cambiando password, sessioni e link di reset già emessi smettono di valere. */
const fingerprint = (u) => crypto.createHash("sha256").update(String(u.hash)).digest("base64url").slice(0, 12);

function makeToken(domain, parts) {
  const body = b64(parts.join("|"));
  return `${body}.${sign(domain, body)}`;
}
function readToken(domain, token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const good = sign(domain, body);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  return Buffer.from(body, "base64url").toString().split("|");
}

export function makeSession(name) {
  const u = readUsers()[name];
  return makeToken("sid", [name, Date.now() + SESSION_DAYS * 864e5, fingerprint(u)]);
}
/** Restituisce { name, fullName, role, folders } se il cookie è valido e l'utente esiste ancora. */
export function userFromToken(token) {
  const t = readToken("sid", token);
  if (!t) return null;
  const [name, exp, fp] = t;
  if (!(Number(exp) > Date.now())) return null;
  const u = readUsers()[name];
  if (!u || fp !== fingerprint(u)) return null;
  return { name, fullName: u.name || "", role: u.role === "trainer" ? "trainer" : "studente", folders: Array.isArray(u.folders) ? u.folders : [] };
}
export function cookieHeader(value, secure) {
  const age = value ? SESSION_DAYS * 86400 : 0;
  return `${COOKIE}=${value}; Path=/materiali; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? "; Secure" : ""}`;
}
export const isSecure = (request) =>
  (request.headers.get("x-forwarded-proto") || "").includes("https") || (process.env.SITE_URL || "").startsWith("https");

// ---------- reset della password ----------
/** Link a uso singolo: vale finché la password non cambia e fino alla scadenza. */
export function makeResetToken(username, ttlMs = 60 * 60e3) {
  const u = readUsers()[username];
  return u ? makeToken("reset", [username, Date.now() + ttlMs, fingerprint(u)]) : "";
}
/** Nome utente a cui appartiene il link, oppure null se scaduto, già usato o manomesso. */
export function checkResetToken(token) {
  const t = readToken("reset", token);
  if (!t) return null;
  const [name, exp, fp] = t;
  const u = readUsers()[name];
  return u && Number(exp) > Date.now() && fp === fingerprint(u) ? name : null;
}
export function setPassword(username, password) {
  const users = readUsers();
  if (!users[username]) return false;
  users[username].hash = hashPassword(password);
  writeUsers(users);
  return true;
}
export const passwordOk = (pw) => typeof pw === "string" && pw.length >= MIN_PASSWORD && pw.length <= 200;

const normEmail = (e) => String(e || "").trim().toLowerCase();
export const validEmail = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@.]{2,}$/.test(normEmail(e));
/** Trova un utente per nome utente o per email (senza distinguere maiuscole). */
export function findUser(id) {
  const key = String(id || "").trim();
  const users = readUsers();
  if (users[key]) return { username: key, ...users[key] };
  const lower = key.toLowerCase();
  for (const [username, u] of Object.entries(users)) {
    if (username.toLowerCase() === lower || (u.email && normEmail(u.email) === lower)) return { username, ...u };
  }
  return null;
}

// richieste di reset: pochi tentativi per indirizzo IP e per account (la risposta è sempre la stessa)
const resetHits = new Map();
export function resetAllowed(key, max, windowMs) {
  const now = Date.now();
  const h = (resetHits.get(key) || []).filter((t) => now - t < windowMs);
  if (h.length >= max) return false;
  h.push(now);
  resetHits.set(key, h);
  if (resetHits.size > 5000) resetHits.clear();
  return true;
}

// ---------- login con limite di tentativi ----------
const fails = new Map();
export function login(name, password, ip) {
  const now = Date.now();
  const f = fails.get(ip);
  if (f && now - f.t < 10 * 60e3 && f.n >= 10) return { error: "limit" };
  const u = findUser(name);
  const ok = verifyPassword(String(password || ""), u?.hash || DUMMY) && !!u;
  if (!ok) {
    fails.set(ip, { n: f && now - f.t < 10 * 60e3 ? f.n + 1 : 1, t: f && now - f.t < 10 * 60e3 ? f.t : now });
    if (fails.size > 5000) fails.clear();
    return { error: "bad" };
  }
  fails.delete(ip);
  return { token: makeSession(u.username) };
}

// ---------- gestione utenti (pannello admin) ----------
const USERNAME = /^[a-zA-Z0-9._-]{3,40}$/;

export function listUsers() {
  return Object.entries(readUsers())
    // `password` è la password in chiaro (campo `clear`), vuota per gli account creati prima: serve solo alla scheda Utenti del pannello admin
    .map(([username, u]) => ({ username, name: u.name || "", email: u.email || "", role: u.role === "trainer" ? "trainer" : "studente", folders: u.folders || [], password: u.clear || "" }))
    .sort((a, b) => a.username.localeCompare(b.username, "it"));
}
/** Cartelle corso esistenti in riservato/ (per le caselle di selezione). */
export function listCourseFolders() {
  try {
    return fs.readdirSync(privDir(), { withFileTypes: true }).filter((e) => e.isDirectory() && validKey(e.name)).map((e) => e.name).sort((a, b) => a.localeCompare(b, "it", { numeric: true }));
  } catch {
    return [];
  }
}
function cleanFields(b) {
  const role = b.role === "trainer" ? "trainer" : "studente";
  const raw = Array.isArray(b.folders) ? b.folders : [];
  const folders = raw.includes("*") ? ["*"] : [...new Set(raw.map((f) => String(f).trim()).filter(Boolean))];
  if (folders.some((f) => f !== "*" && !validKey(f))) return { error: "Nome cartella non valido." };
  const email = normEmail(b.email);
  if (email && !validEmail(email)) return { error: "Email non valida." };
  return { role, folders, email, name: String(b.name || "").trim().slice(0, 100) };
}
const emailTaken = (users, email, except) => !!email && Object.entries(users).some(([n, u]) => n !== except && normEmail(u.email) === email);

/** Crea un utente. Senza password ne viene generata una casuale (l'utente la imposta dal link d'invito). */
export function createUser(b) {
  const username = String(b.username || "").trim();
  if (!USERNAME.test(username)) return { error: "Nome utente: 3-40 caratteri tra lettere, numeri, . _ -" };
  const users = readUsers();
  if (findUser(username)) return { error: "Esiste già un utente con questo nome." };
  const f = cleanFields(b);
  if (f.error) return f;
  // senza email serve una password impostata dall'admin (account condiviso di corso: nessun invito né reset via email)
  if (!f.email && !b.password) return { error: "Inserisci l'email (per l'invito) oppure imposta una password." };
  if (emailTaken(users, f.email)) return { error: "Questa email è già usata da un altro utente." };
  if (b.password &&!passwordOk(b.password)) return { error: `La password deve avere almeno ${MIN_PASSWORD} caratteri.` };
  const password = b.password || crypto.randomBytes(24).toString("base64url");
  // la password scritta dal trainer si conserva anche in chiaro (`clear`) per poterla rivedere e rimandare; una generata per l'invito no
  users[username] = { hash: hashPassword(password), email: f.email, name: f.name, role: f.role, folders: f.folders, ...(b.password ? { clear: b.password } : {}) };
  writeUsers(users);
  return { username, generated: !b.password };
}
export function updateUser(username, b) {
  const users = readUsers();
  const cur = users[username];
  if (!cur) return { error: "Utente inesistente." };
  // i campi non inviati restano quelli di prima: il modulo semplificato manda solo cartelle e password e non deve cancellare ruolo, email o nome
  const f = cleanFields({ role: cur.role, email: cur.email, name: cur.name, folders: cur.folders, ...Object.fromEntries(Object.entries(b).filter(([k, v]) => v !== undefined)) });
  if (f.error) return f;
  if (emailTaken(users, f.email, username)) return { error: "Questa email è già usata da un altro utente." };
  if (b.password && !passwordOk(b.password)) return { error: `La password deve avere almeno ${MIN_PASSWORD} caratteri.` };
  users[username] = { ...cur, email: f.email, name: f.name, role: f.role, folders: f.folders, ...(b.password ? { hash: hashPassword(b.password), clear: b.password } : {}) };
  writeUsers(users);
  return { username };
}
export function deleteUser(username) {
  const users = readUsers();
  if (!users[username]) return { error: "Utente inesistente." };
  delete users[username];
  writeUsers(users);
  return { username };
}

// ---------- permessi ----------
export const isTrainer = (u) => u?.role === "trainer";
export const canSee = (u, key) => !!u && (key === PUBLIC_KEY ? isTrainer(u) : u.folders.includes("*") || u.folders.includes(key));
/** Solo chi ha "*" crea o elimina intere cartelle corso (primo livello). */
export const canManageRoots = (u) => isTrainer(u) && u.folders.includes("*");

// ---------- percorsi sicuri ----------
/** Nome valido per file/cartelle: niente separatori, niente nomi nascosti, niente caratteri di controllo. */
export function validName(n) {
  return typeof n === "string" && n.length > 0 && n.length <= 150 && !/[\\/\x00-\x1f\x7f]/.test(n) && !n.startsWith(".") && n.trim() === n;
}
const validKey = (k) => validName(k) && (k === PUBLIC_KEY || !k.startsWith("_"));
export const rootOf = (key) => (key === PUBLIC_KEY ? pubDir() : path.join(privDir(), key));

/** Risolve ["corso","sub","file.pdf"] dentro la sua radice, impedendo uscite via .., link simbolici e nomi strani. */
export function resolve(parts) {
  if (!Array.isArray(parts) || !parts.length || !parts.every(validName) || !validKey(parts[0])) return null;
  const root = rootOf(parts[0]);
  let realRoot;
  try {
    realRoot = fs.realpathSync(root);
  } catch {
    return null;
  }
  const full = path.join(root, ...parts.slice(1));
  let real = full;
  try {
    real = fs.realpathSync(full);
  } catch {
    /* percorso non ancora esistente: i segmenti sono già validati */
  }
  if (real !== realRoot && !real.startsWith(realRoot + path.sep)) return null;
  return { key: parts[0], full, depth: parts.length - 1, isRoot: parts.length === 1 };
}

export function listDir(full) {
  const out = [];
  for (const e of fs.readdirSync(full, { withFileTypes: true })) {
    if (e.name.startsWith(".") || (!e.isDirectory() && !e.isFile())) continue;
    const st = fs.statSync(path.join(full, e.name));
    out.push({ name: e.name, isDir: e.isDirectory(), size: e.isDirectory() ? 0 : st.size, mtime: st.mtimeMs });
  }
  return out.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name, "it", { numeric: true }) : a.isDir ? -1 : 1));
}

/** Crea pubblico/ e riservato/ se mancano (cartella dati appena preparata). */
export function ensureDirs() {
  fs.mkdirSync(pubDir(), { recursive: true });
  fs.mkdirSync(privDir(), { recursive: true });
}

/** Cartelle di primo livello visibili all'utente. */
export function listRoots(u) {
  ensureDirs();
  const out = [];
  try {
    for (const e of fs.readdirSync(privDir(), { withFileTypes: true })) {
      if (e.isDirectory() && validKey(e.name) && canSee(u, e.name)) out.push({ key: e.name, label: e.name });
    }
  } catch {
    /* cartella riservato ancora assente */
  }
  out.sort((a, b) => a.label.localeCompare(b.label, "it", { numeric: true }));
  if (isTrainer(u)) out.push({ key: PUBLIC_KEY, label: "Pubblico (senza login)" });
  return out;
}

/** Numero di file e data dell'ultima modifica dentro una cartella (per la pagina dello studente). */
export function folderStats(full, depth = 0) {
  let files = 0;
  let last = 0;
  if (depth > 8) return { files, last };
  try {
    for (const e of fs.readdirSync(full, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const f = path.join(full, e.name);
      if (e.isDirectory()) {
        const r = folderStats(f, depth + 1);
        files += r.files;
        last = Math.max(last, r.last);
      } else if (e.isFile()) {
        files++;
        last = Math.max(last, fs.statSync(f).mtimeMs);
      }
    }
  } catch {
    /* cartella non leggibile: conta zero */
  }
  return { files, last };
}

// ---------- scrittura (solo trainer: i controlli stanno nella route) ----------
const BLOCKED_EXT = /\.(php\d?|phtml|phar|cgi|pl|py|sh|exe|bat|cmd|htaccess)$/i;
const cleanName = (n) => String(n || "").normalize("NFC").replace(/[\\/\x00-\x1f\x7f]/g, "_").trim().replace(/^\.+/, "").slice(0, 150);

export function makeFolder(dirFull, rawName) {
  const name = cleanName(rawName);
  if (!validName(name)) return { error: "nome" };
  const target = path.join(dirFull, name);
  if (fs.existsSync(target)) return { error: "esiste" };
  fs.mkdirSync(target);
  return { name };
}
export async function saveUpload(dirFull, file) {
  const name = cleanName(file.name);
  if (!validName(name) || BLOCKED_EXT.test(name)) return { error: "tipo", name: file.name };
  if (file.size > maxUploadBytes()) return { error: "grande", name };
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let final = name;
  for (let i = 2; fs.existsSync(path.join(dirFull, final)); i++) final = `${stem} (${i})${ext}`;
  fs.writeFileSync(path.join(dirFull, final), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  return { name: final };
}
export function removePath(full) {
  fs.rmSync(full, { recursive: true, force: false });
}

// ---------- invio file ----------
const TYPES = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8", csv: "text/csv; charset=utf-8", json: "application/json",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", zip: "application/zip",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const INLINE = new Set(["pdf", "png", "jpg", "jpeg", "gif", "webp", "txt", "md", "mp4", "webm", "mp3"]); // html e svg sempre come download

export function fileResponse(full, request, { isPublic }) {
  let st;
  try {
    st = fs.statSync(full);
  } catch {
    return new Response("File non trovato.", { status: 404 });
  }
  if (!st.isFile()) return new Response("File non trovato.", { status: 404 });
  const name = path.basename(full);
  const ext = path.extname(name).slice(1).toLowerCase();
  const headers = {
    "Content-Type": TYPES[ext] || "application/octet-stream",
    "Content-Disposition": `${INLINE.has(ext) ? "inline" : "attachment"}; filename="${name.replace(/[^\x20-\x7e]|["\\]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "Accept-Ranges": "bytes",
    "Cache-Control": isPublic ? "public, max-age=600" : "private, no-store",
  };
  let start = 0;
  let end = st.size - 1;
  let status = 200;
  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (m && (m[1] || m[2]) && st.size > 0) {
    start = m[1] ? Number(m[1]) : Math.max(0, st.size - Number(m[2]));
    end = m[1] && m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
    if (start > end || start >= st.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${st.size}` } });
    status = 206;
    headers["Content-Range"] = `bytes ${start}-${end}/${st.size}`;
  }
  headers["Content-Length"] = String(st.size ? end - start + 1 : 0);
  if (!st.size) return new Response(null, { status, headers });
  return new Response(Readable.toWeb(fs.createReadStream(full, { start, end })), { status, headers });
}
