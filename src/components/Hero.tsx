import { ShieldCheck, ArrowDownRight, Timer, CalendarDays, MapPin } from "lucide-react";
import { nextCourse, fmtRange, getLivePrice, eur, STATS } from "../data";
import { Btn, EarlyBirdChip, IsoCube, Reveal, SeatsBar, useNow } from "./ui";

function FloatingCourseCard() {
  const course = nextCourse();
  const price = getLivePrice(course);
  const now = useNow(10000);
  void now;
  return (
    <div className="relative animate-float rounded-2xl border border-white/12 bg-ink/85 p-5 shadow-lift backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ember">
          <Timer className="size-3.5" aria-hidden="true" />
          Prossima edizione
        </span>
        <EarlyBirdChip course={course} dark />
      </div>
      <p className="mt-3 font-display text-lg font-bold leading-tight tracking-tight text-white">{course.short}</p>
      <div className="mt-2.5 space-y-1.5 text-[12.5px] text-white/60">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-3.5 text-flame" aria-hidden="true" />
          {fmtRange(course.start, course.end)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-3.5 text-flame" aria-hidden="true" />
          {course.location}
        </p>
      </div>
      <div className="mt-4">
        <SeatsBar course={course} dark />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="font-display text-xl font-bold text-white">
          {eur(price.unit)}
          {price.original && (
            <span className="ml-2 align-middle text-[12px] font-normal text-white/40 line-through">{eur(price.original)}</span>
          )}
        </p>
        <Btn href={`#/iscriviti/${course.slug}`} size="sm" ariaLabel="Iscriviti alla prossima edizione">
          Blocca il posto
        </Btn>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white" aria-label="Introduzione">
      {/* sfondo */}
      <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -right-40 -top-40 size-[560px] rounded-full opacity-35 blur-[130px]"
        style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }}
        aria-hidden="true"
      />
      <IsoCube className="absolute -left-10 bottom-24 size-52 rotate-12 text-white/6 animate-spin-slow" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-36 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-44">
        {/* colonna testo */}
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 py-2 pl-3 pr-4 text-[12.5px] font-medium text-white/75 backdrop-blur-sm">
              <ShieldCheck className="size-4 text-flame" aria-hidden="true" />
              Training Provider accreditato <strong className="font-semibold text-white">iSAQB®</strong>
              <span className="hidden text-white/30 sm:inline">· dal 2013</span>
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-7 font-display text-[clamp(2.9rem,7.2vw,5.6rem)] font-bold leading-[0.98] tracking-[-0.03em]">
              L'architettura
              <br />
              del software si{" "}
              <em className="font-serif font-normal italic tracking-[-0.01em] text-flame">disegna.</em>
              <br />
              <span className="text-white/45">E si certifica.</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-white/60">
              Corsi <strong className="font-semibold text-white/85">CPSA-Foundation®</strong> con docenti che progettano
              sistemi veri, voucher d'esame incluso e formati per ogni agenda: online, in aula o residenziale in una
              villa toscana.
            </p>
          </Reveal>

          <Reveal delay={260} className="mt-9 flex flex-wrap items-center gap-4">
            <Btn href={`#/iscriviti/${nextCourse().slug}`} size="lg" withArrow ariaLabel="Vai all'iscrizione della prossima edizione">
              Iscriviti alla prossima edizione
            </Btn>
            <Btn href="#/corsi" variant="line-dark" size="lg">
              Calendario completo
            </Btn>
          </Reveal>

          <Reveal delay={340}>
            <dl className="mt-14 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-[26px] font-bold tracking-tight text-white">{s.value}</dd>
                  <dd className="mt-1 text-[11.5px] leading-snug text-white/45">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* colonna visuale */}
        <Reveal delay={200} className="relative hidden lg:block">
          <div className="relative mr-6">
            {/* HUD labels */}
            <p className="absolute -top-7 left-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35" aria-hidden="true">
              FIG. 01 — STRUCTURE / STRATEGY
            </p>
            <div className="ticks ticks-light p-3">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src="/img/hero-structure.jpg"
                  alt="Scultura astratta di cubi isometrici illuminati di rosso: la metafora visiva di Cube Academy, struttura e rigore"
                  className="aspect-[4/4.6] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" aria-hidden="true" />
                <p className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/55" aria-hidden="true">
                  CPSA-F · Foundation Level
                </p>
              </div>
            </div>
            {/* card flottante */}
            <div className="absolute -bottom-10 -left-16 w-[330px]">
              <FloatingCourseCard />
            </div>
            <ArrowDownRight
              className="absolute -left-8 top-10 size-8 -rotate-90 text-flame/70"
              strokeWidth={1.2}
              aria-hidden="true"
            />
          </div>
        </Reveal>

        {/* mobile: card corso inline */}
        <Reveal delay={120} className="lg:hidden">
          <FloatingCourseCard />
        </Reveal>
      </div>

      {/* marquee */}
      <div className="relative border-t border-white/10 bg-ink2/70 py-4 backdrop-blur-sm" aria-hidden="true">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-10">
                {[
                  "iSAQB® Accredited Training Provider",
                  "CPSA-Foundation Level",
                  "Voucher d'esame incluso",
                  "Corsi in IT · EN · FR · DE",
                  "Rimborso 100% fino a 14 giorni prima",
                  "Fatturazione elettronica SDI",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-10 font-mono text-[11.5px] uppercase tracking-[0.24em] text-white/45">
                    {t}
                    <span className="inline-block size-[7px] rotate-45 bg-flame" aria-hidden="true" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
