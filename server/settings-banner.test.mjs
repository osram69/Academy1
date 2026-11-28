import assert from "node:assert/strict";
import { test } from "node:test";
import { activePromo, normalize } from "./settings.mjs";

const coupon = (o = {}) => ({ code: "NATALE", percent: 10, ...o });
const norm = (...coupons) => normalize({ coupons });
const day = (s) => new Date(`${s}T12:00:00Z`);

test("normalize: i codici vecchi, senza banner, restano senza banner e con testi vuoti", () => {
  const [c] = norm(coupon()).coupons;
  assert.equal(c.banner, false);
  assert.deepEqual(c.bannerText, { it: "", en: "", fr: "", de: "" });
});

test("normalize: il testo del banner è semplice testo su una riga, al massimo 200 caratteri", () => {
  const [c] = norm(coupon({ banner: true, bannerText: { it: "  -10%\n<b>subito</b>\t ", en: "x".repeat(500), fr: 42, de: null, xx: "ignorata" } })).coupons;
  assert.equal(c.bannerText.it, "-10% b subito /b", "tag e a capo diventano spazi");
  assert.ok(!/[<>]/.test(c.bannerText.it));
  assert.equal(c.bannerText.en.length, 200);
  assert.equal(c.bannerText.fr, "42");
  assert.equal(c.bannerText.de, "");
  assert.equal("xx" in c.bannerText, false);
});

test("activePromo: nulla se nessun codice ha il banner", () => {
  assert.equal(activePromo(norm(coupon())), null);
});

test("activePromo: il banner compare solo se il codice è acceso e nel periodo (estremi inclusi)", () => {
  const s = (o) => norm(coupon({ banner: true, ...o }));
  assert.equal(activePromo(s({}), day("2026-12-01"))?.code, "NATALE", "senza date vale sempre");
  assert.equal(activePromo(s({ enabled: false }), day("2026-12-01")), null, "codice spento");
  assert.equal(activePromo(s({ start: "2026-12-10" }), day("2026-12-09")), null, "non ancora iniziato");
  assert.equal(activePromo(s({ start: "2026-12-10" }), day("2026-12-10"))?.code, "NATALE", "primo giorno incluso");
  assert.equal(activePromo(s({ end: "2026-12-24" }), day("2026-12-24"))?.code, "NATALE", "ultimo giorno incluso");
  assert.equal(activePromo(s({ end: "2026-12-24" }), day("2026-12-25")), null, "scaduto");
});

test("activePromo: restituisce codice, percentuale, testi e scadenza; con più banner vale il primo in corso", () => {
  const s = norm(
    coupon({ code: "VECCHIO", banner: true, end: "2026-01-31" }),
    coupon({ code: "NATALE", percent: 15, banner: true, end: "2026-12-24", bannerText: { it: "Natale -15%", en: "Xmas -15%" } }),
    coupon({ code: "ALTRO", banner: true }),
  );
  const p = activePromo(s, day("2026-12-02"));
  assert.deepEqual([p.code, p.percent, p.until, p.text.it, p.text.en, p.text.fr], ["NATALE", 15, "2026-12-24", "Natale -15%", "Xmas -15%", ""]);
});
