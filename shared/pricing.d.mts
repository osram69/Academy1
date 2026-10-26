export const MAX_SEATS: number;
export const VAT: number;
export interface Totals {
  unit_cents: number; subtotal_cents: number; discount_cents: number; vat_cents: number; total_cents: number;
  applied: string | null; early_active: boolean;
}
export function computeTotals(p: {
  listEuro: number; earlyEuro: number | null; seats: number; billingType: string;
  privatePct?: number; couponPct?: number; couponCode?: string | null;
}): Totals;
export function earlyPriceEuro(c: Record<string, unknown>, now?: Date): number | null;
