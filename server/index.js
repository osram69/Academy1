import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool, q, T, ident, migrate } from "./db.js";
import { COLUMNS, coerce } from "./columns.js";
import { toPublic, PUBLIC_STATES } from "./public.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 16) {
  console.error("JWT_SECRET mancante o troppo corto (min 16 caratteri). Vedi .env.example");
  process.exit(1);
}
const COOKIE = "cube_admin";
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // dietro il proxy di Hostinger
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

/* ------------------------------ API pubblica ----------------------------- */

app.get("/api/corsi", async (_req, res, next) => {
  try {
    const rows = await q(
      `SELECT * FROM ${T} WHERE stato IN (?) ORDER BY data_inizio IS NULL, data_inizio ASC, id_corso ASC`,
      [PUBLIC_STATES]
    );
    res.set("Cache-Control", "public, max-age=60");
    res.json(rows.map(toPublic));
  } catch (e) {
    next(e);
  }
});

/* ------------------------------- auth admin ------------------------------ */

// Difesa CSRF aggiuntiva a SameSite=Strict: le richieste che modificano dati devono
// portare un header custom, che un form cross-site non può impostare.
app.use("/api/admin", (req, res, next) =>
  req.method === "GET" || req.get("X-Requested-With") === "cube"
    ? next()
    : res.status(403).json({ error: "Richiesta non valida." })
);

const attempts = new Map(); // ip -> {n, t}  (limite tentativi login, in memoria)
function limited(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now - a.t > 15 * 60_000) {
    attempts.set(ip, { n: 1, t: now });
    return false;
  }
  a.n++;
  return a.n > 10;
}

const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

app.post("/api/admin/login", async (req, res, next) => {
  try {
    if (limited(req.ip)) return res.status(429).json({ error: "Troppi tentativi, riprova tra 15 minuti." });
    const { username, password } = req.body || {};
    const [u] = await q("SELECT * FROM admin_users WHERE username = ?", [String(username || "")]);
    // il confronto viene eseguito sempre, per non rivelare se l'utente esiste
    const ok = await bcrypt.compare(String(password || ""), u?.password_hash || DUMMY_HASH);
    if (!u || !ok) return res.status(401).json({ error: "Credenziali non valide." });
    attempts.delete(req.ip);
    const token = jwt.sign({ uid: u.id, u: u.username }, SECRET, { expiresIn: "8h" });
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: "strict", secure: isProd, maxAge: 8 * 3600_000, path: "/" });
    res.json({ username: u.username });
  } catch (e) {
    next(e);
  }
});

app.post("/api/admin/logout", (_req, res) => {
  res.clearCookie(COOKIE, { path: "/" });
  res.json({ ok: true });
});

function requireAdmin(req, res, next) {
  try {
    req.admin = jwt.verify(req.cookies[COOKIE] || "", SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Non autenticato." });
  }
}

app.get("/api/admin/me", requireAdmin, (req, res) => res.json({ username: req.admin.u }));

/* ------------------------------ CRUD corsi ------------------------------- */

function fromBody(body, { partial = false } = {}) {
  const data = {};
  const errors = {};
  for (const col of COLUMNS) {
    if (!(col.name in body)) {
      if (!partial) {
        const r = coerce(col, undefined);
        if (r.ok) data[col.name] = r.value;
      }
      continue;
    }
    const r = coerce(col, body[col.name]);
    if (r.ok) data[col.name] = r.value;
    else errors[col.name] = r.error;
  }
  if (!partial && !String(data.Titolo || "").trim()) errors.Titolo = "il titolo è obbligatorio";
  return { data, errors };
}

const insertRow = async (data) => {
  const cols = Object.keys(data);
  const [r] = await pool.query(
    `INSERT INTO ${T} (${cols.map(ident).join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
    cols.map((c) => data[c])
  );
  return r.insertId;
};

app.get("/api/admin/corsi", requireAdmin, async (_req, res, next) => {
  try {
    res.json(
      await q(
        `SELECT id_corso, Titolo, Livello, stato, in_evidenza, iscrizioni_aperte, \`Data-IT\`, data_inizio, data_fine FROM ${T} ORDER BY id_corso DESC`
      )
    );
  } catch (e) {
    next(e);
  }
});

app.get("/api/admin/corsi/:id", requireAdmin, async (req, res, next) => {
  try {
    const [row] = await q(`SELECT * FROM ${T} WHERE id_corso = ?`, [Number(req.params.id)]);
    row ? res.json(row) : res.status(404).json({ error: "Corso non trovato." });
  } catch (e) {
    next(e);
  }
});

app.post("/api/admin/corsi", requireAdmin, async (req, res, next) => {
  try {
    const { data, errors } = fromBody(req.body || {});
    if (Object.keys(errors).length) return res.status(422).json({ errors });
    res.status(201).json({ id_corso: await insertRow(data) });
  } catch (e) {
    next(e);
  }
});

app.put("/api/admin/corsi/:id", requireAdmin, async (req, res, next) => {
  try {
    const { data, errors } = fromBody(req.body || {}, { partial: true });
    if (Object.keys(errors).length) return res.status(422).json({ errors });
    const cols = Object.keys(data);
    if (!cols.length) return res.status(400).json({ error: "Nessun campo da aggiornare." });
    const [r] = await pool.query(
      `UPDATE ${T} SET ${cols.map((c) => ident(c) + " = ?").join(", ")} WHERE id_corso = ?`,
      [...cols.map((c) => data[c]), Number(req.params.id)]
    );
    r.affectedRows ? res.json({ ok: true }) : res.status(404).json({ error: "Corso non trovato." });
  } catch (e) {
    next(e);
  }
});

app.post("/api/admin/corsi/:id/toggle", requireAdmin, async (req, res, next) => {
  try {
    await q(`UPDATE ${T} SET iscrizioni_aperte = 1 - iscrizioni_aperte WHERE id_corso = ?`, [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.post("/api/admin/corsi/:id/duplicate", requireAdmin, async (req, res, next) => {
  try {
    const [row] = await q(`SELECT * FROM ${T} WHERE id_corso = ?`, [Number(req.params.id)]);
    if (!row) return res.status(404).json({ error: "Corso non trovato." });
    delete row.id_corso;
    res.status(201).json({ id_corso: await insertRow(row) });
  } catch (e) {
    next(e);
  }
});

app.delete("/api/admin/corsi/:id", requireAdmin, async (req, res, next) => {
  try {
    const [r] = await pool.query(`DELETE FROM ${T} WHERE id_corso = ?`, [Number(req.params.id)]);
    r.affectedRows ? res.json({ ok: true }) : res.status(404).json({ error: "Corso non trovato." });
  } catch (e) {
    next(e);
  }
});

/* ------------------------- frontend statico (prod) ----------------------- */

const dist = path.resolve(__dirname, "../dist");
app.use(express.static(dist));
app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Errore interno del server." });
});

await migrate();
const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`Cube Academy in ascolto su :${port}`));
