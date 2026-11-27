import assert from "node:assert/strict";
import { test } from "node:test";
import { generatePassword } from "./password.mjs";

test("la password generata ha 8 caratteri con maiuscola, minuscola, cifra e simbolo, senza caratteri ambigui", () => {
  for (let i = 0; i < 500; i++) {
    const p = generatePassword();
    assert.equal(p.length, 8);
    assert.match(p, /[A-Z]/);
    assert.match(p, /[a-z]/);
    assert.match(p, /[0-9]/);
    assert.match(p, /[!@#$%&*?]/);
    assert.doesNotMatch(p, /[IlO01]/);
  }
});

test("la lunghezza richiesta è rispettata", () => {
  assert.equal(generatePassword(12).length, 12);
});

test("password generate in sequenza sono diverse", () => {
  const set = new Set(Array.from({ length: 50 }, () => generatePassword()));
  assert.equal(set.size, 50);
});
