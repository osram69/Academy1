import { useEffect } from "react";
import { BadgePercent } from "lucide-react";
import { featuredCourse } from "../data";
import { lang, t } from "../i18n";
import type { ApiPromo } from "../lib/api";
import { setRibbonPart } from "../lib/ribbon";
import { useConfig } from "../lib/useConfig";

/** Testo del banner nella lingua del sito: quello scritto in pannello, altrimenti l'italiano, altrimenti il testo automatico. */
export function promoText(p: ApiPromo): string {
  const own = p.text?.[lang]?.trim() || p.text?.it?.trim();
  return own || t("Promozione: −{pct}% con il codice {code}", { pct: p.percent, code: p.code });
}

/**
 * Nastro della promozione sotto la barra menu (e sotto quello dei workshop): compare solo se un codice sconto ha "banner" attivo ed è in corso.
 * Il testo si sceglie nelle Impostazioni, per ogni codice e per ogni lingua.
 */
export function PromoTicker() {
  const promo = useConfig()?.promo ?? null;
  useEffect(() => {
    if (!promo) return;
    setRibbonPart("promo", 36);
    return () => setRibbonPart("promo", 0);
  }, [promo]);
  if (!promo) return null;
  const text = promoText(promo);
  const item = (
    <span className="flex items-center gap-10 font-mono text-[11.5px] uppercase tracking-[0.24em] text-white/80">
      <span className="flex items-center gap-2.5">
        <BadgePercent className="size-4 text-ember" aria-hidden="true" />
        <span className="font-semibold text-white">{text}</span>
        <span className="text-ember underline underline-offset-4">{t("Iscriviti")}</span>
      </span>
      <span className="inline-block size-[7px] rotate-45 bg-flame" aria-hidden="true" />
    </span>
  );
  return (
    <a
      href={`/iscriviti/${featuredCourse().slug}`}
      aria-label={`${text} — ${t("Iscriviti")}`}
      className="group relative z-0 block h-9 overflow-hidden border-t border-flame/40 bg-flame/20"
    >
      <div className="flex h-full items-center overflow-hidden" aria-hidden="true">
        <div style={{ animationDuration: "52s" }} className="flex shrink-0 animate-marquee items-center gap-10 whitespace-nowrap pr-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10">
              {[0, 1, 2].map((n) => <span key={n} className="flex items-center gap-10">{item}</span>)}
            </div>
          ))}
        </div>
      </div>
    </a>
  );
}
