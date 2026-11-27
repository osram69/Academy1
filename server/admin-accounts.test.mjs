// Creazione e reimpostazione password degli utenti del pannello, con un finto client Supabase.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdminUser, resetAdminPassword } from "./admin-accounts.mjs";

/** Finto client: `rows` = contenuto di admin_emails, `authUsers` = utenti Supabase; `opts` per simulare errori. */
function fakeDb({ rows = [], authUsers = [], createError = null, insertError = null } = {}) {
  const calls = { createUser: [], deleteUser: [], updateUserById: [], inserted: [], listPages: [] };
  let nextId = 1;
  const db = {
    calls,
    rows,
    authUsers,
    from(table) {
      assert.equal(table, "admin_emails");
      return {
        select: () => ({
          order: async () => ({ data: rows, error: null }),
        }),
        insert: async (row) => {
          if (insertError) return { error: { message: insertError } };
          calls.inserted.push(row);
          rows.push(row);
          return { error: null };
        },
      };
    },
    auth: {
      admin: {
        async createUser(args) {
          calls.createUser.push(args);
          if (createError) return { data: { user: null }, error: { message: createError } };
          const user = { id: `id-${nextId++}`, email: args.email };
          authUsers.push(user);
          return { data: { user }, error: null };
        },
        async deleteUser(id) {
          calls.deleteUser.push(id);
          return { error: null };
        },
        async listUsers({ page = 1, perPage = 1000 } = {}) {
          calls.listPages.push(page);
          const slice = authUsers.slice((page - 1) * perPage, page * perPage);
          return { data: { users: slice }, error: null };
        },
        async updateUserById(id, attrs) {
          calls.updateUserById.push({ id, ...attrs });
          return { data: {}, error: null };
        },
      },
    },
  };
  return db;
}

test("rifiuta email non valida, livello superuser e livelli sconosciuti", async () => {
  const db = fakeDb();
  assert.equal((await createAdminUser(db, { email: "non-una-mail", ruolo: "trainer" })).status, 400);
  assert.equal((await createAdminUser(db, { email: "a@x.it", ruolo: "superuser" })).status, 403);
  assert.equal((await createAdminUser(db, { email: "a@x.it", ruolo: "boh" })).status, 400);
  assert.equal((await createAdminUser(db, { email: "a@x.it", ruolo: "trainer", password: "123456789" })).status, 400, "9 caratteri");
  assert.equal(db.calls.createUser.length, 0);
});

test("crea l'utente con la password scritta e assegna il livello", async () => {
  const db = fakeDb();
  const r = await createAdminUser(db, { email: " Nuovo@X.it ", ruolo: "trainer", password: "Provvisoria-1" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { email: "nuovo@x.it", ruolo: "trainer", created: true, password: "Provvisoria-1" });
  assert.equal(db.calls.createUser[0].email, "nuovo@x.it");
  assert.equal(db.calls.createUser[0].password, "Provvisoria-1");
  assert.equal(db.calls.createUser[0].email_confirm, true);
  assert.deepEqual(db.calls.inserted, [{ email: "nuovo@x.it", ruolo: "trainer" }]);
});

test("senza password ne genera una di 12 caratteri e la restituisce", async () => {
  const db = fakeDb();
  const r = await createAdminUser(db, { email: "gen@x.it", ruolo: "administrator" });
  assert.equal(r.status, 200);
  assert.equal(r.body.password.length, 12);
  assert.equal(db.calls.createUser[0].password, r.body.password);
});

test("utente Supabase già esistente: assegna solo il livello e non restituisce nessuna password", async () => {
  const db = fakeDb({ createError: "A user with this email address has already been registered" });
  const r = await createAdminUser(db, { email: "esiste@x.it", ruolo: "administrator", password: "Provvisoria-1" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { email: "esiste@x.it", ruolo: "administrator", created: false });
  assert.deepEqual(db.calls.inserted, [{ email: "esiste@x.it", ruolo: "administrator" }]);
});

test("email già tra gli amministratori: 409 e nessun utente creato", async () => {
  const db = fakeDb({ rows: [{ email: "gia@x.it", ruolo: "trainer" }] });
  const r = await createAdminUser(db, { email: "GIA@x.it", ruolo: "administrator", password: "Provvisoria-1" });
  assert.equal(r.status, 409);
  assert.equal(db.calls.createUser.length, 0);
});

test("se la scrittura in admin_emails fallisce, l'utente appena creato viene eliminato", async () => {
  const db = fakeDb({ insertError: "database non raggiungibile" });
  const r = await createAdminUser(db, { email: "orfano@x.it", ruolo: "trainer", password: "Provvisoria-1" });
  assert.equal(r.status, 500);
  assert.deepEqual(db.calls.deleteUser, ["id-1"]);
});

test("migrazione non eseguita (vincolo sul livello): messaggio comprensibile e utente appena creato eliminato", async () => {
  const db = fakeDb({ insertError: 'new row for relation "admin_emails" violates check constraint "admin_emails_ruolo_check"' });
  const r = await createAdminUser(db, { email: "migra@x.it", ruolo: "trainer", password: "Provvisoria-1" });
  assert.equal(r.status, 500);
  assert.match(r.body.error, /migrazione-9\.sql.*migrazione-10\.sql/);
  assert.deepEqual(db.calls.deleteUser, ["id-1"]);
});

test("reimposta la password di un administrator scorrendo le pagine degli utenti Supabase", async () => {
  const authUsers = Array.from({ length: 1001 }, (_, i) => ({ id: `u${i}`, email: `utente${i}@x.it` }));
  authUsers.push({ id: "cercato", email: "admin@x.it" });
  const db = fakeDb({ rows: [{ email: "admin@x.it", ruolo: "administrator" }], authUsers });
  const r = await resetAdminPassword(db, "Admin@X.it", { password: "Nuova-pass-12" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { email: "admin@x.it", password: "Nuova-pass-12" });
  assert.deepEqual(db.calls.updateUserById, [{ id: "cercato", password: "Nuova-pass-12" }]);
  assert.ok(db.calls.listPages.length >= 2, "ha letto più di una pagina");
});

test("reimpostare la password: superuser rifiutato (403), email sconosciuta 404, password troppo corta 400", async () => {
  const db = fakeDb({ rows: [{ email: "su@x.it", ruolo: "superuser" }, { email: "tr@x.it", ruolo: "trainer" }], authUsers: [{ id: "t1", email: "tr@x.it" }] });
  assert.equal((await resetAdminPassword(db, "su@x.it", {})).status, 403);
  assert.equal((await resetAdminPassword(db, "nessuno@x.it", {})).status, 404);
  assert.equal((await resetAdminPassword(db, "tr@x.it", { password: "corta" })).status, 400);
  assert.equal(db.calls.updateUserById.length, 0);
  const ok = await resetAdminPassword(db, "tr@x.it", {});
  assert.equal(ok.status, 200);
  assert.equal(ok.body.password.length, 12, "senza password ne genera una");
});
