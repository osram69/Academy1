import { useEffect, useState } from "react";
import { computeTotals } from "../../shared/pricing.mjs";
import { getLivePrice, type Course } from "../data";
import { getConfig, type ApiConfig } from "./api";

let cached: ApiConfig | null = null;

/** Configurazione pubblica dal server (metodi attivi, sconto privati). Null finché non arriva o se il server non risponde. */
export function useConfig(): ApiConfig | null {
  const [cfg, setCfg] = useState<ApiConfig | null>(cached);
  useEffect(() => {
    if (cached) return;
    getConfig().then((c) => { cached = c; setCfg(c); }).catch(() => undefined);
  }, []);
  return cfg;
}

/** Prezzo a persona (IVA esclusa) per un privato: sconto sul listino più early bird. Null se lo sconto non è attivo. */
export function privatePrice(course: Course, cfg: ApiConfig | null): { pct: number; unit: number } | null {
  if (!cfg || cfg.privateDiscount <= 0 || course.concluded) return null;
  const live = getLivePrice(course);
  const t = computeTotals({
    listEuro: course.price, earlyEuro: live.active ? live.unit : null, seats: 1, billingType: "privato", privatePct: cfg.privateDiscount / 100,
  });
  return { pct: cfg.privateDiscount, unit: (t.subtotal_cents - t.discount_cents) / 100 };
}
