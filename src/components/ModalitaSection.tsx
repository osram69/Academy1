import { CalendarClock, Moon, Sun, Zap, type LucideIcon } from "lucide-react";
import { Reveal, Tag } from "./ui";
import { MODALITA, fmtRange, upcomingCourses, type Modalita } from "../data";
import { useConfig } from "../lib/useConfig";

import { t } from "../i18n";
const ICONS: Record<Modalita, LucideIcon> = { intensivo: Zap, weekend: CalendarClock, serale: Moon, mezze_giornate: Sun };

/** Le 24 ore del corso, distribuite in modi diversi per chi non può prendere tre giorni di ferie. */
export function ModalitaSection() {
  const cfg = useConfig();
  const upcoming = upcomingCourses();
  return (
    <section id="modalita" className="scroll-mt-24 bg-paper pb-24 pt-20 lg:pb-28 lg:pt-20" aria-labelledby="modalita-title">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <Tag>{t("Come seguire il corso")}</Tag>
        </Reveal>
        <Reveal delay={80}>
          <h2 id="modalita-title" className="mt-5 max-w-3xl font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.025em] text-ink">
            {t("Le stesse 24 ore,")}{" "}<em className="font-serif italic text-flame">{t("distribuite come ti conviene.")}</em>
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink/65">
            {t("Tre giorni pieni non sono per tutti. Stesso programma iSAQB® e stesso docente: cambia solo il calendario.")}</p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(MODALITA) as Modalita[]).map((id, i) => {
            const m = MODALITA[id];
            const Icon = ICONS[id];
            const next = upcoming.find((c) => c.modalita === id);
            return (
              <Reveal key={id} delay={i * 90}>
                <article className="flex h-full flex-col rounded-[22px] border border-ink/10 bg-white p-6 shadow-card">
                  <span className="grid size-11 place-items-center rounded-xl bg-flame/10 text-flame">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-[17px] font-bold tracking-tight text-ink">{m.label}</h3>
                  <p className="mt-1 text-[13px] font-medium text-flame">{m.effort}</p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink/65">{m.schedule}</p>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink/65">{m.forWho}</p>
                  <p className="mt-4 border-t border-ink/8 pt-4 text-[12.5px] text-steel">
                    {next ? (
                      <>
                        {t("Prossima:")}{" "}<a className="link-sweep font-semibold text-ink" href={`#/corso/${next.slug}`}>{fmtRange(next.start, next.end)}</a>
                      </>
                    ) : (
                      <>{t("Date in definizione:")}{" "}<a className="link-sweep font-semibold text-flame" href="#/contatti?oggetto=info">{t("scrivici")}</a></>
                    )}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>

        {cfg && cfg.privateDiscount > 0 && (
          <Reveal delay={200}>
            <p className="mt-8 rounded-2xl border border-flame/30 bg-flame/[0.06] px-6 py-4 text-[14.5px] leading-relaxed text-ink/80">
              <strong className="font-semibold text-ink">{t("Per i privati −")}{cfg.privateDiscount}{t("% sul prezzo di listino.")}</strong>{" "}
              {t("Se iscrivi te stesso, senza partita IVA, lo sconto si applica automaticamente in fase d'iscrizione e si somma all'early bird, quando attivo.")}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
