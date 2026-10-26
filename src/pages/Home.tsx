import { useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  FileCheck,
  GraduationCap,
  MonitorPlay,
  RotateCcw,
} from "lucide-react";
import { cn } from "../utils/cn";
import { Hero } from "../components/Hero";
import { ConcludedSection, CourseCard } from "../components/CourseCard";
import { Btn, IsoCube, Reveal, Tag } from "../components/ui";
import { ModalitaSection } from "../components/ModalitaSection";
import { FAQS, TRAINER, concludedCourses, eur, fmtRange, nextCourse, upcomingCourses } from "../data";

import { t } from "../i18n";
/* ============================ cos'è CPSA-F ============================ */

const WHY = [
  {
    n: "01",
    title: t("Uno standard, non un'opinione"),
    text: t("Il curriculum iSAQB® è mantenuto da una community internazionale di architetti: ciò che studi è ciò che il mercato riconosce."),
    icon: BadgeCheck,
  },
  {
    n: "02",
    title: t("Competenze verificabili"),
    text: t("L'esame CPSA-F non premia la memoria: valida la capacità di prendere decisioni architetturali motivate. È il segnale che manager e clienti sanno leggere."),
    icon: GraduationCap,
  },
  {
    n: "03",
    title: t("Una lingua comune"),
    text: t("Dopo il corso, il tuo team discute di qualità, trade-off e viste con lo stesso vocabolario. Le riunioni di design diventano più corte e più utili."),
    icon: FileCheck,
  },
];

function CertificationSection() {
  return (
    <section id="certificazione" className="relative scroll-mt-24 overflow-hidden bg-paper py-24 lg:py-32" aria-labelledby="cert-title">
      <IsoCube className="absolute -right-16 top-16 size-64 -rotate-12 text-ink/4" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <Tag>{t("La certificazione")}</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="cert-title" className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.025em] text-ink">
              {t("CPSA-F: il titolo che parla")}{" "}<em className="font-serif italic text-flame">{t("chiaro")}</em>{" "}{t("al mercato.")}</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-ink/65">
              <strong className="font-semibold text-ink">{t("iSAQB® CPSA-Foundation")}</strong>{" "}{t("è la certificazione di architettura software più riconosciuta in Europa. Non un badge da LinkedIn: un percorso strutturato che cambia come progetti, documenti e difendi le tue decisioni.")}</p>
          </Reveal>
          <Reveal delay={240} className="mt-8">
            <Btn href="#/corsi" variant="ink" withArrow>
              {t("Scegli la tua edizione")}</Btn>
          </Reveal>
          <Reveal delay={300} className="mt-12 hidden lg:block">
            <figure className="ticks relative max-w-sm p-2.5">
              <img
                src="https://images.pexels.com/photos/18999483/pexels-photo-18999483.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
                alt={t("Professionisti durante un workshop di architettura software")}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
              <figcaption className="absolute -bottom-5 right-6 rounded-lg bg-ink px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/80 shadow-lift">
                {t("Workshop, non slide")}</figcaption>
            </figure>
          </Reveal>
        </div>

        <div className="space-y-5">
          {WHY.map((w, i) => (
            <Reveal key={w.n} delay={i * 110}>
              <article className="group relative overflow-hidden rounded-[22px] border border-ink/10 bg-white p-7 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-flame/40 hover:shadow-lift lg:p-9">
                <span
                  className="pointer-events-none absolute -right-4 -top-7 select-none font-display text-[110px] font-bold leading-none text-ink/[0.045] transition-colors duration-500 group-hover:text-flame/10"
                  aria-hidden="true"
                >
                  {w.n}
                </span>
                <div className="flex items-start gap-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-flame/10 text-flame transition-colors duration-500 group-hover:bg-flame group-hover:text-white">
                    <w.icon className="size-5.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-tight text-ink">{w.title}</h3>
                    <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed text-ink/60">{w.text}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
          <Reveal delay={360}>
            <aside className="flex flex-col gap-4 rounded-[22px] bg-ink p-7 text-white sm:flex-row sm:items-center lg:p-8">
              <img
                src={TRAINER.img}
                alt={t("Ritratto di {name}", { name: TRAINER.name })}
                loading="lazy"
                className="size-14 shrink-0 rounded-full border-2 border-flame object-cover"
              />
              <div className="min-w-0">
                <p className="font-display text-[15px] font-semibold">{TRAINER.name}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-white/68">{TRAINER.role}</p>
              </div>
              <a
                href="#/corso/cpsa-f-online"
                className="link-sweep ml-auto shrink-0 text-[13px] font-medium text-ember"
              >
                {t("Conosci i docenti →")}</a>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================== formati ============================== */

const FORMATS = [
  {
    id: "online",
    icon: MonitorPlay,
    title: t("Live Online"),
    claim: t("L'aula viene da te."),
    text: t("Aula virtuale su Zoom con docente accreditato iSAQB®, esercitazioni ed esame simulato nell'ultima giornata."),
    points: [t("24 ore su 3 giornate"), t("Max 12 partecipanti"), t("Zero trasferte")],
    dark: false,
    img: null as string | null,
  },
  {
    id: "aula",
    icon: Building2,
    title: t("In Aula"),
    claim: t("Full immersion, networking vero."),
    text: t("Corso in presenza a Roma, con docente accreditato iSAQB® e gruppi di massimo 12 partecipanti."),
    points: [t("Sede a Roma"), t("Max 12 partecipanti"), t("Docente accreditato iSAQB®")],
    dark: false,
    img: null as string | null,
  },
  {
    id: "prestige",
    icon: BedDouble,
    title: t("Prestige Residenziale"),
    claim: t("Certificarsi è un'esperienza."),
    text: t("Corsi residenziali di 4 giorni nelle più belle città italiane, con albergo e mezza pensione. Presto maggiori informazioni."),
    points: [t("4 giorni in residenza"), t("Albergo e mezza pensione"), t("Presto informazioni")],
    dark: true,
    img: "https://images.pexels.com/photos/38115059/pexels-photo-38115059.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
];

function FormatsSection() {
  return (
    <section id="formati" className="scroll-mt-24 bg-ink py-24 text-white lg:py-32" aria-labelledby="formats-title">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <Tag dark>{t("I formati")}</Tag>
            </Reveal>
            <Reveal delay={80}>
              <h2 id="formats-title" className="mt-5 max-w-2xl font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.025em]">
                {t("Stesso curriculum.")}{" "}<em className="font-serif italic text-flame">{t("Tre modi")}</em>{" "}{t("di viverlo.")}</h2>
            </Reveal>
          </div>
          <Reveal delay={160}>
            <p className="max-w-sm text-[15px] leading-relaxed text-white/64">
              {t("Scegli in base ad agenda e budget: il docente accreditato iSAQB® e il programma sono identici in ogni formato.")}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {FORMATS.map((f, i) => (
            <Reveal key={f.id} delay={i * 120} className={cn(i === 2 && "md:-translate-y-6")}>
              <article
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-[24px] border p-7 transition-all duration-500 hover:-translate-y-1.5",
                  f.dark
                    ? "border-flame/40 bg-ink2 shadow-lift"
                    : "border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.07]"
                )}
              >
                {f.img && (
                  <>
                    <img
                      src={f.img}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover opacity-25 transition-all duration-700 group-hover:scale-105 group-hover:opacity-35"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" aria-hidden="true" />
                  </>
                )}
                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-12 place-items-center rounded-2xl transition-colors duration-500",
                        f.dark ? "bg-flame text-white" : "bg-white/8 text-ember group-hover:bg-flame group-hover:text-white"
                      )}
                    >
                      <f.icon className="size-5.5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{f.title}</h3>
                  <p className={cn("mt-1 font-serif text-lg italic", f.dark ? "text-ember" : "text-white/72")}>{f.claim}</p>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-white/68">{f.text}</p>
                  <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5 [margin-top:auto]">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[13.5px] font-medium text-white/75">
                        <Check className={cn("mt-0.5 size-4 shrink-0", f.dark ? "text-ember" : "text-flame")} aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#/corsi"
                    className="mt-7 inline-flex items-center gap-2 text-[13.5px] font-semibold text-white transition-colors hover:text-ember"
                    aria-label={t("Vedi le edizioni in formato {format}", { format: f.title })}
                  >
                    {t("Vedi le edizioni")}<ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================== prossime edizioni ======================== */

function EditionsSection() {
  const upcoming = upcomingCourses().slice(0, 3);
  const concluded = concludedCourses();
  return (
    <section className="relative overflow-hidden bg-paper py-24 lg:py-32" aria-labelledby="editions-title">
      <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <Tag>{t("Calendario")}</Tag>
            </Reveal>
            <Reveal delay={80}>
              <h2 id="editions-title" className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.025em] text-ink">
                {t("Le prossime")}{" "}<em className="font-serif italic text-flame">{t("edizioni.")}</em>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={160}>
            <Btn href="#/corsi" variant="ghost" withArrow>
              {t("Tutto il catalogo")}</Btn>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:pb-10">
          {upcoming.map((c, i) => (
            <Reveal key={c.slug} delay={i * 110}>
              <CourseCard course={c} index={i} />
            </Reveal>
          ))}
        </div>
        <ConcludedSection courses={concluded} limit={3} />
      </div>
    </section>
  );
}

/* -------------------------------- FAQ ------------------------------- */

function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 bg-paper py-24 lg:py-32" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <Tag>{t("Domande frequenti")}</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="faq-title" className="mt-5 font-display text-[clamp(2rem,4.2vw,3.2rem)] font-bold leading-[1.04] tracking-[-0.025em] text-ink">
              {t("Prima di investire")}{" "}<em className="font-serif italic text-flame">{eur(nextCourse().price)}</em>{t(", giusto chiedere.")}</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-ink/60">
              {t("Non trovi la risposta? Scrivici a")}{" "}
              <a href="mailto:academy@cubeng.eu" className="link-sweep font-semibold text-flame">
                {t("academy@cubeng.eu")}</a>{" "}
              {t("— ti rispondiamo il prima possibile.")}</p>
          </Reveal>
          <Reveal delay={240} className="mt-9 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2 text-[13px] font-medium text-ink/75">
              <RotateCcw className="size-4 text-flame" aria-hidden="true" />
              {t("Rimborso se il corso non parte")}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2 text-[13px] font-medium text-ink/75">
              <BadgeCheck className="size-4 text-flame" aria-hidden="true" />
              {t("Esame iSAQB® a parte")}</span>
          </Reveal>
        </div>

        <div className="space-y-3.5">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 70}>
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white transition-colors duration-300",
                    isOpen ? "border-flame/50 shadow-card" : "border-ink/10"
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-[11px] font-semibold text-flame">0{i + 1}</span>
                      <span className="font-display text-[16.5px] font-semibold tracking-tight text-ink">{f.q}</span>
                    </span>
                    <ChevronDown
                      className={cn("size-5 shrink-0 text-steel transition-transform duration-400", isOpen && "rotate-180 text-flame")}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    className={cn(
                      "grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 pl-[3.7rem] text-[14.5px] leading-relaxed text-ink/65">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- CTA -------------------------------- */

function CtaSection() {
  const next = nextCourse();
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-white lg:py-32" aria-labelledby="cta-title">
      <img
        src="/img/cta-blueprint.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/30" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <Tag dark>{t("Il prossimo passo")}</Tag>
        </Reveal>
        <Reveal delay={90}>
          <h2 id="cta-title" className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,5.5vw,4.4rem)] font-bold leading-[1.0] tracking-[-0.03em]">
            {t("Tra")}{" "}{Math.max(1, Math.round((next.start.getTime() - Date.now()) / 86400000))}{" "}{t("giorni potresti essere")}{" "}
            <em className="font-serif italic text-flame">{t("in aula.")}</em>
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-white/72">
            {next.short} · {fmtRange(next.start, next.end)} · {next.location}{t(". Early bird attivo: blocchi il prezzo ora, il materiale del corso è incluso nel prezzo.")}</p>
        </Reveal>
        <Reveal delay={260} className="mt-10 flex flex-wrap gap-4">
          <Btn href={`#/iscriviti/${next.slug}`} size="lg" withArrow ariaLabel={t("Iscriviti ora alla prossima edizione")}>
            {t("Iscriviti ora")}</Btn>
          <Btn href="#/corsi" variant="line-dark" size="lg">
            {t("Confronta le date")}</Btn>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- page ------------------------------- */

export function Home() {
  return (
    <>
      <Hero />
      <CertificationSection />
      <ModalitaSection />
      <FormatsSection />
      <EditionsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
