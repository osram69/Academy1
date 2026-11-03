// Eventi di misurazione per Google Tag Manager / GA4 / Google Ads (dataLayer).
// Partono solo con NEXT_PUBLIC_GTM_ID impostato e dopo il consenso agli analitici: senza, non succede nulla.
// I nomi seguono gli eventi consigliati di GA4: view_item, begin_checkout, generate_lead, purchase.
import { readConsent } from "./consent";
import { VAT } from "../../shared/pricing.mjs";

type Params = Record<string, unknown>;

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GTM_ID) return;
  if (!readConsent()?.analytics) return;
  (window.dataLayer = window.dataLayer || []).push({ event, ...params });
}

/** Come `track`, ma una sola volta per sessione per la stessa chiave (es. il riferimento ordine): una ricarica della pagina non raddoppia la conversione. */
export function trackOnce(key: string, event: string, params: Params = {}) {
  try {
    if (sessionStorage.getItem(`tracked:${key}`)) return;
    sessionStorage.setItem(`tracked:${key}`, "1");
  } catch {
    /* memoria di sessione non disponibile: si traccia comunque */
  }
  track(event, params);
}

/** Voce "item" di GA4 per un'edizione di corso. */
export const courseItem = (course: { id: number; short: string; format: string }, price: number, quantity = 1) => ({
  item_id: String(course.id),
  item_name: course.short,
  item_category: course.format,
  price,
  quantity,
});

/** Importo IVA esclusa a partire dal totale IVA inclusa (le conversioni si misurano sul netto). */
export const netOfVat = (totalWithVat: number) => Math.round((totalWithVat / (1 + VAT)) * 100) / 100;
