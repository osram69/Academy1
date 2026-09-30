import mysql from "mysql2/promise";
import { parseItalianRange } from "./dates.js";

export const TABLE = process.env.CORSI_TABLE || "wp_corsi";
const ident = (s) => "`" + String(s).replace(/`/g, "") + "`";
export const T = ident(TABLE);

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  dateStrings: true, // datetime come stringhe, niente conversioni di fuso
  connectionLimit: 8,
});

export const q = async (sql, params = []) => (await pool.query(sql, params))[0];
export { ident };

async function hasColumn(col) {
  const r = await q(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [TABLE, col]
  );
  return r.length > 0;
}

/** Migrazioni idempotenti: nuove colonne sulla tabella corsi + tabella admin. */
export async function migrate() {
  const adds = [
    ["data_inizio", "DATE NULL"],
    ["data_fine", "DATE NULL"],
    ["posti_totali", "INT NULL"],
    ["posti_disponibili", "INT NULL"],
  ];
  for (const [col, def] of adds) {
    if (!(await hasColumn(col))) await q(`ALTER TABLE ${T} ADD COLUMN ${ident(col)} ${def}`);
  }

  await q(`CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) DEFAULT CHARSET=utf8mb4`);

  // backfill date strutturate dal testo "Data-IT" (solo dove mancano)
  const rows = await q(`SELECT id_corso, \`Data-IT\` AS d, early_bird_end AS eb FROM ${T} WHERE data_inizio IS NULL`);
  for (const r of rows) {
    const y = String(r.eb || "").slice(0, 4);
    const p = parseItalianRange(r.d, /^20\d{2}$/.test(y) ? y : String(new Date().getFullYear()));
    if (p) await q(`UPDATE ${T} SET data_inizio = ?, data_fine = ? WHERE id_corso = ?`, [p.start, p.end, r.id_corso]);
  }
}
