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
  Quote,
  RotateCcw,
  Star,
} from "lucide-react";
import { cn } from "../utils/cn";
import { Hero } from "../components/Hero";
import { ConcludedSection, CourseCard } from "../components/CourseCard";
import { Btn, IsoCube, Reveal, Tag } from "../components/ui";
import { FAQS, TESTIMONIALS, TRAINER, concludedCourses, fmtRange, nextCourse, upcomingCourses } from "../data";

/* ============================ cos'è CPSA-F ============================ */

const WHY = [
  {
    n: "01",
    title: "Uno standard, non un'opinione",
    text: "Il curriculum iSAQB® è mantenuto da una community internazionale di architetti: ciò che studi è ciò che il mercato riconosce, identico in 40+ paesi.",
    icon: BadgeCheck,
  },
  {
    n: "02",
    title: "Competenze verificabili",
    text: "L'esame CPSA-F non premia la memoria: valida la capacità di prendere decisioni architetturali motivate. È il segnale che manager e clienti sanno leggere.",
    icon: GraduationCap,
  },
  {
    n: "03",
    title: "Una lingua comune",
    text: "Dopo il corso, il tuo team discute di qualità, trade-off e viste con lo stesso vocabolario. Le riunioni di design diventano più corte e più utili.",
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
            <Tag>La certificazione</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="cert-title" className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.025em] text-ink">
              CPSA-F: il titolo che parla <em className="font-serif italic text-flame">chiaro</em> al mercato.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-ink/65">
              <strong className="font-semibold text-ink">iSAQB® CPSA-Foundation</strong> è la certificazione di
              architettura software più riconosciuta in Europa. Non un badge da LinkedIn: un percorso strutturato che
              cambia come progetti, documenti e difendi le tue decisioni.
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-8">
            <Btn href="#/corsi" variant="ink" withArrow>
              Scegli la tua edizione
            </Btn>
          </Reveal>
          <Reveal delay={300} className="mt-12 hidden lg:block">
            <figure className="ticks relative max-w-sm p-2.5">
              <img
                src="https://images.pexels.com/photos/18999483/pexels-photo-18999483.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
                alt="Professionisti durante un workshop Cube Academy su casi architetturali reali"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
              <figcaption className="absolute -bottom-5 right-6 rounded-lg bg-ink px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/80 shadow-lift">
                Workshop, non slide
              </figcaption>
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
                alt={`Ritratto di ${TRAINER.name}`}
                loading="lazy"
                className="size-14 shrink-0 rounded-full border-2 border-flame object-cover"
              />
              <div className="min-w-0">
                <p className="font-display text-[15px] font-semibold">{TRAINER.name}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-white/55">{TRAINER.role}</p>
              </div>
              <a
                href="#/corso/cpsa-f-online"
                className="link-sweep ml-auto shrink-0 text-[13px] font-medium text-ember"
              >
                Conosci i docenti →
              </a>
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
    title: "Live Online",
    claim: "L'aula viene da te.",
    text: "Zoom con docente live, breakout room per i workshop, lavagna condivisa Miro. Registrazioni disponibili 30 giorni.",
    points: ["32 ore su 4 giornate", "Max 20 partecipanti", "Zero trasferte"],
    dark: false,
    img: null as string | null,
  },
  {
    id: "aula",
    icon: Building2,
    title: "In Aula",
    claim: "Full immersion, networking vero.",
    text: "Milano e Bologna. Lavagne, post-it e pranzi inclusi: le conversazioni fuori dalle sessioni valgono quanto il corso.",
    points: ["Sedi centrali, raggiungibili in metro", "Pranzi e coffee break inclusi", "Max 18 partecipanti"],
    dark: false,
    img: null as string | null,
  },
  {
    id: "prestige",
    icon: BedDouble,
    title: "Prestige Residenziale",
    claim: "Certificarsi è un'esperienza.",
    text: "Cinque giorni in ville italiane d'eccezione: corso, hotel 4★, pasti e cena conviviale inclusi. Gruppi di massimo 14, ritmo residenziale.",
    points: ["Hotel 4★ + tutti i pasti inclusi", "Masterclass serale con il docente", "Transfer dalla stazione"],
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
              <Tag dark>I formati</Tag>
            </Reveal>
            <Reveal delay={80}>
              <h2 id="formats-title" className="mt-5 max-w-2xl font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.025em]">
                Stesso curriculum. <em className="font-serif italic text-flame">Tre modi</em> di viverlo.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={160}>
            <p className="max-w-sm text-[15px] leading-relaxed text-white/50">
              Scegli in base ad agenda e budget: il voucher d'esame CPSA-F e i docenti accreditati sono identici in ogni
              formato.
            </p>
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
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{f.title}</h3>
                  <p className={cn("mt-1 font-serif text-lg italic", f.dark ? "text-ember" : "text-white/60")}>{f.claim}</p>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-white/55">{f.text}</p>
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
                    aria-label={`Vedi le edizioni in formato ${f.title}`}
                  >
                    Vedi le edizioni
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
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
              <Tag>Calendario</Tag>
            </Reveal>
            <Reveal delay={80}>
              <h2 id="editions-title" className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.025em] text-ink">
                Le prossime <em className="font-serif italic text-flame">edizioni.</em>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={160}>
            <Btn href="#/corsi" variant="ghost" withArrow>
              Tutto il catalogo
            </Btn>
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

/* ============================ testimonianze ========================== */

function VoicesSection() {
  return (
    <section id="voci" className="scroll-mt-24 bg-sand/40 py-24 lg:py-32" aria-labelledby="voices-title">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <Tag>Le voci degli alumni</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="voices-title" className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.025em] text-ink">
              740 professionisti hanno già <em className="font-serif italic text-flame">alzato l'asticella.</em>
            </h2>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 120} className={cn(i === 1 && "lg:translate-y-8")}>
              <figure className="flex h-full flex-col rounded-[24px] border border-ink/10 bg-white p-8 shadow-card">
                <Quote className="size-7 rotate-180 text-flame" aria-hidden="true" />
                <div className="mt-4 flex gap-1" aria-label="Valutazione 5 su 5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[15.5px] leading-relaxed text-ink/80">“{t.quote}”</blockquote>
                <figcaption className="mt-7 flex items-center gap-3.5 border-t border-ink/8 pt-5">
                  <img src={t.img} alt="" loading="lazy" className="size-12 rounded-full object-cover ring-2 ring-flame/30" />
                  <div>
                    <p className="font-display text-[14.5px] font-semibold text-ink">{t.name}</p>
                    <p className="text-[12.5px] text-steel">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
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
            <Tag>Domande frequenti</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="faq-title" className="mt-5 font-display text-[clamp(2rem,4.2vw,3.2rem)] font-bold leading-[1.04] tracking-[-0.025em] text-ink">
              Prima di investire <em className="font-serif italic text-flame">€1.800</em>, giusto chiedere.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-ink/60">
              Non trovi la risposta? Scrivici a{" "}
              <a href="mailto:academy@cubeng.eu" className="link-sweep font-semibold text-flame">
                academy@cubeng.eu
              </a>{" "}
              — rispondiamo entro 4 ore lavorative, o prenota una call di orientamento gratuita.
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-9 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2 text-[13px] font-medium text-ink/75">
              <RotateCcw className="size-4 text-flame" aria-hidden="true" />
              Rimborso 100% fino a 14 gg prima
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2 text-[13px] font-medium text-ink/75">
              <BadgeCheck className="size-4 text-flame" aria-hidden="true" />
              Voucher esame incluso
            </span>
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
          <Tag dark>Il prossimo passo</Tag>
        </Reveal>
        <Reveal delay={90}>
          <h2 id="cta-title" className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,5.5vw,4.4rem)] font-bold leading-[1.0] tracking-[-0.03em]">
            Tra {Math.max(1, Math.round((next.start.getTime() - Date.now()) / 86400000))} giorni potresti essere{" "}
            <em className="font-serif italic text-flame">in aula.</em>
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-white/60">
            {next.short} · {fmtRange(next.start, next.end)} · {next.location}. Early bird attivo: blocchi il prezzo ora,
            pensiamo noi a voucher d'esame e materiali.
          </p>
        </Reveal>
        <Reveal delay={260} className="mt-10 flex flex-wrap gap-4">
          <Btn href={`#/iscriviti/${next.slug}`} size="lg" withArrow ariaLabel="Iscriviti ora alla prossima edizione">
            Iscriviti ora
          </Btn>
          <Btn href="#/corsi" variant="line-dark" size="lg">
            Confronta le date
          </Btn>
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
      <FormatsSection />
      <EditionsSection />
      <VoicesSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
