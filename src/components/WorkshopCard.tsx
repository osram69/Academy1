import { navigate } from "../lib/nav";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock, Globe, MapPin, Presentation, Video } from "lucide-react";
import { cn } from "../utils/cn";
import { fmtFull, upcomingWorkshops, zoomOpensAt, zoomState, type Workshop } from "../data";
import { Reveal } from "./ui";
import { t } from "../i18n";

/** Descrizione abbreviata a 3 righe, con "Leggi di più" che espande la card verso il basso. */
function ClampedText({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !open) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text, open]);
  return (
    <div className={className}>
      <p ref={ref} className={cn("whitespace-pre-line", !open && "line-clamp-3")}>{text}</p>
      {(clamped || open) && (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="link-sweep mt-1.5 text-[13px] font-semibold text-flame">
          {open ? t("Mostra meno") : t("Leggi di più")}
        </button>
      )}
    </div>
  );
}

/** Pulsante verso l'evento LinkedIn (la prenotazione dei workshop avviene lì, non sul sito). */
function JoinButton({ w, className }: { w: Workshop; className?: string }) {
  if (!w.eventUrl) return null;
  return (
    <a
      href={w.eventUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("Iscriviti su LinkedIn a {name}", { name: w.title })}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-flame px-5 py-2.5 font-display text-[13.5px] font-semibold text-white shadow-flame transition-all duration-300 hover:bg-ink",
        className
      )}
    >
      {t("Iscriviti su LinkedIn")}
      <ArrowUpRight className="size-4" aria-hidden="true" />
    </a>
  );
}

/** Orologio che si aggiorna ogni 30 secondi: serve ad attivare il pulsante Zoom e il segnale "In corso" senza ricaricare la pagina. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(i);
  }, []);
  return now;
}

const isLive = (w: Workshop, now: number) => !!w.startsAt && !!w.endsAt && now >= w.startsAt.getTime() && now < w.endsAt.getTime();

/** Segnale "In corso" con punto lampeggiante. */
function LiveBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-err px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white", className)}>
      <span className="size-2 animate-pulse rounded-full bg-white" aria-hidden="true" />
      {t("In corso")}
    </span>
  );
}

/** Pulsante verso la sessione Zoom: grigio e disabilitato finché non manca 1 ora all'inizio, poi attivo fino alla fine. */
function ZoomButton({ w, now }: { w: Workshop; now: number }) {
  const s = zoomState(w, now);
  if (s === "none" || s === "ended") return null;
  if (s === "locked") {
    const today = (w.startsAt?.getTime() ?? 0) - now < 86400000;
    return (
      <span
        aria-disabled="true"
        title={t("Il link Zoom si attiva 1 ora prima dell'inizio")}
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-5 py-2.5 font-display text-[13.5px] font-semibold text-ink/45"
      >
        <Video className="size-4" aria-hidden="true" />
        {today ? t("Zoom dalle {time}", { time: zoomOpensAt(w) }) : t("Zoom: si attiva 1 ora prima")}
      </span>
    );
  }
  return (
    <a
      href={w.zoomUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("Partecipa su Zoom a {name}", { name: w.title })}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-[13.5px] font-semibold text-white transition-colors hover:bg-ink",
        s === "live" ? "bg-mint" : "bg-[#0b5cff]"
      )}
    >
      <Video className="size-4" aria-hidden="true" />
      {t("Partecipa su Zoom")}
      <ArrowUpRight className="size-4" aria-hidden="true" />
    </a>
  );
}

function Cover({ w, past, live }: { w: Workshop; past?: boolean; live?: boolean }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-ink">
      {w.image ? (
        <img src={w.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
      ) : (
        <div className="grid size-full place-items-center bg-blueprint-dark text-white/30">
          <Presentation className="size-12" aria-hidden="true" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" aria-hidden="true" />
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-ink/75 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white">{t("Workshop")}</span>
        {past ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink">
            <CheckCircle2 className="size-3.5 text-mint" aria-hidden="true" />{t("Svolto")}
          </span>
        ) : live ? (
          <LiveBadge />
        ) : (
          <span className="rounded-full bg-mint px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white">{t("Gratuito")}</span>
        )}
      </div>
    </div>
  );
}

/** Card del workshop: niente prezzi né iscrizione, ma data, orario, descrizione e link all'evento. */
export function WorkshopCard({ w, past = false }: { w: Workshop; past?: boolean }) {
  const now = useNow();
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
      <Cover w={w} past={past} live={isLive(w, now)} />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-[21px] font-bold leading-snug tracking-tight text-ink">{w.title}</h3>
        <ul className="mt-4 space-y-2 text-[13.5px] text-ink/70">
          <li className="flex items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0 text-flame" aria-hidden="true" />
            <span className="font-semibold text-ink">{fmtFull(w.start)}</span>
          </li>
          {w.time && (
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-flame" aria-hidden="true" />
              {w.time}
            </li>
          )}
          {w.place && (
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-flame" aria-hidden="true" />
              {w.place}
            </li>
          )}
          <li className="flex items-center gap-2.5">
            <Globe className="size-4 shrink-0 text-flame" aria-hidden="true" />
            <span>{t("Lingua")}: <span className="font-semibold text-ink">{w.language}</span></span>
          </li>
        </ul>
        {w.description && <ClampedText text={w.description} className="mt-4 text-[14px] leading-relaxed text-ink/65" />}
        {!past && (
          <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-6">
            <JoinButton w={w} />
            <ZoomButton w={w} now={now} />
          </div>
        )}
      </div>
    </article>
  );
}

/** Card compatta in bianco e nero per i workshop già svolti: compare nella sezione "Storico" accanto alle edizioni concluse. */
export function ConcludedWorkshopCard({ w }: { w: Workshop }) {
  return (
    <article
      aria-label={t("{title}, edizione conclusa, {range}, {place}", { title: w.title, range: fmtFull(w.start), place: w.place })}
      className="relative flex h-full flex-col overflow-hidden rounded-[22px] border border-ink/10 bg-white/70"
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-ink">
        {w.image ? (
          <img src={w.image} alt="" loading="lazy" className="size-full object-cover grayscale" />
        ) : (
          <div className="bg-blueprint-dark grid size-full place-items-center text-white/30"><Presentation className="size-10" aria-hidden="true" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-ink/10" aria-hidden="true" />
        <span className="absolute left-4 top-4 rounded-full bg-ink/75 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white">
          {t("Workshop")}
        </span>
        <span className="absolute bottom-3 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">
          <CheckCircle2 className="size-3.5 text-mint" aria-hidden="true" />
          {t("Concluso")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[17px] font-bold leading-snug tracking-tight text-ink/80">{w.title}</h3>
        <ul className="mt-3 space-y-1.5 text-[13px] text-ink/60">
          <li className="flex items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0 text-steel" aria-hidden="true" />
            <span className="font-semibold text-ink/75">{fmtFull(w.start)}</span>
          </li>
          {w.place && (
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-steel" aria-hidden="true" />
              {w.place}
            </li>
          )}
          <li className="flex items-center gap-2.5">
            <Globe className="size-4 shrink-0 text-steel" aria-hidden="true" />
            {t("Lingua")}: <span className="font-semibold text-ink/75">{w.language}</span>
          </li>
        </ul>
      </div>
    </article>
  );
}

/**
 * Nastro scorrevole sotto la barra menu, visibile in tutte le pagine quando c'è un workshop gratuito in programma.
 * Un clic porta alla sezione del workshop nella home. Imposta --ribbon-h così i punti "sticky" e le ancore
 * della pagina si spostano sotto il nastro.
 */
export function WorkshopTicker() {
  const now = useNow();
  const w = upcomingWorkshops().find((x) => x.ribbon); // solo se "attiva nastro" è spuntato nel pannello
  useEffect(() => {
    if (!w) return;
    document.documentElement.style.setProperty("--ribbon-h", "36px");
    return () => {
      document.documentElement.style.removeProperty("--ribbon-h");
    };
  }, [w]);
  if (!w) return null;
  const live = isLive(w, now);
  const when = `${fmtFull(w.start)}${w.time ? ` · ${w.time}` : ""}`;
  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
    setTimeout(() => document.getElementById("workshop")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };
  const item = (
    <span className="flex items-center gap-10 font-mono text-[11.5px] uppercase tracking-[0.24em] text-white/60 transition-colors group-hover:text-white/85">
      <span className="flex items-center gap-2.5">
        {live && <span className="size-2 animate-pulse rounded-full bg-flame" aria-hidden="true" />}
        <span className="font-semibold text-white/85">{live ? t("In corso") : t("Workshop gratuito")}</span> — {w.title} — {when}
        <span className="text-ember underline underline-offset-4">{t("Scopri di più")}</span>
      </span>
      <span className="inline-block size-[7px] rotate-45 bg-flame" aria-hidden="true" />
    </span>
  );
  return (
    <a
      href="/"
      onClick={go}
      aria-label={t("{kind}: {title}, {when}. Vai alla sezione del workshop", { kind: live ? t("In corso") : t("Workshop gratuito"), title: w.title, when })}
      className="group relative z-0 block h-9 overflow-hidden border-t border-white/10 bg-ink2"
    >
      <div className="flex h-full items-center overflow-hidden" aria-hidden="true">
        <div style={{ animationDuration: "52s" }} className="flex shrink-0 animate-marquee items-center gap-10 whitespace-nowrap pr-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10">
              {[0, 1, 2].map((n) => <span key={n} className="flex items-center gap-10">{item}</span>)}
            </div>
          ))}
        </div>
      </div>
    </a>
  );
}

/** Richiamo in home al prossimo workshop: compare solo se ne è stato previsto uno. */
export function WorkshopPromo() {
  const now = useNow();
  const w = upcomingWorkshops()[0];
  if (!w) return null;
  return (
    <section id="workshop" className="scroll-mt-[calc(69px+var(--ribbon-h,0px))] bg-paper pb-8 pt-12 lg:pb-8 lg:pt-16" aria-label={t("Prossimo workshop")}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <div className="grid overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-card md:grid-cols-[1.2fr_1fr]">
            {/* immagine a larghezza piena e senza ritagli (formato evento LinkedIn 1,91:1): lo spazio avanzato sopra e sotto resta bianco */}
            <div className="flex items-center bg-white">
              {w.image ? (
                <img src={w.image} alt="" loading="lazy" className="block h-auto w-full" />
              ) : (
                <div className="bg-blueprint-dark grid aspect-[1.91/1] w-full place-items-center text-white/30">
                  <Presentation className="size-14" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="p-7 lg:p-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-mint px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white">{t("Workshop gratuito")}</span>
                {isLive(w, now) && <LiveBadge />}
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-steel">{t("Prossimo workshop")}</span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(1.5rem,2.8vw,2.1rem)] font-bold leading-tight tracking-[-0.02em] text-ink">{w.title}</h2>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink/70">
                <span className="inline-flex items-center gap-2 font-semibold text-ink"><CalendarDays className="size-4 text-flame" aria-hidden="true" />{fmtFull(w.start)}</span>
                {w.time && <span className="inline-flex items-center gap-2"><Clock className="size-4 text-flame" aria-hidden="true" />{w.time}</span>}
                {w.place && <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-flame" aria-hidden="true" />{w.place}</span>}
                <span className="inline-flex items-center gap-2"><Globe className="size-4 text-flame" aria-hidden="true" />{w.language}</span>
              </p>
              {w.description && <ClampedText text={w.description} className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/65" />}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <JoinButton w={w} />
                <ZoomButton w={w} now={now} />
                <a href="/corsi" className="link-sweep text-[14px] font-semibold text-flame">{t("Tutti i workshop")}</a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
