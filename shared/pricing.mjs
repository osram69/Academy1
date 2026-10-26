// Calcolo prezzi condiviso da server e browser. Tutti gli importi sono in centesimi.
//
// Regole (come da richiesta Cube Academy):
//  - Early Bird: sconto fisso = listino - prezzo early bird (se la finestra è attiva).
//  - Privati (persona fisica, senza P.IVA): privatePct% sul PREZZO DI LISTINO, in aggiunta all'early bird.
//  - Codici sconto: couponPct% sul prezzo già scontato early bird (come nel plugin WordPress).
//  - Privato e codice non si sommano: vale la combinazione più conveniente per il cliente.
export const MAX_SEATS = 12; // limite iSAQB: 12 partecipanti per corso con un solo docente
export const VAT = 0.22;

/**
 * @param {{listEuro:number, earlyEuro:number|null, seats:number, billingType:string, privatePct:number, couponPct:number, couponCode?:string|null}} p
 */
export function computeTotals({ listEuro, earlyEuro, seats, billingType, privatePct = 0, couponPct = 0, couponCode = null }) {
  const list = Math.round(listEuro * 100);
  const early = earlyEuro != null && earlyEuro > 0 && earlyEuro < listEuro ? Math.round(earlyEuro * 100) : list;
  const gross = list * seats;
  const earlyDiscount = (list - early) * seats;

  // A) sconto privati sul listino + early bird
  const privDiscount = billingType === "privato" && privatePct > 0 ? earlyDiscount + Math.round(gross * privatePct) : 0;
  // B) codice sconto sul prezzo early bird
  const couponDiscount = couponPct > 0 ? earlyDiscount + Math.round(early * seats * couponPct) : 0;

  let discount = earlyDiscount;
  let applied = null;
  if (privDiscount > discount && privDiscount >= couponDiscount) { discount = privDiscount; applied = "PRIVATO"; }
  else if (couponDiscount > discount) { discount = couponDiscount; applied = couponCode; }
  discount = Math.min(discount, gross);

  const net = gross - discount;
  const vat = Math.round(net * VAT);
  return { unit_cents: list, subtotal_cents: gross, discount_cents: discount, vat_cents: vat, total_cents: net + vat, applied, early_active: early < list };
}

/** Prezzo early bird se la finestra è attiva, altrimenti null. `c` = riga corsi/corsi_public. */
export function earlyPriceEuro(c, now = new Date()) {
  const list = c.standard_price ?? 0;
  const start = c.early_bird_start ? new Date(c.early_bird_start) : new Date(0);
  const end = c.early_bird_end ? new Date(c.early_bird_end) : new Date(0);
  if (!(now >= start && now < end) || c.stato === 5) return null;
  const pct = Number(c.early_bird_percentuale) / 100;
  const p = c.early_bird_price ?? (pct > 0 ? Math.round(list * (1 - pct)) : null);
  return p != null && p < list ? p : null;
}
