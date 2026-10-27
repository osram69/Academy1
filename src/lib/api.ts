// Client delle API del server Node (vedi server/index.mjs).
import { t } from "../i18n";

export interface BankDetails { holder: string; iban: string; bank: string; bic: string }
export interface ApiConfig { testMode: boolean; methods: Record<"stripe" | "paypal" | "sumup" | "bonifico", boolean>; privateDiscount: number }
export interface OrderSummary {
  ref: string; id_corso: number; seats: number; total_cents: number; method: "stripe" | "paypal" | "sumup" | "bonifico";
  status: "pending" | "paid" | "cancelled" | "failed" | "refunded"; test_mode: boolean; bank?: BankDetails;
}

/** Gli errori del server arrivano in italiano: li traduciamo (compreso il caso con un numero). */
function translateError(msg?: string): string {
  if (!msg) return t("Richiesta non riuscita.");
  const seats = /^Sono rimasti solo (\d+) posti\.$/.exec(msg);
  if (seats) return t("Sono rimasti solo {n} posti.", { n: seats[1] });
  return t(msg);
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error(t("Server non raggiungibile. Riprova tra poco."));
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(translateError(body?.error));
  return body as T;
}

const post = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const sendContact = (payload: unknown) => call<{ ok: true }>("/api/contact", post(payload));
export const getConfig = () => call<ApiConfig>("/api/config");
export const checkCoupon = (courseId: number, code: string, billingType: string) => call<{ code: string; pct: number }>("/api/coupon", post({ courseId, code, billingType }));
export const createOrder = (payload: unknown) => call<{ ref: string; url?: string; bank?: BankDetails }>("/api/orders", post(payload));
export const getOrderSummary = (ref: string) => call<OrderSummary>(`/api/orders/${encodeURIComponent(ref)}`);
