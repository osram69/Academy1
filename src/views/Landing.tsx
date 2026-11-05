import { BadgeCheck, BedDouble, Building2, CalendarDays, Check, GraduationCap, MapPin, MonitorPlay, Users } from "lucide-react";
import { CourseCard } from "../components/CourseCard";
import { FaqList } from "../components/FaqList";
import { RichText } from "../components/RichText";
import { Btn, Reveal, Tag } from "../components/ui";
import { featuredCourse, upcomingCourses } from "../data";
import * as COPY from "../content/course-copy";
import { LANDING } from "../content/landing-copy";
import { t } from "../i18n";

const FACT_ICONS = [CalendarDays, MapPin, BadgeCheck, Users];
const FORMAT_ICONS = { online: MonitorPlay, aula: Building2, prestige: BedDouble };

/** Elenco con segni di spunta: obiettivi, destinatari, prerequisiti, cosa include. */
function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((it) => (
        <li key={it} className="flex gap-3 text-[15px] leading-relaxed text-ink/75">
          <Check className="mt-1 size-4 shrink-0 text-flame" aria-hidden="true" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Pagina dedicata a chi cerca "corso Architetto Software" / "corsi iSAQB": spiega il corso e porta alle date.
 * Gli stessi contenuti stanno anche nell'HTML per i crawler (src/lib/seo-content.ts → landingSections).
 */
export function Landing() {
  const courses = upcomingCourses();
  const next = featuredCourse();
  return (
    <div className="bg-paper">
      <header className="relative overflow-hidden bg-ink pb-16 pt-28 text-white lg:pt-28">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="absolute -right-40 -top-40 size-[520px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }} aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <Tag dark>{t(LANDING.crumb)}</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 max-w-3xl text-balance font-display text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.025em]">{t(LANDING.h1)}</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/72">{t(LANDING.lead)}</p>
          </Reveal>
          <Reveal delay={220}>
            <ul className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              {LANDING.facts.map((f, i) => {
                const Icon = FACT_ICONS[i] ?? BadgeCheck;
                return (
                  <li key={f} className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-[14px] font-medium text-white/85">
                    <Icon className="size-4 shrink-0 text-flame" aria-hidden="true" />
                    {t(f)}
                  </li>
                );
              })}
            </ul>
          </Reveal>
          <Reveal delay={280} className="mt-9 flex flex-wrap items-center gap-4">
            <Btn href={`/iscriviti/${next.slug}`} size="lg" withArrow ariaLabel={t("Vai all'iscrizione della prossima edizione")}>
              {t("Iscriviti alla prossima edizione")}
            </Btn>
            <Btn href="/corsi" variant="line-dark" size="lg">
              {t("Calendario completo")}
            </Btn>
          </Reveal>
        </div>
      </header>

      <main>
        <section id="date" className="scroll-mt-24 py-20" aria-labelledby="date-h">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 id="date-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(LANDING.dates)}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((c, i) => (
                <CourseCard key={c.slug} course={c} index={i} />
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-ink/65"><RichText text={t(COPY.VENUE_NOTE)} /></p>
            <p className="mt-3 text-[14px] text-ink/60">
              <a href="/corsi" className="link-sweep font-semibold text-flame">{t("Tutto il calendario →")}</a>
            </p>
          </div>
        </section>

        <section id="formati" className="scroll-mt-24 border-t border-ink/8 bg-sand/35 py-20" aria-labelledby="formats-h">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 id="formats-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(LANDING.formats)}</h2>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink/65">{t("Scegli in base ad agenda e budget: il docente accreditato iSAQB® e il programma sono identici in ogni formato.")}</p>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {COPY.FORMATS_COPY.map((f) => {
                const Icon = FORMAT_ICONS[f.id];
                return (
                  <li key={f.id} className="flex flex-col rounded-2xl border border-ink/10 bg-white p-6">
                    <span className="grid size-11 place-items-center rounded-xl bg-flame/10 text-flame">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-[1.2rem] font-bold tracking-tight text-ink">{t(f.title)}</h3>
                    <p className="mt-1 font-serif text-[17px] italic text-flame">{t(f.claim)}</p>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-ink/70">{t(f.text)}</p>
                    <ul className="mt-5 space-y-2 border-t border-ink/8 pt-4">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-[14px] font-medium text-ink/75">
                          <Check className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden="true" />
                          {t(p)}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="border-t border-ink/8 py-20" aria-labelledby="learn-h">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <h2 id="learn-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(LANDING.objectives)}</h2>
              <CheckList items={COPY.OBJECTIVES.map((s) => t(s))} />
            </div>
            <div>
              <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(LANDING.program)}</h2>
              <p className="mt-3 text-[14.5px] text-ink/65"><RichText text={t(COPY.CURRICULUM_NOTE)} /></p>
              <ol className="mt-5 space-y-4">
                {COPY.MODULES.map((m, i) => (
                  <li key={m.title} className="rounded-2xl border border-ink/10 bg-white p-5">
                    <p className="font-display text-[16px] font-semibold tracking-tight text-ink">
                      <span className="mr-3 font-mono text-[11px] text-flame">{String(i + 1).padStart(2, "0")}</span>
                      {t(m.title)}
                    </p>
                    <p className="mt-1 pl-9 text-[14px] font-medium leading-relaxed text-ink/80">{t(m.outcome)}</p>
                    <ul className="mt-2 space-y-1.5 pl-9 text-[14px] leading-relaxed text-ink/65">
                      {m.topics.map((s) => (
                        <li key={s} className="list-disc">{t(s)}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="py-20" aria-labelledby="who-h">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-3 lg:px-8">
            <div>
              <h2 id="who-h" className="font-display text-[1.5rem] font-bold tracking-tight text-ink">{t(LANDING.audience)}</h2>
              <CheckList items={COPY.AUDIENCE.map((s) => t(s))} />
            </div>
            <div>
              <h2 className="font-display text-[1.5rem] font-bold tracking-tight text-ink">{t(LANDING.prerequisites)}</h2>
              <CheckList items={COPY.PREREQUISITES.map((s) => t(s))} />
            </div>
            <div>
              <h2 className="font-display text-[1.5rem] font-bold tracking-tight text-ink">{t(LANDING.includes)}</h2>
              <CheckList items={COPY.INCLUDES.map((s) => t(s))} />
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 lg:px-8" aria-labelledby="exam-h">
          <div className="mx-auto flex max-w-4xl gap-5 rounded-3xl border border-flame/30 bg-flame/5 p-7">
            <GraduationCap className="mt-1 size-7 shrink-0 text-flame" aria-hidden="true" />
            <div>
              <h2 id="exam-h" className="font-display text-[1.25rem] font-bold tracking-tight text-ink">{t(LANDING.examTitle)}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t(LANDING.examText)}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t(LANDING.examLimit)}</p>
              <p className="mt-3 text-[15px]"><a href="/esame-cpsa-f" className="link-sweep font-semibold text-flame">{t("Come funziona l'esame →")}</a></p>
            </div>
          </div>
        </section>

        <section className="border-t border-ink/8 bg-paper py-20" aria-labelledby="faq-h">
          <div className="mx-auto max-w-4xl px-5 lg:px-8">
            <h2 id="faq-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(LANDING.faq)}</h2>
            <div className="mt-8">
              <FaqList />
            </div>
            <p className="mt-8 text-[15px] text-ink/65">
              {t("Non trovi la risposta?")}{" "}
              <a href="/contatti" className="link-sweep font-semibold text-flame">{t("Scrivici con il modulo di contatto")}</a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
