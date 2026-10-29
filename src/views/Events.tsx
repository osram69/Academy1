import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { t } from "../i18n";
import { FALLBACK_EVENTS, fetchEvents, fmtEventDates, type EventItem } from "../events";
import { ExtLink } from "../components/IsaqbLinks";
import { Reveal, Tag } from "../components/ui";
import { cn } from "../utils/cn";

/** Carica gli eventi pubblicati; finché la tabella non esiste usa l'elenco di riserva. */
function useEvents() {
  const [items, setItems] = useState<EventItem[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchEvents().then((e) => alive && setItems(e)).catch(() => alive && setItems(FALLBACK_EVENTS));
    return () => { alive = false; };
  }, []);
  return items;
}

/** Intestazione come quella del Catalogo corsi: etichetta con quadrato rosso, titolo con accento corsivo, introduzione. */
function Header({ title, intro }: { title: React.ReactNode; intro?: string }) {
  return (
    <header className="relative overflow-hidden bg-ink pb-14 pt-32 text-white lg:pt-36">
      <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -left-40 top-0 size-[480px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <Tag dark>{t("Eventi")}</Tag>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(1.9rem,4.5vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.025em]">{title}</h1>
        </Reveal>
        {intro && (
          <Reveal delay={160}>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/68">{intro}</p>
          </Reveal>
        )}
      </div>
    </header>
  );
}

const paragraphs = (text: string) => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

/** Pagina #/eventi: appuntamenti di Cube Academy e della community iSAQB®. */
export function Events() {
  const items = useEvents();
  return (
    <div className="bg-paper">
      <Header
        title={<>{t("Dove")}{" "}<em className="font-serif italic text-flame">{t("ci incontri.")}</em></>}
        intro={t("Gli appuntamenti di Cube Academy e della community iSAQB®.")}
      />
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        {items === null ? (
          <p className="text-steel">{t("Caricamento…")}</p>
        ) : items.length === 0 ? (
          <p className="rounded-[24px] border border-dashed border-ink/20 p-12 text-center text-ink/60">{t("Nessun evento in programma al momento.")}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((e, i) => (
              <Reveal key={e.id} delay={(i % 3) * 90}>
                <article className={cn("group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift")}>
                  {e.image && <img src={e.image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] font-medium uppercase tracking-widest text-steel">
                      {e.start && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{fmtEventDates(e.start, e.end)}</span>}
                      {e.place && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{e.place}</span>}
                    </p>
                    <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">
                      <a href={`#/eventi/${e.id}`} className="after:absolute after:inset-0 after:content-[''] hover:text-flame">{e.title}</a>
                    </h2>
                    {e.text && <p className="mt-2.5 line-clamp-3 text-[14.5px] leading-relaxed text-ink/65">{paragraphs(e.text)[0]}</p>}
                    <p className="mt-auto pt-5 text-[14px] font-semibold text-flame">{t("Leggi tutto")}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/** Pagina dell'evento: immagine, date, descrizione completa e link al sito dell'evento. */
export function EventDetail({ id }: { id: string }) {
  const items = useEvents();
  const e = items?.find((x) => x.id === id);
  return (
    <div className="bg-paper">
      <Header title={e?.title ?? t("Eventi")} />
      <main className="mx-auto max-w-4xl px-5 py-10 lg:px-8 lg:py-14">
        <a href="#/eventi" className="link-sweep inline-flex items-center gap-1.5 text-[14px] font-semibold text-flame">
          <ArrowLeft className="size-4" aria-hidden="true" />{t("Tutti gli eventi")}
        </a>
        {items === null ? (
          <p className="mt-8 text-steel">{t("Caricamento…")}</p>
        ) : !e ? (
          <p className="mt-8 text-ink/60">{t("Evento non trovato.")}</p>
        ) : (
          <article className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card">
            {e.image && <img src={e.image} alt="" className="aspect-[16/8] w-full object-cover" />}
            <div className="p-6 sm:p-9">
              <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-ink/70">
                {e.start && <span className="inline-flex items-center gap-2 font-semibold text-ink"><CalendarDays className="size-4 text-flame" aria-hidden="true" />{fmtEventDates(e.start, e.end)}</span>}
                {e.place && <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-flame" aria-hidden="true" />{e.place}</span>}
              </p>
              <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-ink/75">
                {paragraphs(e.text).map((p, i) => <p key={i}>{p}</p>)}
              </div>
              {e.url && (
                <p className="mt-7 text-[15px]">
                  <ExtLink href={e.url} className="text-flame">{t("Vai al sito dell'evento")}</ExtLink>
                </p>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
