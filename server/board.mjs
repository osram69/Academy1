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
