import assert from "node:assert/strict";
import crypto from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";
import { createAula, deleteAula, listAule, signBoardAdmin, updateAula } from "./board.mjs";

const saved = { s: process.env.BOARD_SECRET, u: process.env.BOARD_URL };
beforeEach(() => {
  process.env.BOARD_SECRET = "segreto-di-prova";
  process.env.BOARD_URL = "https://board.example/";
});
afterEach(() => {
  process.env.BOARD_SECRET = saved.s;
  process.env.BOARD_URL = saved.u;
  if (saved.s === undefined) delete process.env.BOARD_SECRET;
  if (saved.u === undefined) delete process.env.BOARD_URL;
});

const reply = (status, body) => async (url, init) => {
  reply.last = { url, init };
  return new Response(JSON.stringify(body), { status });
};

test("signBoardAdmin: stessa formula del server della board (istante, metodo maiuscolo, indirizzo)", () => {
  const sig = signBoardAdmin("k", "get", "/auth/aule", 1_700_000_000_000);
  const expected = crypto.createHmac("sha256", "k").update("boardadmin:1700000000000:GET:/auth/aule").digest("base64url");
  assert.equal(sig, `1700000000000.${expected}`);
});

test("listAule: chiama la board con la firma e toglie le password ai trainer", async () => {
  const aule = [{ name: "a", password: "segreta12", active: true }];
  const f = reply(200, { ok: true, aule });
  const adm = await listAule("administrator", f);
  assert.equal(adm.body.aule[0].password, "segreta12");
  assert.equal(reply.last.url, "https://board.example/auth/aule");
  assert.match(reply.last.init.headers.Authorization, /^Bearer \d+\./);
  const tr = await listAule("trainer", f);
  assert.equal(tr.body.aule[0].password, null);
  assert.equal(aule[0].password, "segreta12", "i dati originali non si modificano");
});

test("create/update/delete: inoltrano solo i campi previsti e rifiutano nomi non validi senza chiamare la board", async () => {
  const f = reply(200, { ok: true });
  await createAula({ name: "x", password: "pw123456", until: null, extra: "no" }, f);
  assert.deepEqual(JSON.parse(reply.last.init.body), { name: "x", password: "pw123456", until: null });
  await updateAula("x", { until: 5, evil: 1 }, f);
  assert.equal(reply.last.url, "https://board.example/auth/aule?room=x");
  assert.deepEqual(JSON.parse(reply.last.init.body), { until: 5 });
  reply.last = null;
  assert.equal((await deleteAula("../x", f)).status, 400);
  assert.equal((await updateAula("", {}, f)).status, 400);
  assert.equal(reply.last, null, "nessuna chiamata");
});

test("errori della board: il messaggio passa; 401 diventa un'indicazione sul segreto; board spenta = 502", async () => {
  const e = await createAula({ name: "x", password: "pw123456" }, reply(409, { ok: false, motivo: "Esiste già una board con questo nome." }));
  assert.deepEqual([e.status, e.body.error], [409, "Esiste già una board con questo nome."]);
  const u = await listAule("administrator", reply(401, { ok: false, motivo: "Firma non valida o scaduta." }));
  assert.equal(u.status, 502);
  assert.match(u.body.error, /BOARD_SECRET/);
  const down = await listAule("administrator", async () => {
    throw new Error("ECONNREFUSED");
  });
  assert.equal(down.status, 502);
  delete process.env.BOARD_URL;
  assert.equal((await listAule("administrator", reply(200, {}))).status, 503);
});
