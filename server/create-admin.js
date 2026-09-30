// Uso: node server/create-admin.js <username> <password>   (crea o aggiorna l'utente admin)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { q, pool, migrate } from "./db.js";

const [, , username, password] = process.argv;
if (!username || !password || password.length < 10) {
  console.error("Uso: node server/create-admin.js <username> <password (min 10 caratteri)>");
  process.exit(1);
}
await migrate();
const hash = await bcrypt.hash(password, 12);
await q(
  "INSERT INTO admin_users (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)",
  [username, hash]
);
console.log(`Utente "${username}" pronto.`);
await pool.end();
