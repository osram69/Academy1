import { BadgeCheck, ExternalLink } from "lucide-react";
import { cn } from "../utils/cn";
import { RichText } from "./RichText";
import { Reveal } from "./ui";
import { ECO } from "../content/ecosystem-copy";
import { t } from "../i18n";

/** Schede delle certificazioni del software: quella di iSAQB® (i nostri corsi) è evidenziata, le altre rimandano ai siti ufficiali. */
export function EcosystemCards({ homeOnly = false }: { homeOnly?: boolean }) {
  const items = homeOnly ? ECO.items.filter((i) => i.home) : ECO.items;
  return (
    <ul className={cn("grid gap-5", homeOnly ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3")}>
      {items.map((i, idx) => {
        const ours = i.id === "isaqb";
        return (
          <li key={i.id}>
            <Reveal delay={idx * 70} className="h-full">
              <article className={cn("flex h-full flex-col rounded-2xl border bg-white p-6", ours ? "border-flame/50 shadow-card" : "border-ink/10")}>
                <p className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-flame">
                  <span>{t(i.area)}</span>
                  {ours && (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-flame px-2.5 py-1 text-[10px] tracking-[0.12em] text-white">
                      <BadgeCheck className="size-3" aria-hidden="true" />
                      {t(ECO.ours)}
                    </span>
                  )}
                </p>
                <h3 className="mt-3 font-display text-[1.25rem] font-bold tracking-tight text-ink">{t(i.name)}</h3>
                <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink/70">{t(i.text)}</p>
                {ours ? (
                  <a href="/corso-software-architect" className="link-sweep mt-5 inline-block text-[14px] font-semibold text-flame">{t("Programma e dettagli del corso →")}</a>
                ) : (
                  i.url && (
                    <a href={i.url} target="_blank" rel="noopener noreferrer" className="link-sweep mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink/75 hover:text-flame">
                      {t(ECO.official)}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  )
                )}
              </article>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}

/** Come collaborano iSAQB®, IREB® e ISTQB®, con i riferimenti ufficiali. */
export function EcosystemCollab() {
  return (
    <>
      <h3 className="font-display text-[1.25rem] font-bold tracking-tight text-ink">{t(ECO.collabTitle)}</h3>
      <ul className="mt-4 space-y-3">
        {ECO.collab.map((s) => (
          <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink/75">
            <BadgeCheck className="mt-1 size-4 shrink-0 text-flame" aria-hidden="true" />
            <span><RichText text={t(s)} /></span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[13.5px] leading-relaxed text-ink/55">{t(ECO.notice)}</p>
    </>
  );
}
