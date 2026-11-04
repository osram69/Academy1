import { BadgeCheck, Check, GraduationCap, Layers, Network, Monitor } from "lucide-react";
import { FaqList } from "../components/FaqList";
import { RichText } from "../components/RichText";
import { Btn, Reveal, Tag } from "../components/ui";
import { featuredCourse } from "../data";
import * as COPY from "../content/course-copy";
import { CERT, CERT_FAQS } from "../content/cert-copy";
import { LANDING } from "../content/landing-copy";
import { t } from "../i18n";

const FACT_ICONS = [BadgeCheck, Layers, Network, Monitor];

/**
 * Pagina dedicata a chi cerca "certificazione architetto software" / "iSAQB cos'è": che cos'è, livelli e percorso.
 * Gli stessi contenuti stanno anche nell'HTML per i crawler (src/lib/seo-content.ts → certSections).
 */
export function Certification() {
  const next = featuredCourse();
  return (
    <div className="bg-paper">
      <header className="relative overflow-hidden bg-ink pb-16 pt-28 text-white">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="absolute -right-40 -top-40 size-[520px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }} aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <Tag dark>{t(CERT.crumb)}</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 max-w-3xl text-balance font-display text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.025em]">{t(CERT.h1)}</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/72">{t(CERT.lead)}</p>
          </Reveal>
          <Reveal delay={220}>
            <ul className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              {CERT.facts.map((f, i) => {
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
            <Btn href="/esame-cpsa-f" variant="line-dark" size="lg">
              {t("Come funziona l'esame →")}
            </Btn>
          </Reveal>
        </div>
      </header>

      <main>
        <section className="py-20" aria-labelledby="what-h">
          <div className="mx-auto max-w-4xl px-5 lg:px-8">
            <h2 id="what-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(CERT.whatTitle)}</h2>
            <p className="mt-6 text-[16px] leading-[1.75] text-ink/70">{t(CERT.whatText)}</p>
          </div>
        </section>

        <section className="border-t border-ink/8 bg-sand/35 py-20" aria-labelledby="levels-h">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 id="levels-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(CERT.levelsTitle)}</h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {CERT.levels.map((l, i) => (
                <li key={l.name} className="rounded-2xl border border-ink/10 bg-white p-6">
                  <p className="font-mono text-[11px] font-semibold text-flame">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-display text-[1.2rem] font-bold tracking-tight text-ink">{t(l.name)}</h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-ink/70">{t(l.text)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-20" aria-labelledby="who-h">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 lg:px-8">
            <div>
              <h2 id="who-h" className="font-display text-[clamp(1.5rem,2.8vw,2.1rem)] font-bold tracking-tight text-ink">{t(CERT.audienceTitle)}</h2>
              <ul className="mt-5 space-y-3">
                {COPY.AUDIENCE.map((s) => (
                  <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink/75">
                    <Check className="mt-1 size-4 shrink-0 text-flame" aria-hidden="true" />
                    <span>{t(s)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-5 self-start rounded-3xl border border-flame/30 bg-flame/5 p-6">
              <GraduationCap className="mt-1 size-7 shrink-0 text-flame" aria-hidden="true" />
              <div>
                <h3 className="font-display text-[1.15rem] font-bold tracking-tight text-ink">{t(CERT.limitTitle)}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t(LANDING.examLimit)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-ink/8 bg-sand/35 py-20" aria-labelledby="path-h">
          <div className="mx-auto max-w-4xl px-5 lg:px-8">
            <h2 id="path-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(CERT.pathTitle)}</h2>
            <ol className="mt-6 space-y-4">
              {CERT.path.map((s, i) => (
                <li key={s} className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-5 text-[15px] leading-relaxed text-ink/75">
                  <span className="font-mono text-[12px] font-semibold text-flame">{String(i + 1).padStart(2, "0")}</span>
                  <span><RichText text={t(s)} /></span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-paper py-20" aria-labelledby="cert-faq-h">
          <div className="mx-auto max-w-4xl px-5 lg:px-8">
            <h2 id="cert-faq-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(CERT.faq)}</h2>
            <div className="mt-8">
              <FaqList items={CERT_FAQS.map((f) => ({ q: t(f.q), a: t(f.a) }))} />
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
