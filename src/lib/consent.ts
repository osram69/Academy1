// Scelte dell'utente sui cookie (banner) e segnali Google Consent Mode v2 per l'eventuale Tag Manager.
// Le scelte restano nel browser per 6 mesi; il tracciamento si carica solo con il consenso corrispondente.

const KEY = "cube_academy_cookie_consent";
const MAX_AGE_MS = 183 * 86400000;
export const CONSENT_EVENT = "cookieConsentChanged";
export const OPEN_SETTINGS_EVENT = "cube-cookie-settings";

export type Consent = { necessary: true; analytics: boolean; marketing: boolean; savedAt?: number };
export const NO_CONSENT: Consent = { necessary: true, analytics: false, marketing: false };

declare global {
  interface Window { dataLayer?: unknown[] }
}

/** Scelta salvata e ancora valida (6 mesi), altrimenti null: il banner va mostrato. */
export function readConsent(): Consent | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null") as Consent | null;
    if (!saved || !saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) return null;
    return saved;
  } catch {
    return null;
  }
}

export function saveConsent(next: Consent): Consent {
  const value = { ...next, savedAt: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* memoria locale non disponibile */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  return value;
}

/** Riapre il pannello delle impostazioni cookie (footer, cookie policy). */
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));

/* ---- Google Consent Mode v2: valori iniziali negati, aggiornati dalla scelta dell'utente ---- */
function gtag(..._args: unknown[]) {
  (window.dataLayer = window.dataLayer || []).push(arguments); // Tag Manager richiede l'oggetto "arguments"
}

export function setConsentDefaults() {
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500 });
}

export function updateConsent(consent: Pick<Consent, "analytics" | "marketing"> | null | undefined) {
  const analytics = consent?.analytics ? "granted" : "denied";
  const marketing = consent?.marketing ? "granted" : "denied";
  gtag("consent", "update", { analytics_storage: analytics, ad_storage: marketing, ad_user_data: marketing, ad_personalization: marketing });
}
