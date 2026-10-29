import { CalendarDays, MapPin } from "lucide-react";
import { lang, t } from "../i18n";
import { EVENTS } from "../events";
import { ExtLink } from "../components/IsaqbLinks";
import { Reveal } from "../components/ui";

/** Pagina #/eventi: appuntamenti di Cube Academy e della community iSAQB®. */
export function Events() {
  return (
    <div className="bg-paper">
      <header className="relative overflow-hidden bg-ink pb-12 pt-32 text-white lg:pt-36">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,3rem)] font-bold leading-[1.05] tracking-[-0.025em]">{t("Eventi")}</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/70">
            {t("Gli appuntamenti di Cube Academy e della community iSAQB®.")}</p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((e, i) => (
            <Reveal key={e.id} delay={i * 90}>
              <article className="flex h-full flex-col overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-card">
                <img src={e.img} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
                <div className="flex flex-1 flex-col p-6">
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] font-medium uppercase tracking-widest text-steel">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{e.when[lang]}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{e.place}</span>
                  </p>
                  <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">{e.title}</h2>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink/65">{e.text[lang]}</p>
                  <div className="mt-auto pt-5 text-[14px]">
                    <ExtLink href={e.href} className="text-flame">{t("Leggi tutto")}</ExtLink>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </main>
    </div>
  );
}
