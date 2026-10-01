import { useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileCheck,
  Globe,
  Landmark,
  Lock,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CourseCard } from "../components/CourseCard";
import { Btn, EarlyBirdChip, Reveal, SeatsBar, StatusPill, Tag } from "../components/ui";
import {
  COURSES,
  FORMAT_META,
  TRAINER,
  eur,
  fmtFull,
  fmtRange,
  getLivePrice,
  type Course,
} from "../data";

/* ------------------------- rail prezzo sticky ------------------------ */

function PriceRail({ course }: { course: Course }) {
  const price = getLivePrice(course);
  const waitlist = course.status === "waitlist";
  return (
    <aside className="lg:sticky lg:top-24" aria-label="Riepilogo iscrizione">
      <div className="overflow-hidden rounded-[24px] border border-ink/10 bg-white shadow-lift">
        <div className="bg-ink p-6 text-white">
          <div className="flex items-center justify-between">
            <StatusPill status={course.status} seatsLeft={course.seatsLeft} dark />
            <EarlyBirdChip course={course} dark />
          </div>
          <div className="mt-5 flex items-end gap-3">
            <p className="font-display text-[42px] font-bold leading-none tracking-tight">
              {eur(price.unit)}
              {waitlist && <span className="text-lg text-white/56">*</span>}
            </p>
            {price.original && <p className="pb-1 text-lg text-white/52 line-through">{eur(price.original)}</p>}
          </div>
          <p className="mt-1.5 text-[12.5px] text-white/64">
            a persona + IVA 22%{waitlist ? " · prezzo indicativo per la prossima data" : ""}
          </p>
          {price.active && (
            <p className="mt-3 rounded-lg bg-flame/15 px-3 py-2 text-[12.5px] font-medium text-ember">
              Early bird −{Math.round(course.earlyBirdPct * 100)}% fino al {fmtFull(course.earlyBirdUntil)}
            </p>
          )}
        </div>

        <div className="p-6">
          <SeatsBar course={course} />
          <ul className="mt-6 space-y-3 text-[13.5px] text-ink/75">
            {[
              { icon: CalendarDays, text: `${fmtRange(course.start, course.end)}` },
              { icon: Clock, text: course.effort },
              { icon: MapPin, text: course.location },
              { icon: Globe, text: course.language === "IT" ? "Docenza in italiano" : "Taught in English" },
            ].map((r) => (
              <li key={r.text} className="flex items-center gap-2.5">
                <r.icon className="size-4 shrink-0 text-flame" aria-hidden="true" />
                {r.text}
              </li>
            ))}
          </ul>

          {waitlist ? (
            <Btn href={`mailto:academy@cubeng.eu?subject=Lista%20d'attesa%20${encodeURIComponent(course.short)}`} variant="ink" size="lg" className="mt-7 w-full" withArrow>
              Entra in lista d'attesa
            </Btn>
          ) : (
            <Btn href={`#/iscriviti/${course.slug}`} size="lg" className="mt-7 w-full" withArrow ariaLabel={`Iscriviti a ${course.title} del ${fmtRange(course.start, course.end)}`}>
              Iscriviti ora
            </Btn>
          )}

          <button
            type="button"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink/75 transition-colors hover:border-ink hover:text-ink"
            aria-label="Scarica il syllabus ufficiale iSAQB in PDF"
          >
            <Download className="size-4" aria-hidden="true" />
            Syllabus ufficiale (PDF)
          </button>

          <ul className="mt-6 space-y-2.5 border-t border-ink/8 pt-5 text-[12.5px] text-ink/60">
            {[
              { icon: RotateCcw, text: "Rimborso 100% fino a 14 giorni prima" },
              { icon: Landmark, text: "Bonifico: posti bloccati 7 gg lavorativi" },
              { icon: Lock, text: "Pagamenti cifrati · Stripe, PayPal, SumUp" },
              { icon: FileCheck, text: "Fattura elettronica SDI per aziende" },
            ].map((r) => (
              <li key={r.text} className="flex items-start gap-2.5">
                <r.icon className="mt-0.5 size-3.5 shrink-0 text-mint" aria-hidden="true" />
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-steel">
        <ShieldCheck className="size-3.5 text-mint" aria-hidden="true" />
        Training Provider accreditato iSAQB®
      </p>
    </aside>
  );
}

/* --------------------------- sezione generica ------------------------ */

function Block({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-ink/10 py-12 first:border-0 first:pt-0" aria-labelledby={`${id}-h`}>
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[12px] font-semibold text-flame" aria-hidden="true">
          /{n}
        </span>
        <h2 id={`${id}-h`} className="font-display text-[26px] font-bold tracking-tight text-ink">
          {title}
        </h2>
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

/* ------------------------------ pagina ------------------------------- */

export function CourseDetail({ course }: { course: Course }) {
  const [openModule, setOpenModule] = useState(0);
  const price = getLivePrice(course);
  const related = COURSES.filter((c) => c.slug !== course.slug && !c.concluded)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);
  const fmt = FORMAT_META[course.format];

  return (
    <div className="bg-paper">
      {/* header */}
      <header className="relative overflow-hidden bg-ink pb-24 pt-40 text-white">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <img src={course.image} alt="" className="absolute inset-0 size-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-widest text-white/60">
            <a href="#/" className="transition-colors hover:text-white">Home</a>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <a href="#/corsi" className="transition-colors hover:text-white">Catalogo</a>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="text-ember" aria-current="page">{course.short}</span>
          </nav>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-flame px-3.5 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-white">
              {fmt.label}
            </span>
            <span className="rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/75">
              Livello {course.level}
            </span>
            <span className="rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/75">
              {course.language === "IT" ? "Italiano" : "English"}
            </span>
            {course.examIncluded && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Voucher esame incluso
              </span>
            )}
          </div>

          <h1 className="mt-7 max-w-4xl font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.03] tracking-[-0.025em]">
            {course.title}
          </h1>
          <p className="mt-6 max-w-2xl font-serif text-[19px] italic leading-relaxed text-white/76">{course.tagline}</p>
        </div>
      </header>

      {/* body */}
      <main className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-20">
        <div>
          <Block id="overview" n="01" title="Panoramica">
            <p className="max-w-2xl text-[16px] leading-[1.75] text-ink/70">{course.description}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                course.seatsTotal != null
                  ? { v: `${course.seatsTotal}`, l: "posti per edizione" }
                  : { v: course.location, l: "sede" },
                { v: `${course.effort.split(" ")[0]} gg`, l: "di formazione live" },
                { v: price.active ? `−${Math.round(course.earlyBirdPct * 100)}%` : eur(price.unit), l: price.active ? "early bird attivo ora" : "prezzo a persona + IVA" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-ink/10 bg-white p-5">
                  <p className="font-display text-2xl font-bold tracking-tight text-flame">{s.v}</p>
                  <p className="mt-1 text-[12.5px] text-ink/55">{s.l}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block id="obiettivi" n="02" title="Cosa saprai fare">
            <ul className="grid gap-3 sm:grid-cols-2">
              {course.objectives.map((o) => (
                <li key={o} className="flex items-start gap-3 rounded-2xl border border-ink/8 bg-white p-4 text-[14.5px] leading-snug text-ink/75">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mint/12 text-mint">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {o}
                </li>
              ))}
            </ul>
          </Block>

          <Block id="destinatari" n="03" title="Per chi è pensato">
            <div className="flex flex-wrap gap-2.5">
              {course.audience.map((a) => (
                <span key={a} className="rounded-full border border-ink/12 bg-white px-4.5 py-2.5 text-[14px] font-medium text-ink/75">
                  {a}
                </span>
              ))}
            </div>
          </Block>

          <Block id="programma" n="04" title="Programma giorno per giorno">
            <div className="space-y-3">
              {course.modules.map((m, i) => {
                const isOpen = openModule === i;
                return (
                  <div key={m.title} className={cn("overflow-hidden rounded-2xl border bg-white transition-colors", isOpen ? "border-flame/45 shadow-card" : "border-ink/10")}>
                    <button
                      onClick={() => setOpenModule(isOpen ? -1 : i)}
                      aria-expanded={isOpen}
                      aria-controls={`module-${i}`}
                      className="flex w-full items-center gap-4 px-6 py-5 text-left"
                    >
                      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl font-mono text-[12px] font-bold transition-colors", isOpen ? "bg-flame text-white" : "bg-ink/6 text-ink/60")}>
                        G{i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[15.5px] font-semibold tracking-tight text-ink">{m.title}</span>
                        <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-widest text-steel">{m.hours} ore · {m.topics.length} moduli</span>
                      </span>
                      <ChevronDown className={cn("size-5 shrink-0 text-steel transition-transform duration-300", isOpen && "rotate-180 text-flame")} aria-hidden="true" />
                    </button>
                    <div id={`module-${i}`} role="region" className={cn("grid transition-all duration-400 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                      <div className="overflow-hidden">
                        <ul className="space-y-2.5 px-6 pb-6 pt-1">
                          {m.topics.map((t) => (
                            <li key={t} className="flex items-start gap-3 text-[14.5px] leading-snug text-ink/70">
                              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-flame" aria-hidden="true" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Block>

          <Block id="prerequisiti" n="05" title="Prerequisiti">
            <ul className="space-y-3">
              {course.prerequisites.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink/70">
                  <span className="mt-[9px] size-1.5 shrink-0 rotate-45 bg-flame" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </Block>

          <Block id="docente" n="06" title="Il docente">
            <article className="flex flex-col gap-6 rounded-[24px] border border-ink/10 bg-white p-7 shadow-card sm:flex-row sm:items-start">
              <img src={TRAINER.img} alt={`Ritratto di ${TRAINER.name}`} loading="lazy" className="size-24 shrink-0 rounded-2xl object-cover ring-2 ring-flame/25" />
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-ink">{TRAINER.name}</h3>
                <p className="mt-0.5 text-[13px] font-medium text-flame">{TRAINER.role}</p>
                <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-ink/65">{TRAINER.bio}</p>
              </div>
            </article>
          </Block>

          <Block id="costi" n="07" title="Costi, inclusi e rimborso">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-ink/10 bg-white p-7">
                <h3 className="flex items-center gap-2 font-display text-[15.5px] font-bold tracking-tight text-ink">
                  <BadgeCheck className="size-4.5 text-mint" aria-hidden="true" />
                  Tutto questo è incluso
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {course.includes.map((inc) => (
                    <li key={inc} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink/70">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-mint" aria-hidden="true" />
                      {inc}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[24px] border border-gold/30 bg-amber-50/60 p-7">
                <h3 className="flex items-center gap-2 font-display text-[15.5px] font-bold tracking-tight text-ink">
                  <RotateCcw className="size-4.5 text-gold" aria-hidden="true" />
                  Politica di rimborso
                </h3>
                <ul className="mt-4 space-y-2.5 text-[13.5px] leading-relaxed text-ink/70">
                  <li><strong className="text-ink">Fino a 14 giorni prima:</strong> rimborso del 100%, senza domande.</li>
                  <li><strong className="text-ink">Fino a 7 giorni prima:</strong> rimborso del 50% o spostamento gratuito.</li>
                  <li><strong className="text-ink">Oltre:</strong> sostituzione del partecipante gratuita, sempre.</li>
                  <li><strong className="text-ink">Se annulliamo noi:</strong> rimborso integrale entro 5 giorni lavorativi.</li>
                </ul>
              </div>
            </div>
          </Block>
        </div>

        <PriceRail course={course} />
      </main>

      {/* correlati */}
      <section className="border-t border-ink/8 bg-sand/35 py-20" aria-labelledby="related-h">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <Tag>Continua a esplorare</Tag>
          </Reveal>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <Reveal delay={70}>
              <h2 id="related-h" className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold tracking-tight text-ink">
                Altre edizioni in calendario
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <Btn href="#/corsi" variant="ghost" withArrow>Catalogo completo</Btn>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:pb-10">
            {related.map((c, i) => (
              <Reveal key={c.slug} delay={i * 100}>
                <CourseCard course={c} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA mobile flottante */}
      {course.status !== "waitlist" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/90 p-3 lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-ink">{fmtRange(course.start, course.end)}</p>
              <p className="font-mono text-[11px] text-steel">
                {eur(getLivePrice(course).unit)} + IVA{course.seatsLeft != null && <> · <span className="text-flame">{course.seatsLeft} posti</span></>}
              </p>
            </div>
            <Btn href={`#/iscriviti/${course.slug}`} ariaLabel={`Iscriviti a ${course.short}`}>
              Iscriviti
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
