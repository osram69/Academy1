import { ShieldCheck, ArrowDownRight, Timer, CalendarDays, MapPin } from "lucide-react";
import { nextCourse, fmtRange, getLivePrice, eur, STATS } from "../data";
import { Btn, EarlyBirdChip, IsoCube, Reveal, SeatsBar, useNow } from "./ui";
import { PrivateOffer } from "./PrivateOffer";

import { t } from "../i18n";
/** Logo ufficiale iSAQB Accredited Training Provider (PNG con sfondo trasparente), usato senza modifiche. */
function IsaqbBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex ${className}`}>
      <img
        src="/img/isaqb-accredited-training-provider.png"
        alt={t("iSAQB® Accredited Training Provider")}
        width={456}
        height={306}
        className="h-28 w-auto"
      />
    </div>
  );
}

function FloatingCourseCard() {
  const course = nextCourse();
  const price = getLivePrice(course);
  const now = useNow(10000);
  void now;
  return (
    <div className="relative animate-float rounded-2xl border border-white/12 bg-ink p-5 shadow-lift">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ember">
          <Timer className="size-3.5" aria-hidden="true" />
          {t("Prossima edizione")}</span>
        <EarlyBirdChip course={course} dark />
      </div>
      <p className="mt-3 font-display text-lg font-bold leading-tight tracking-tight text-white">{course.short}</p>
      <div className="mt-2.5 space-y-1.5 text-[12.5px] text-white/72">
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
            <span className="ml-2 align-middle text-[12px] font-normal text-white/56 line-through">{eur(price.original)}</span>
          )}
        </p>
        <Btn href={`#/iscriviti/${course.slug}`} size="sm" ariaLabel={t("Iscriviti alla prossima edizione")}>
          {t("Blocca il posto")}</Btn>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white" aria-label={t("Introduzione")}>
      {/* sfondo */}
      <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -right-40 -top-40 size-[560px] rounded-full opacity-35"
        style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }}
        aria-hidden="true"
      />
      <IsoCube className="absolute -left-10 bottom-24 size-52 rotate-12 text-white/6 animate-spin-slow" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-36 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-[120px]">
        {/* colonna testo */}
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 py-2 pl-3 pr-4 text-[12.5px] font-medium text-white/75">
              <ShieldCheck className="size-4 text-flame" aria-hidden="true" />
              {t("Training Provider accreditato")}{" "}<strong className="font-semibold text-white">{t("iSAQB®")}</strong>
              <span className="hidden text-white/65 sm:inline">{t("· dal 2024")}</span>
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-7 font-display text-[clamp(2.9rem,7.2vw,5.6rem)] font-bold leading-[0.98] tracking-[-0.03em]">
              {t("L'architettura")}<br />
              {t("del software si")}{" "}
              <em className="font-serif font-normal italic tracking-[-0.01em] text-flame">{t("disegna.")}</em>
              <br />
              <span className="text-white/60">{t("E si certifica.")}</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-white/72">
              {t("Corsi")}{" "}<strong className="font-semibold text-white/85">{t("CPSA-Foundation®")}</strong>{" "}{t("con docenti che progettano sistemi veri, in formato online o in aula. L'esame di certificazione si sostiene a parte, presso gli enti autorizzati iSAQB®.")}</p>
          </Reveal>

          <Reveal delay={220} className="mt-6">
            <PrivateOffer course={nextCourse()} dark />
          </Reveal>

          <Reveal delay={260} className="mt-9 flex flex-wrap items-center gap-4">
            <Btn href={`#/iscriviti/${nextCourse().slug}`} size="lg" withArrow ariaLabel={t("Vai all'iscrizione della prossima edizione")}>
              {t("Iscriviti alla prossima edizione")}</Btn>
            <Btn href="#/corsi" variant="line-dark" size="lg">
              {t("Calendario completo")}</Btn>
          </Reveal>

          <Reveal delay={340}>
            <dl className="mt-14 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-[26px] font-bold tracking-tight text-white">{s.value}</dd>
                  <dd className="mt-1 text-[11.5px] leading-snug text-white/60">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* colonna visuale */}
        <Reveal delay={200} className="relative hidden lg:block">
          <div className="mb-10 mr-6 flex justify-end">
            <IsaqbBadge />
          </div>
          <div className="relative mr-6">
            {/* HUD labels */}
            <p className="absolute -top-7 left-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/52" aria-hidden="true">
              {t("FIG. 01 — STRUCTURE / STRATEGY")}</p>
            <div className="ticks ticks-light p-3">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src="/img/hero-structure.jpg"
                  alt={t("Scultura astratta di cubi isometrici illuminati di rosso: la metafora visiva di Cube Academy, struttura e rigore")}
                  className="aspect-[4/4.6] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" aria-hidden="true" />
                <p className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/68" aria-hidden="true">
                  {t("CPSA-F · Foundation Level")}</p>
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
          <IsaqbBadge className="mb-6" />
          <FloatingCourseCard />
        </Reveal>
      </div>

      {/* marquee */}
      <div className="relative border-t border-white/10 bg-ink2/70 py-4" aria-hidden="true">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-10">
                {[
                  "iSAQB® Accredited Training Provider",
                  "CPSA-Foundation Level",
                  t("Esame iSAQB® a parte (280 € + IVA)"),
                  t("Corsi in IT · EN · FR"),
                  t("Rimborso se il corso non parte"),
                  t("Fatturazione elettronica SDI"),
                ].map((t) => (
                  <span key={t} className="flex items-center gap-10 font-mono text-[11.5px] uppercase tracking-[0.24em] text-white/60">
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
