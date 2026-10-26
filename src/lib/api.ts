// Client delle API del server Node (vedi server/index.mjs).
export interface BankDetails { holder: string; iban: string; bank: string; bic: string }
export interface ApiConfig { testMode: boolean; methods: Record<"stripe" | "paypal" | "sumup" | "bonifico", boolean> }
export interface OrderSummary {
  ref: string; id_corso: number; seats: number; total_cents: number; method: "stripe" | "paypal" | "sumup" | "bonifico";
  status: "pending" | "paid" | "cancelled" | "failed" | "refunded"; test_mode: boolean; bank?: BankDetails;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error("Server non raggiungibile. Riprova tra poco.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || "Richiesta non riuscita.");
  return body as T;
}

const post = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const getConfig = () => call<ApiConfig>("/api/config");
export const checkCoupon = (courseId: number, code: string) => call<{ code: string; pct: number }>("/api/coupon", post({ courseId, code }));
export const createOrder = (payload: unknown) => call<{ ref: string; url?: string; bank?: BankDetails }>("/api/orders", post(payload));
export const getOrderSummary = (ref: string) => call<OrderSummary>(`/api/orders/${encodeURIComponent(ref)}`);
