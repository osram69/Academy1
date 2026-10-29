import { supabase, supabaseConfigured } from "./lib/supabase";
import { lang, locale } from "./i18n";
import { eventSlug } from "./lib/slug";

/** Evento (articolo) della pagina #/eventi, gestito dal pannello #/admin/eventi. */
export interface EventItem {
  id: string;
  slug: string; // indirizzo leggibile: <id>-<titolo>
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
    slug: eventSlug(r.id, r.titolo),
    title: r.titolo,
    start: r.data_inizio,
    end: r.data_fine || r.data_inizio,
    place: r.luogo ?? "",
    url: r.link_evento ?? "",
    image: r.immagine_url,
    text: (r[key] || r.descrizione_it || "").trim(),
  };
};

/** Articoli pubblicati: prima gli eventi in arrivo, poi quelli senza data, poi i passati dal più recente. */
export async function fetchEvents(): Promise<EventItem[]> {
  if (!supabaseConfigured) throw new Error("Supabase non configurato");
  const { data, error } = await supabase.from("eventi").select("*");
  if (error) throw error;
  const items = (data as EventRow[]).map(fromRow);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items.filter((e) => e.end && e.end >= today).sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  const undated = items.filter((e) => !e.end);
  const past = items.filter((e) => e.end && e.end < today).sort((a, b) => (b.end ?? "").localeCompare(a.end ?? ""));
  return [...upcoming, ...undated, ...past];
}

/** Elenco di riserva, usato solo finché la tabella eventi non esiste ancora (migrazione-5.sql non eseguita). */
export const FALLBACK_EVENTS: EventItem[] = [
  { id: "che-cos-e-isaqb", slug: "che-cos-e-isaqb", title: "Che cos'è iSAQB®", start: null, end: null, place: "", url: "https://www.isaqb.org/about/association/", image: "/img/hero-structure.jpg", text: "iSAQB® (International Software Architecture Qualification Board) è un'associazione internazionale senza scopo di lucro che promuove l'architettura software come disciplina. Cube Academy è Training Provider accreditato iSAQB® dal 2024." },
  { id: "istf-2025", slug: "istf-2025", title: "Cube Academy allo Italian Software Testing Forum 2025", start: "2025-05-21", end: "2025-05-21", place: "Assago (Milano)", url: "https://www.soiel.it/eventi/stf-2025-milano/", image: "https://academy.cubeng.eu/wp-content/uploads/2025/03/IMG_20250521_101701-scaled.jpg", text: "Il 21 maggio 2025 Cube Academy ha partecipato all'Italian Software Testing Forum nello stand iSAQB®." },
  { id: "gathering-2024", slug: "gathering-2024", title: "Cube Academy al Software Architecture Gathering 2024 di Berlino", start: "2024-11-11", end: "2024-11-14", place: "Berlino", url: "https://www.software-architecture-gathering.com/", image: "https://academy.cubeng.eu/wp-content/uploads/2024/07/Berlino-1024x440.jpg", text: "Dall'11 al 14 novembre 2024 Cube Academy ha partecipato come sponsor al Software Architecture Gathering di Berlino." },
];

/** "11–14 novembre 2024", "19 maggio 2025", "28 ott – 2 nov 2024"; stringa vuota per gli articoli senza data. */
export function fmtEventDates(start: string | null, end: string | null): string {
  if (!start) return "";
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end || start}T12:00:00`);
  const f = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(locale, o);
  if (a.getTime() === b.getTime()) return f(a, { day: "numeric", month: "long", year: "numeric" });
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()}–${f(b, { day: "numeric", month: "long", year: "numeric" })}`;
  return `${f(a, { day: "numeric", month: "short" })} – ${f(b, { day: "numeric", month: "short", year: "numeric" })}`;
}
