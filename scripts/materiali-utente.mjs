#!/usr/bin/env node
// Gestione degli utenti dell'area /materiali (scrive <MATERIALI_DIR>/_config/users.json).
//   node --env-file=.env scripts/materiali-utente.mjs aggiungi <utente> <cartella[,cartella…]|*> [studente|trainer] [password]
//   node --env-file=.env scripts/materiali-utente.mjs password <utente> [password]
//   node --env-file=.env scripts/materiali-utente.mjs rimuovi <utente>
//   node --env-file=.env scripts/materiali-utente.mjs elenco
// Senza password ne genera una casuale e la stampa (una volta sola). Le password sono salvate come hash.
// In locale: imposta MATERIALI_DIR su una cartella di prova e poi carica users.json via FTP in <cartella dati>/_config/.
import crypto from "node:crypto";
import { dataDir, hashPassword, readUsers, usersFile, writeUsers } from "../server/materiali.mjs";

const [cmd, user, a3, a4, a5] = process.argv.slice(2);
const users = readUsers();
const die = (m) => {
  console.error(m);
  process.exit(1);
};
const rnd = () => crypto.randomBytes(9).toString("base64url");

if (cmd === "aggiungi") {
  if (!user || !a3) die("Uso: aggiungi <utente> <cartella[,cartella…]|*> [studente|trainer] [password]");
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(user)) die("Utente: 3-40 caratteri tra lettere, numeri, . _ -");
  const role = a4 === "trainer" ? "trainer" : "studente";
  const pw = a5 || rnd();
  users[user] = { hash: hashPassword(pw), folders: a3 === "*" ? ["*"] : a3.split(",").map((s) => s.trim()).filter(Boolean), role };
  writeUsers(users);
  console.log(`Utente "${user}" (${role}) salvato in ${usersFile()}`);
  if (!a5) console.log(`Password generata: ${pw}`);
} else if (cmd === "password") {
  if (!users[user]) die("Utente inesistente.");
  const pw = a3 || rnd();
  users[user].hash = hashPassword(pw);
  writeUsers(users);
  console.log(`Password aggiornata per "${user}".`);
  if (!a3) console.log(`Nuova password: ${pw}`);
} else if (cmd === "rimuovi") {
  if (!users[user]) die("Utente inesistente.");
  delete users[user];
  writeUsers(users);
  console.log(`Utente "${user}" rimosso.`);
} else if (cmd === "elenco") {
  console.log(`Cartella dati: ${dataDir()}`);
  for (const [n, u] of Object.entries(users)) console.log(`${n}\t${u.role || "studente"}\t${(u.folders || []).join(", ")}`);
  if (!Object.keys(users).length) console.log("Nessun utente.");
} else {
  die("Comandi: aggiungi | password | rimuovi | elenco");
}
