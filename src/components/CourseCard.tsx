import { ArrowUpRight, CalendarDays, Clock, Globe, MapPin } from "lucide-react";
import { cn } from "../utils/cn";
import {
  FORMAT_META,
  eur,
  fmtRange,
  getLivePrice,
  type Course,
} from "../data";
import { Btn, EarlyBirdChip, SeatsBar, StatusPill } from "./ui";

/**
 * CourseCard — sostituisce la riga della vecchia "tabella listino".
 * Gerarchia: formato/stato → titolo → meta scannerizzabili → posti → prezzo → CTA.
 * Article semantico, link intera-card via stretched-link accessibile,
 * CTA secondaria "Iscriviti" con aria-label esplicito.
 */
export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const price = getLivePrice(course);
  const fmt = FORMAT_META[course.format];
  const waitlist = course.status === "waitlist";

  return (
    <article
      aria-label={`${course.title}, ${fmtRange(course.start, course.end)}, ${course.location}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-card",
        "transition-all duration-500 hover:-translate-y-1.5 hover:border-ink/25 hover:shadow-lift",
        index % 2 === 1 && "lg:translate-y-10" /* offset editoriale nella griglia */
      )}
    >
      {/* media */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={course.image}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" aria-hidden="true" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-ink/75 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
            {fmt.label}
          </span>
          {course.level !== "Foundation" && (
            <span className="rounded-full bg-white/90 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink backdrop-blur-sm">
              {course.level}
            </span>
          )}
        </div>
        <div className="absolute bottom-4 right-4">
          <EarlyBirdChip course={course} dark />
        </div>
        {course.format === "prestige" && (
          <span className="absolute bottom-4 left-4 rounded-full bg-flame px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Hotel 4★ incluso
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <StatusPill status={course.status} seatsLeft={course.seatsLeft} />
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-widest text-steel">
            <Globe className="size-3.5" aria-hidden="true" />
            {course.language}
          </span>
        </div>

        <h3 className="mt-3.5 font-display text-[21px] font-bold leading-snug tracking-tight text-ink">
          <a
            href={`#/corso/${course.slug}`}
            className="transition-colors after:absolute after:inset-0 after:content-[''] hover:text-flame focus-visible:outline-none"
          >
            {course.title}
          </a>
        </h3>

        <ul className="mt-4 space-y-2 text-[13.5px] text-ink/70">
          <li className="flex items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0 text-flame" aria-hidden="true" />
            <span className="font-semibold text-ink">{fmtRange(course.start, course.end)}</span>
            <span className="text-steel">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-steel" aria-hidden="true" />
              {course.effort.split("·")[0]}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin className="size-4 shrink-0 text-flame" aria-hidden="true" />
            {course.location}
          </li>
        </ul>

        <div className="mt-5">
          <SeatsBar course={course} />
        </div>

        {/* price + actions */}
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-ink/8 pt-5 [margin-top:auto]">
          <div className="pt-5">
            {price.original && (
              <p className="text-[12px] font-medium text-steel line-through" aria-label={`Prezzo di listino ${eur(price.original)}`}>
                {eur(price.original)}
              </p>
            )}
            <p className="font-display text-[26px] font-bold leading-none tracking-tight text-ink">
              {eur(price.unit)}
              <span className="ml-1.5 align-middle text-[11px] font-medium tracking-normal text-steel">a persona + IVA</span>
            </p>
          </div>
          <a
            href={waitlist ? `#/corso/${course.slug}` : `#/iscriviti/${course.slug}`}
            aria-label={
              waitlist
                ? `Entra in lista d'attesa per ${course.short}`
                : `Iscriviti a ${course.short} del ${fmtRange(course.start, course.end)}`
            }
            className={cn(
              "relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full transition-all duration-300",
              waitlist
                ? "border border-ink/20 text-ink hover:bg-ink hover:text-white"
                : "bg-flame text-white shadow-flame hover:rotate-45 hover:bg-ink"
            )}
          >
            <ArrowUpRight className="size-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

/* helper minimale per riuso del bottone ghost in altri punti */
export { Btn };
