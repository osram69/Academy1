// Accesso alla lavagna (Board Cube Academy) dal pannello /admin.
// Firma un link "https://<board>/b/<stanza>?t=<payload>.<firma>" nello stesso formato di
// ExcalidrawBoard/scripts/make-token.mjs: payload = base64url(JSON {room,name,uid,role,exp}),
// firma = HMAC-SHA256("board:" + payload) con BOARD_SECRET (uguale a quella della board), exp in ms.
import crypto from "node:crypto";

const ok = (body = {}) => ({ status: 200, body });
const fail = (status, error) => ({ status, body: { error } });

const ROOM = /^[A-Za-z0-9_-]{1,64}$/;

export function boardConfigured() {
  return !!(process.env.BOARD_SECRET && process.env.BOARD_URL);
}

/** Ore di validità del link (BOARD_TOKEN_HOURS, default 12, da 1 a 72). */
function tokenHours() {
  const h = Number(process.env.BOARD_TOKEN_HOURS);
  return Number.isFinite(h) && h >= 1 && h <= 72 ? h : 12;
}

/* ----- aule: la gestione sta sul server della board, il sito la chiama con una firma ----- */

/** Intestazione di gestione: firma di istante, metodo e indirizzo (stessa regola di ExcalidrawBoard/server/auth.ts), valida un minuto. */
export function signBoardAdmin(secret, method, target, now = Date.now()) {
  const ts = String(now);
  const sig = crypto.createHmac("sha256", secret).update(`boardadmin:${ts}:${method.toUpperCase()}:${target}`).digest("base64url");
  return `${ts}.${sig}`;
}

async function boardAdminCall(method, target, body, fetchImpl = fetch) {
  if (!boardConfigured()) return fail(503, "Board non configurata: imposta BOARD_SECRET e BOARD_URL nelle variabili del server.");
  const base = String(process.env.BOARD_URL).replace(/\/+$/, "");
  try {
    const r = await fetchImpl(`${base}${target}`, {
      method,
      headers: { Authorization: `Bearer ${signBoardAdmin(process.env.BOARD_SECRET, method, target)}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return fail(r.status === 401 ? 502 : r.status, r.status === 401 ? "La board ha rifiutato la richiesta: BOARD_SECRET diverso da quello della board?" : j.motivo || "Operazione non riuscita sulla board.");
    return ok(j);
  } catch {
    return fail(502, "La board non risponde: controlla che il Raspberry e il Funnel siano attivi.");
  }
}

const roomQuery = (name) => (ROOM.test(String(name || "")) ? `?room=${encodeURIComponent(name)}` : null);

/** Elenco delle aule. Il trainer non vede le password (le vede entrando nella board, dal pannello Invita). */
export async function listAule(ruolo, fetchImpl) {
  const r = await boardAdminCall("GET", "/auth/aule", undefined, fetchImpl);
  if (r.status !== 200) return r;
  const aule = (r.body.aule || []).map((a) => (ruolo === "trainer" ? { ...a, password: null } : a));
  return ok({ aule });
}
export const createAula = (body, fetchImpl) => boardAdminCall("POST", "/auth/aule", { name: body?.name, password: body?.password, ...(body?.until !== undefined ? { until: body.until } : {}) }, fetchImpl);
export function updateAula(name, body, fetchImpl) {
  const q = roomQuery(name);
  if (!q) return fail(400, "Nome non valido.");
  const patch = {};
  if (body?.password !== undefined) patch.password = body.password;
  if (body?.until !== undefined) patch.until = body.until;
  return boardAdminCall("PATCH", `/auth/aule${q}`, patch, fetchImpl);
}
export function deleteAula(name, fetchImpl) {
  const q = roomQuery(name);
  return q ? boardAdminCall("DELETE", `/auth/aule${q}`, undefined, fetchImpl) : fail(400, "Nome non valido.");
}

/** Link di accesso come trainer (editor) a una stanza della board. `email` è quella dell'amministratore già verificato. */
export function adminBoardLink(email, body) {
  if (!boardConfigured()) return fail(503, "Board non configurata: imposta BOARD_SECRET e BOARD_URL nelle variabili del server.");
  const room = String(body?.room || "").trim();
  if (!ROOM.test(room)) return fail(400, "Il nome può avere solo lettere, numeri, - e _ (massimo 64 caratteri).");

  const payload = Buffer.from(
    JSON.stringify({
      room,
      name: String(email).split("@")[0].slice(0, 60) || "Trainer",
      uid: String(email).replace(/[^\w.@-]/g, "_").slice(0, 64),
      role: "editor",
      exp: Date.now() + tokenHours() * 3600e3,
    }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", process.env.BOARD_SECRET).update(`board:${payload}`).digest("base64url");
  const base = String(process.env.BOARD_URL).replace(/\/+$/, "");
  return ok({ url: `${base}/b/${room}?t=${payload}.${sig}`, hours: tokenHours() });
}
