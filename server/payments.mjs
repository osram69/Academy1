// Provider di pagamento. Stessi nomi di variabili d'ambiente usati da romaofficesharing:
// <NOME> per il live, <NOME>_TEST per la sandbox. Il modo è scelto da PAYMENTS_TEST_MODE (default: true).
import Stripe from "stripe";

const env = (name, test) => (test ? process.env[`${name}_TEST`] : process.env[name]);

export const stripeSecret = (t) => env("STRIPE_SECRET", t);
export const stripeWebhookSecret = (t) => env("STRIPE_WEBHOOK_SECRET", t);
export const paypalCreds = (t) => ({
  clientId: env("PAYPAL_CLIENT_ID", t),
  secret: env("PAYPAL_SECRET", t),
  webhookId: env("PAYPAL_WEBHOOK_ID", t),
  api: t ? "https://api-m.sandbox.paypal.com" : process.env.PAYPAL_API_URL || "https://api-m.paypal.com",
});
export const sumupCreds = (t) => ({
  apiKey: env("SUMUP_API_KEY", t),
  merchantCode: env("SUMUP_MERCHANT_CODE", t),
  api: process.env.SUMUP_API_URL || "https://api.sumup.com",
});
export const bankDetails = () => ({
  holder: process.env.BANK_HOLDER || "Cube Engineering S.r.l.",
  iban: process.env.BANK_IBAN || "",
  bank: process.env.BANK_NAME || "",
  bic: process.env.BANK_BIC || "",
});

/** Nomi delle variabili d'ambiente richieste per ogni metodo (sandbox / live). */
const REQUIRED = {
  stripe: (t) => [t ? "STRIPE_SECRET_TEST" : "STRIPE_SECRET"],
  paypal: (t) => (t ? ["PAYPAL_CLIENT_ID_TEST", "PAYPAL_SECRET_TEST"] : ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET"]),
  sumup: (t) => (t ? ["SUMUP_API_KEY_TEST", "SUMUP_MERCHANT_CODE_TEST"] : ["SUMUP_API_KEY", "SUMUP_MERCHANT_CODE"]),
  bonifico: () => ["BANK_IBAN"],
};

/** Stato di ogni metodo: abilitato dal pannello, chiavi presenti, modalità sandbox. */
export function methodStatus(settings) {
  const out = {};
  for (const id of Object.keys(REQUIRED)) {
    const cfg = settings.methods[id];
    const sandbox = id === "bonifico" ? false : cfg.sandbox;
    const missing = REQUIRED[id](sandbox).filter((n) => !process.env[n]);
    out[id] = { enabled: cfg.enabled, sandbox, configured: missing.length === 0, missing, available: cfg.enabled && missing.length === 0 };
  }
  return out;
}

// Tutti i provider tornano su una rotta server che verifica il pagamento e poi reindirizza alla SPA.
export async function createSession({ provider, order, description, email, origin }) {
  const back = (ref, prov, outcome) => `${origin}/pagamento/ritorno?ref=${encodeURIComponent(ref)}&provider=${prov}&outcome=${outcome}`;
  const t = order.test_mode;
  if (provider === "stripe") {
    const stripe = new Stripe(stripeSecret(t));
    const s = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email || undefined,
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: order.total_cents, product_data: { name: description } } }],
      metadata: { ref: order.ref },
      success_url: `${back(order.ref, "stripe", "return")}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: back(order.ref, "stripe", "cancel"),
    });
    return { url: s.url, providerRef: s.id };
  }
  if (provider === "paypal") {
    const { clientId, secret, api } = paypalCreds(t);
    const token = await paypalToken(api, clientId, secret);
    const r = await fetch(`${api}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ description: description.slice(0, 127), custom_id: order.ref, amount: { currency_code: "EUR", value: (order.total_cents / 100).toFixed(2) } }],
        application_context: { brand_name: "Cube Academy", user_action: "PAY_NOW", return_url: back(order.ref, "paypal", "return"), cancel_url: back(order.ref, "paypal", "cancel") },
      }),
    });
    const o = await r.json();
    const url = o?.links?.find((l) => l.rel === "approve")?.href;
    if (!url) throw new Error("PayPal: link di approvazione mancante");
    return { url, providerRef: o.id };
  }
  if (provider === "sumup") {
    const { apiKey, merchantCode, api } = sumupCreds(t);
    const r = await fetch(`${api}/v0.1/checkouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number((order.total_cents / 100).toFixed(2)),
        currency: "EUR",
        checkout_reference: order.ref,
        description,
        merchant_code: merchantCode,
        redirect_url: back(order.ref, "sumup", "return"),
        hosted_checkout: { enabled: true },
      }),
    });
    const c = await r.json();
    if (!r.ok) throw new Error(c?.message || "SumUp: checkout non creato");
    const url = c.hosted_checkout_url || c.redirect_url;
    if (!url) throw new Error("SumUp: URL del checkout mancante");
    return { url, providerRef: c.id };
  }
  throw new Error("Metodo non supportato");
}

async function paypalToken(api, clientId, secret) {
  const r = await fetch(`${api}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("PayPal: token non ottenuto");
  return j.access_token;
}

/** Interroga il provider (fonte autorevole) e restituisce true solo se l'importo risulta pagato. */
export async function isPaid(order) {
  const t = order.test_mode;
  try {
    if (order.method === "stripe") {
      if (!order.provider_ref) return false;
      const s = await new Stripe(stripeSecret(t)).checkout.sessions.retrieve(order.provider_ref);
      return s.payment_status === "paid" && s.amount_total === order.total_cents && s.metadata?.ref === order.ref;
    }
    if (order.method === "paypal") {
      const { clientId, secret, api } = paypalCreds(t);
      const token = await paypalToken(api, clientId, secret);
      const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      let o = await (await fetch(`${api}/v2/checkout/orders/${order.provider_ref}`, { headers: h })).json();
      if (o.status === "APPROVED") o = await (await fetch(`${api}/v2/checkout/orders/${order.provider_ref}/capture`, { method: "POST", headers: h })).json();
      const cap = o?.purchase_units?.[0]?.payments?.captures?.[0];
      return o.status === "COMPLETED" && cap?.status === "COMPLETED" && cap?.amount?.currency_code === "EUR"
        && Math.round(Number(cap.amount.value) * 100) === order.total_cents;
    }
    if (order.method === "sumup") {
      const { apiKey, api } = sumupCreds(t);
      const c = await (await fetch(`${api}/v0.1/checkouts/${order.provider_ref}`, { headers: { Authorization: `Bearer ${apiKey}` } })).json();
      return c.status === "PAID" && Math.round(Number(c.amount) * 100) === order.total_cents;
    }
  } catch (e) {
    console.error("isPaid", order.ref, e.message);
  }
  return false;
}

export async function paypalVerifyWebhook(t, headers, event) {
  const { clientId, secret, webhookId, api } = paypalCreds(t);
  if (!webhookId) return false;
  const token = await paypalToken(api, clientId, secret);
  const r = await fetch(`${api}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"], cert_url: headers["paypal-cert-url"], transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"], transmission_time: headers["paypal-transmission-time"], webhook_id: webhookId, webhook_event: event,
    }),
  });
  return (await r.json()).verification_status === "SUCCESS";
}

export const stripeClient = (t) => new Stripe(stripeSecret(t));
