// Calcolo prezzi lato server: il browser non decide mai l'importo.
export const MAX_SEATS = 12; // limite iSAQB per corso con un solo docente
export const VAT = 0.22;

export function unitPriceEuro(c, now = new Date()) {
  const price = c.standard_price ?? 0;
  const pct = Number(c.early_bird_percentuale) / 100;
  const start = c.early_bird_start ? new Date(c.early_bird_start) : new Date(0);
  const end = c.early_bird_end ? new Date(c.early_bird_end) : new Date(0);
  const active = now >= start && now < end && (pct > 0 || c.early_bird_price) && c.stato !== 5;
  if (!active) return price;
  return c.early_bird_price ?? Math.round(price * (1 - pct));
}

export function findCoupon(c, code, now = new Date()) {
  const wanted = String(code || "").trim().toUpperCase();
  if (!wanted) return null;
  for (const i of [1, 2, 3]) {
    const cd = c[`codice_sconto_${i}`];
    if (!cd || cd.toUpperCase() !== wanted) continue;
    const from = c[`codice_sconto_${i}_data_inizio`];
    const to = c[`codice_sconto_${i}_data_fine`];
    if (from && now < new Date(from)) continue;
    if (to && now > new Date(to)) continue;
    const pct = Number(c[`codice_sconto_${i}_percentuale`]);
    if (pct > 0 && pct <= 100) return { code: cd.toUpperCase(), pct: pct / 100 };
  }
  return null;
}

export function computeTotals(c, seats, coupon) {
  const unit = Math.round(unitPriceEuro(c) * 100);
  const subtotal = unit * seats;
  const discount = coupon ? Math.round(subtotal * coupon.pct) : 0;
  const net = subtotal - discount;
  const vat = Math.round(net * VAT);
  return { unit_cents: unit, subtotal_cents: subtotal, discount_cents: discount, vat_cents: vat, total_cents: net + vat };
}
