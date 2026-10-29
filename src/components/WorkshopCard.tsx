import { ArrowUpRight, CalendarDays, CheckCircle2, Clock, Globe, MapPin, Presentation } from "lucide-react";
import { cn } from "../utils/cn";
import { fmtFull, pastWorkshops, upcomingWorkshops, type Workshop } from "../data";
import { Reveal, Tag } from "./ui";
import { t } from "../i18n";

/** Pulsante verso l'evento LinkedIn (la prenotazione dei workshop avviene lì, non sul sito). */
function JoinButton({ w, className }: { w: Workshop; className?: string }) {
  if (!w.eventUrl) return null;
  return (
    <a
      href={w.eventUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("Partecipa su LinkedIn a {name}", { name: w.title })}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-flame px-5 py-2.5 font-display text-[13.5px] font-semibold text-white shadow-flame transition-all duration-300 hover:bg-ink",
        className
      )}
    >
      {t("Partecipa su LinkedIn")}
      <ArrowUpRight className="size-4" aria-hidden="true" />
    </a>
  );
}

function Cover({ w, past }: { w: Workshop; past?: boolean }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-ink">
      {w.image ? (
        <img src={w.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
      ) : (
        <div className="grid size-full place-items-center bg-blueprint-dark text-white/30">
          <Presentation className="size-12" aria-hidden="true" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" aria-hidden="true" />
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-ink/75 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white">{t("Workshop")}</span>
        {past ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink">
            <CheckCircle2 className="size-3.5 text-mint" aria-hidden="true" />{t("Svolto")}
          </span>
        ) : (
          <span className="rounded-full bg-mint px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white">{t("Gratuito")}</span>
        )}
      </div>
    </div>
  );
}

/** Card del workshop: niente prezzi né iscrizione, ma data, orario, descrizione e link all'evento. */
export function WorkshopCard({ w, past = false }: { w: Workshop; past?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
      <Cover w={w} past={past} />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-[21px] font-bold leading-snug tracking-tight text-ink">{w.title}</h3>
        <ul className="mt-4 space-y-2 text-[13.5px] text-ink/70">
          <li className="flex items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0 text-flame" aria-hidden="true" />
            <span className="font-semibold text-ink">{fmtFull(w.start)}</span>
          </li>
          {w.time && (
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-flame" aria-hidden="true" />
              {w.time}
            </li>
          )}
          {(w.place || w.language) && (
            <li className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <MapPin className="size-4 shrink-0 text-flame" aria-hidden="true" />
              {w.place}
              {w.language && (
                <>
                  <span className="text-steel">·</span>
                  <Globe className="size-3.5 text-steel" aria-hidden="true" />
                  {w.language}
                </>
              )}
            </li>
          )}
        </ul>
        {w.description && <p className="mt-4 text-[14px] leading-relaxed text-ink/65">{w.description}</p>}
        {!past && (
          <div className="mt-auto pt-6">
            <JoinButton w={w} />
          </div>
        )}
      </div>
    </article>
  );
}

/** Sezione "Workshop" del catalogo: prossimi (gratuiti, da prenotare su LinkedIn) e già svolti. */
export function WorkshopsSection({ showUpcoming = true, showPast = true }: { showUpcoming?: boolean; showPast?: boolean }) {
  const next = showUpcoming ? upcomingWorkshops() : [];
  const done = showPast ? pastWorkshops() : [];
  if (!next.length && !done.length) return null;
  return (
    <section className="mb-20" aria-labelledby="workshops-title">
      <Reveal>
        <Tag>{t("Workshop")}</Tag>
      </Reveal>
      <Reveal delay={80}>
        <h2 id="workshops-title" className="mt-5 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-tight tracking-[-0.02em] text-ink">
          {t("Workshop")}{" "}<em className="font-serif italic text-flame">{t("gratuiti.")}</em>
        </h2>
      </Reveal>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/60">
        {t("Presentazioni di circa un'ora per conoscere iSAQB® e l'architettura software. La partecipazione è gratuita e si prenota sull'evento LinkedIn.")}
      </p>
      {next.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {next.map((w, i) => (
            <Reveal key={w.id} delay={(i % 3) * 90}>
              <WorkshopCard w={w} />
            </Reveal>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <>
          <h3 className="mt-12 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-steel">{t("Workshop svolti")}</h3>
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {done.slice(0, 6).map((w, i) => (
              <Reveal key={w.id} delay={(i % 3) * 90}>
                <WorkshopCard w={w} past />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Richiamo in home al prossimo workshop: compare solo se ne è stato previsto uno. */
export function WorkshopPromo() {
  const w = upcomingWorkshops()[0];
  if (!w) return null;
  return (
    <section className="bg-paper py-12 lg:py-16" aria-label={t("Prossimo workshop")}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <div className="grid overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-card md:grid-cols-[1fr_1.1fr]">
            <div className="relative min-h-56 bg-ink md:min-h-full">
              {w.image ? (
                <img src={w.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="bg-blueprint-dark absolute inset-0 grid place-items-center text-white/30">
                  <Presentation className="size-14" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="p-7 lg:p-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-mint px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white">{t("Workshop gratuito")}</span>
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-steel">{t("Prossimo workshop")}</span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(1.5rem,2.8vw,2.1rem)] font-bold leading-tight tracking-[-0.02em] text-ink">{w.title}</h2>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink/70">
                <span className="inline-flex items-center gap-2 font-semibold text-ink"><CalendarDays className="size-4 text-flame" aria-hidden="true" />{fmtFull(w.start)}</span>
                {w.time && <span className="inline-flex items-center gap-2"><Clock className="size-4 text-flame" aria-hidden="true" />{w.time}</span>}
                {w.place && <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-flame" aria-hidden="true" />{w.place}</span>}
              </p>
              {w.description && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/65">{w.description}</p>}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <JoinButton w={w} />
                <a href="#/corsi" className="link-sweep text-[14px] font-semibold text-flame">{t("Tutti i workshop")}</a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
