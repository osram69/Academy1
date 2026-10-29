import { supabase, supabaseConfigured } from "./lib/supabase";
import { lang, locale, t } from "./i18n";

/** Evento (articolo) della pagina #/eventi, gestito dal pannello #/admin/eventi. */
export interface EventItem {
  id: string;
  title: string;
  start: string | null; // AAAA-MM-GG; null = data da definire
  end: string | null;
  place: string;
  url: string; // sito ufficiale dell'evento
  image: string | null;
  text: string; // paragrafi separati da una riga vuota
}

interface EventRow {
  id: number;
  titolo: string;
  data_inizio: string | null;
  data_fine: string | null;
  luogo: string | null;
  link_evento: string | null;
  immagine_url: string | null;
  descrizione_it: string | null;
  descrizione_en: string | null;
  descrizione_fr: string | null;
  descrizione_de: string | null;
}

const fromRow = (r: EventRow): EventItem => {
  const key = `descrizione_${lang}` as "descrizione_it";
  return {
    id: String(r.id),
    title: r.titolo,
    start: r.data_inizio,
    end: r.data_fine || r.data_inizio,
    place: r.luogo ?? "",
    url: r.link_evento ?? "",
    image: r.immagine_url,
    text: (r[key] || r.descrizione_it || "").trim(),
  };
};

/** Eventi pubblicati: prima quelli in arrivo (o senza data), poi i passati dal più recente. */
export async function fetchEvents(): Promise<EventItem[]> {
  if (!supabaseConfigured) throw new Error("Supabase non configurato");
  const { data, error } = await supabase.from("eventi").select("*");
  if (error) throw error;
  const items = (data as EventRow[]).map(fromRow);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items.filter((e) => !e.end || e.end >= today).sort((a, b) => (a.start ?? "9999").localeCompare(b.start ?? "9999"));
  const past = items.filter((e) => e.end && e.end < today).sort((a, b) => (b.end ?? "").localeCompare(a.end ?? ""));
  return [...upcoming, ...past];
}

/** Elenco di riserva, usato solo finché la tabella eventi non esiste ancora (migrazione-5.sql non eseguita). */
export const FALLBACK_EVENTS: EventItem[] = [
  { id: "istf-2025", title: "Italian Software Testing Forum 2025", start: "2025-05-19", end: "2025-05-21", place: "Milano", url: "", image: "https://academy.cubeng.eu/wp-content/uploads/2025/03/IMG_20250521_101701-scaled.jpg", text: "Cube Academy ha partecipato all'Italian Software Testing Forum 2025 in qualità di partner accreditato iSAQB®." },
  { id: "gathering-2024", title: "iSAQB® Software Architecture Gathering 2024", start: "2024-11-11", end: "2024-11-14", place: "Berlino", url: "https://conferences.isaqb.org/software-architecture-gathering/", image: "https://academy.cubeng.eu/wp-content/uploads/2024/07/Berlino-1024x440.jpg", text: "La conferenza internazionale iSAQB® Software Architecture Gathering si è tenuta a Berlino." },
  { id: "presentazione-roma", title: "Evento di presentazione iSAQB a Roma", start: null, end: null, place: "Roma", url: "", image: "https://academy.cubeng.eu/wp-content/uploads/2024/07/pexels-davifnr-2064827-1024x683.jpg", text: "Evento di presentazione del board internazionale iSAQB per l'architettura software a Roma." },
];

export const isPast =(e: EventItem) => !!e.end && e.end < new Date().toISOString().slice(0, 10);

/** "11–14 novembre 2024", "19 maggio 2025", "28 ott – 2 nov 2024" oppure "Data da definire". */
export function fmtEventDates(start: string | null, end: string | null): string {
  if (!start) return t("Data da definire");
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end || start}T12:00:00`);
  const f = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(locale, o);
  if (a.getTime() === b.getTime()) return f(a, { day: "numeric", month: "long", year: "numeric" });
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()}–${f(b, { day: "numeric", month: "long", year: "numeric" })}`;
  return `${f(a, { day: "numeric", month: "short" })} – ${f(b, { day: "numeric", month: "short", year: "numeric" })}`;
}
