// Utenti di /materiali: password visibile (in chiaro) per il trainer, minimo 8 caratteri, ruolo e dati vecchi preservati.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

process.env.MATERIALI_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "materiali-test-"));
process.env.MATERIALI_SESSION_SECRET = "segreto-di-prova";
const m = await import("./materiali.mjs");

const find = (username) => m.listUsers().find((u) => u.username === username);

test("crea un utente con solo nome utente, password e cartelle: entra, vede solo quelle cartelle, la password si rilegge", () => {
  const r = m.createUser({ username: "cpsa-dic26", password: "abcd1234", folders: ["CPSA-F_Dic26"] });
  assert.deepEqual(r, { username: "cpsa-dic26", generated: false });
  const l = m.login("cpsa-dic26", "abcd1234", "ip-uno");
  assert.ok(l.token, "il login deve riuscire");
  const u = m.userFromToken(l.token);
  assert.equal(u.role, "studente");
  assert.deepEqual(u.folders, ["CPSA-F_Dic26"]);
  assert.equal(find("cpsa-dic26").password, "abcd1234");
});

test("password troppo corta o troppo lunga e nomi utente non validi sono rifiutati", () => {
  assert.ok(m.createUser({ username: "corta-pw", password: "abc1234" }).error, "7 caratteri");
  assert.ok(m.createUser({ username: "lunga-pw", password: "a".repeat(201) }).error, "201 caratteri");
  assert.ok(m.createUser({ username: "ab", password: "abcd1234" }).error, "nome troppo corto");
  assert.ok(m.createUser({ username: "con spazi", password: "abcd1234" }).error, "nome con spazi");
  assert.equal(find("corta-pw"), undefined);
});

test("un nome utente già usato (anche con maiuscole diverse) è rifiutato e non cambia nulla", () => {
  assert.ok(m.createUser({ username: "Doppio-Nome", password: "abcd1234", folders: ["A"] }).username);
  const before = m.listUsers().length;
  assert.ok(m.createUser({ username: "doppio-nome", password: "altra-pass1", folders: ["B"] }).error);
  assert.equal(m.listUsers().length, before);
  assert.deepEqual(find("Doppio-Nome").folders, ["A"]);
  assert.equal(find("Doppio-Nome").password, "abcd1234");
});

test("cambiare la password chiude le sessioni già aperte e aggiorna la password visibile", () => {
  m.createUser({ username: "cambio-pw", password: "vecchia-pw1", folders: ["A"] });
  const old = m.login("cambio-pw", "vecchia-pw1", "ip-due").token;
  assert.ok(m.userFromToken(old));
  assert.deepEqual(m.updateUser("cambio-pw", { password: "nuova-pw99", folders: ["A", "B"] }), { username: "cambio-pw" });
  assert.equal(m.userFromToken(old), null, "la sessione con la vecchia password non vale più");
  assert.ok(m.login("cambio-pw", "nuova-pw99", "ip-due").token);
  assert.equal(m.login("cambio-pw", "vecchia-pw1", "ip-tre").error, "bad");
  assert.equal(find("cambio-pw").password, "nuova-pw99");
  assert.deepEqual(find("cambio-pw").folders, ["A", "B"]);
});

test("modificare un account vecchio dal nuovo modulo non ne cambia ruolo, email e nome", () => {
  const users = m.readUsers();
  users.legacy = { hash: m.hashPassword("password-vecchia"), email: "trainer@esempio.it", name: "Trainer Uno", role: "trainer", folders: ["*"] };
  m.writeUsers(users);
  assert.equal(find("legacy").password, "", "senza password in chiaro salvata");
  assert.ok(m.login("legacy", "password-vecchia", "ip-quattro").token, "continua a entrare");
  assert.deepEqual(m.updateUser("legacy", { password: "password-nuova", folders: ["CORSO-X"] }), { username: "legacy" });
  const u = m.readUsers().legacy;
  assert.equal(u.role, "trainer");
  assert.equal(u.email, "trainer@esempio.it");
  assert.equal(u.name, "Trainer Uno");
  assert.deepEqual(u.folders, ["CORSO-X"]);
  assert.equal(find("legacy").password, "password-nuova");
});

test("modificare solo le cartelle lascia password e password visibile come sono", () => {
  m.createUser({ username: "solo-cartelle", password: "abcd1234", folders: ["A"] });
  assert.deepEqual(m.updateUser("solo-cartelle", { folders: ["B"] }), { username: "solo-cartelle" });
  assert.ok(m.login("solo-cartelle", "abcd1234", "ip-cinque").token);
  assert.equal(find("solo-cartelle").password, "abcd1234");
  assert.deepEqual(find("solo-cartelle").folders, ["B"]);
});

test("users.json ha permessi riservati al proprietario (dove il sistema li supporta)", { skip: process.platform === "win32" }, () => {
  assert.equal(fs.statSync(m.usersFile()).mode & 0o777, 0o600);
});
