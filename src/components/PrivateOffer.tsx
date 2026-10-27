import { BadgePercent } from "lucide-react";
import { eur, type Course } from "../data";
import { t } from "../i18n";
import { privatePrice, useConfig } from "../lib/useConfig";

/** Evidenzia lo sconto per chi si iscrive come privato (persona fisica senza P.IVA). */
export function PrivateOffer({ course, dark = false }: { course?: Course; dark?: boolean }) {
  const cfg = useConfig();
  if (!cfg || cfg.privateDiscount <= 0) return null;
  const price = course ? privatePrice(course, cfg) : null;
  return (
    <p
      className={
        dark
          ? "inline-flex flex-wrap items-center gap-x-2 rounded-full border border-mint/40 bg-mint/10 px-4 py-2 text-[13px] font-medium text-white"
          : "inline-flex flex-wrap items-center gap-x-1.5 rounded-lg bg-mint/10 px-2.5 py-1.5 text-[12px] font-semibold text-mint"
      }
    >
      <BadgePercent className="size-4 shrink-0 text-mint" aria-hidden="true" />
      <span>
        {t("Privati −{pct}% sul listino", { pct: cfg.privateDiscount })}
        {price ? <> · {t("da {price} + IVA", { price: eur(price.unit) })}</> : null}
      </span>
    </p>
  );
}
