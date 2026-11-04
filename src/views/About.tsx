import { Check, MapPin } from "lucide-react";
import { RichText } from "../components/RichText";
import { Btn, Reveal, Tag } from "../components/ui";
import { ORG, featuredCourse } from "../data";
import { ABOUT } from "../content/about-copy";
import { VENUE_NOTE } from "../content/course-copy";
import { t } from "../i18n";

/** Pagina "Chi siamo": chi organizza i corsi, come lavora, dove si trova. Il testo sta anche nell'HTML per i crawler (seo-content.ts → aboutSections). */
export function About() {
  const next = featuredCourse();
  return (
    <div className="bg-paper">
      <header className="relative overflow-hidden bg-ink pb-14 pt-28 text-white">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="absolute -right-40 -top-40 size-[520px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }} aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <Tag dark>{t(ABOUT.crumb)}</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 max-w-3xl text-balance font-display text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.025em]">{t(ABOUT.h1)}</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/72">{t(ABOUT.lead)}</p>
          </Reveal>
          <Reveal delay={240} className="mt-8 flex flex-wrap items-center gap-4">
            <Btn href={`/iscriviti/${next.slug}`} size="lg" withArrow ariaLabel={t("Vai all'iscrizione della prossima edizione")}>
              {t("Iscriviti alla prossima edizione")}
            </Btn>
            <Btn href="/contatti" variant="line-dark" size="lg">
              {t("Contatti")}
            </Btn>
          </Reveal>
        </div>
      </header>

      <main>
        <section className="py-20" aria-labelledby="who-h">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 id="who-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(ABOUT.whoTitle)}</h2>
              <p className="mt-5 text-[16px] leading-[1.75] text-ink/70">{t(ABOUT.whoText)}</p>
            </div>
            <div>
              <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(ABOUT.howTitle)}</h2>
              <ul className="mt-5 space-y-3">
                {ABOUT.how.map((s) => (
                  <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink/75">
                    <Check className="mt-1 size-4 shrink-0 text-flame" aria-hidden="true" />
                    <span>{t(s)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-ink/8 bg-sand/35 py-20" aria-labelledby="where-h">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 id="where-h" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold tracking-tight text-ink">{t(ABOUT.whereTitle)}</h2>
              <p className="mt-5 flex gap-3 text-[16px] leading-[1.75] text-ink/70">
                <MapPin className="mt-1.5 size-4 shrink-0 text-flame" aria-hidden="true" />
                <span><RichText text={t(VENUE_NOTE)} /></span>
              </p>
              <p className="mt-4 text-[15.5px] leading-relaxed text-ink/70"><RichText text={t(ABOUT.contactText)} /></p>
            </div>
            <div>
              <h2 className="font-display text-[1.4rem] font-bold tracking-tight text-ink">{t(ABOUT.companyTitle)}</h2>
              <dl className="mt-5 space-y-2 text-[14.5px] text-ink/70">
                <div><dt className="sr-only">{t("Cube Academy")}</dt><dd className="font-semibold text-ink">{ORG.company}</dd></div>
                <div>{t("Sede legale")}: {ORG.legalAddress}</div>
                <div>{t("P.IVA")} {ORG.vat} · {t("REA")} {ORG.rea}</div>
                <div>{ORG.email}</div>
              </dl>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
