import { useEffect, useState } from "react";
import { Outcome, type OrderInfo, type OutcomeVariant } from "./Outcome";
import { getOrderSummary, type OrderSummary } from "../lib/api";
import { COURSES } from "../data";

import { t } from "../i18n";
const VARIANT: Record<string, OutcomeVariant> = { paid: "success", pending: "pending", cancelled: "cancelled", error: "error" };

/** Pagina di esito: legge lo stato reale dell'ordine dal server (/esito/<rif>/<stato>). */
export function Esito({ refCode, status }: { refCode: string; status: string }) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrderSummary(refCode).then(setOrder).catch((e: Error) => setError(e.message));
  }, [refCode]);

  const course = order ? COURSES.find((c) => c.id === order.id_corso) : undefined;
  const wrap = (children: React.ReactNode) => <div className="bg-paper bg-blueprint px-5 pb-24 pt-36 lg:px-8">{children}</div>;

  if (error) return wrap(<p className="mx-auto max-w-xl text-center text-ink/70" role="alert">{error}</p>);
  if (!order || !course) return wrap(<p className="mx-auto max-w-xl text-center text-ink/60">{t("Caricamento…")}</p>);

  // lo stato reale dell'ordine prevale sul parametro dell'URL
  let variant: OutcomeVariant = VARIANT[status] ?? "error";
  if (order.status === "paid") variant = "success";
  else if (order.method === "bonifico" && order.status === "pending") variant = "bank";
  else if (variant === "success") variant = "pending";

  const info: OrderInfo = { course, count: order.seats, total: order.total_cents / 100, method: order.method, orderRef: order.ref, bank: order.bank, testMode: order.test_mode };
  return wrap(<Outcome variant={variant} order={info} />);
}
