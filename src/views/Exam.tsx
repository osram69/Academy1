import { BadgeCheck, Clock, GraduationCap, ListChecks, Monitor, Languages, Euro } from "lucide-react";
import { FaqList } from "../components/FaqList";
import { RichText } from "../components/RichText";
import { Btn, Reveal, Tag } from "../components/ui";
import { featuredCourse } from "../data";
import { EXAM, EXAM_FAQS } from "../content/exam-copy";
import { LANDING } from "../content/landing-copy";
import { t } from "../i18n";

const FACT_ICONS = [Clock, ListChecks, BadgeCheck, Euro, Monitor, Languages];

/**
 * Pagina dedicata a chi cerca "esame CPSA-F" / "esame iSAQB": formato, costo, iscrizione e preparazione.
 * Gli stessi contenuti stanno anche nell'HTML per i crawler (src/lib/seo-content.ts → examSections).
 */
export function Exam() {
  const next = featuredCourse();
  return (
    <div className="bg-paper">
      <header className="relative overflow-hidden bg-ink pb-16 pt-28 text-white">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="absolute -right-40 -top-40 size-[520px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }} aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <Tag dark>{t(EXAM.crumb)}</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 max-w-3xl text-balance font-display text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.025em]">{t(EXAM.h1)}</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/72">{t(EXAM.lead)}</p>
          </Reveal>
          <Reveal delay={220}>
            <ul className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXAM.facts.map((f, i) => {
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
            <Btn href="/corso-software-architect" variant="line-dark" size="lg">
              {t("Programma e dettagli del corso →")}
            </Btn>
          </Reveal>
        </div>
      </header>

      <main>
        <section className="py-20" aria-labelledby="steps-h">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[1fr_1fr] lg:px-8">
            <div>
              <h2 id="steps-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(EXAM.stepsTitle)}</h2>
              <ol className="mt-6 space-y-4">
                {EXAM.steps.map((s, i) => (
                  <li key={s} className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-5 text-[15px] leading-relaxed text-ink/75">
                    <span className="font-mono text-[12px] font-semibold text-flame">{String(i + 1).padStart(2, "0")}</span>
                    <span><RichText text={t(s)} /></span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(EXAM.prepTitle)}</h2>
              <p className="mt-6 text-[16px] leading-[1.75] text-ink/70">{t(EXAM.prepText)}</p>
              <div className="mt-6 flex gap-5 rounded-3xl border border-flame/30 bg-flame/5 p-6">
                <GraduationCap className="mt-1 size-7 shrink-0 text-flame" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-[1.15rem] font-bold tracking-tight text-ink">{t(EXAM.limitTitle)}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t(LANDING.examLimit)}</p>
                </div>
              </div>
              <p className="mt-6 text-[13.5px] leading-relaxed text-ink/55"><RichText text={t(EXAM.source)} /></p>
            </div>
          </div>
        </section>

        <section className="border-t border-ink/8 bg-paper py-20" aria-labelledby="exam-faq-h">
          <div className="mx-auto max-w-4xl px-5 lg:px-8">
            <h2 id="exam-faq-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(EXAM.faq)}</h2>
            <div className="mt-8">
              <FaqList items={EXAM_FAQS.map((f) => ({ q: t(f.q), a: t(f.a) }))} />
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
