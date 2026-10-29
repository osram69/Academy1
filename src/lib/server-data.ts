import { courseSlug, eventSlug } from "./slug";

/** Dati pubblici letti sul server (Supabase REST, chiave anon) per metadati, sitemap e dati strutturati. */

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const REVALIDATE = 300;

/** null = database non raggiungibile o non configurato (in quel caso non si dichiara mai 404). */
async function rest<T>(table: string, query: string): Promise<T[] | null> {
  if (!URL_ || !KEY) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/${table}?${query}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, next: { revalidate: REVALIDATE } });
    if (!r.ok) return null;
    return (await r.json()) as T[];
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = { "&reg;": "®", "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&#039;": "'", "&trade;": "™" };
const plain = (html: string) =>
  (html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&#(x?[0-9a-f]+);/gi, (_e, n: string) => String.fromCodePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : parseInt(n, 10))).replace(/&[a-z]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e).replace(/\s+/g, " ").trim();

export interface SeoCourse {
  id: number;
  slug: string;
  title: string;
  level: string;
  concluded: boolean;
  open: boolean;
  online: boolean;
  residential: boolean;
  location: string;
  start: string; // AAAA-MM-GG
  end: string;
  price: number | null;
  earlyBirdPrice: number | null;
  seatsLeft: number | null;
  seatsTotal: number | null;
  schedule: string;
  language: string;
}

interface CourseRow {
  id_corso: number; titolo: string; livello: string | null; stato: number; iscrizioni_aperte: boolean; standard_price: number | null;
  early_bird_price: number | null; data_inizio: string | null; data_fine: string | null; posti_totali: number | null; posti_disponibili: number | null;
  luogo_it: string | null; orario_it: string | null; lingua_it: string | null;
}

export async function getCourses(): Promise<SeoCourse[] | null> {
  const rows = await rest<CourseRow>("corsi_public", "select=*&order=data_inizio.asc");
  if (!rows) return null;
  return rows
    .filter((r) => r.data_inizio && String(r.livello ?? "").trim().toLowerCase() !== "workshop" && r.stato !== 2)
    .map((r) => {
      const title = plain(r.titolo);
      const online = /online/i.test(r.luogo_it || "");
      const residential = /residential/i.test(r.titolo);
      const level = ["Foundation", "Advanced"].find((l) => l.toLowerCase() === String(r.livello ?? "").trim().toLowerCase()) ?? "Foundation";
      const start = String(r.data_inizio).slice(0, 10);
      return {
        id: r.id_corso, slug: courseSlug({ id: r.id_corso, level, online, residential, locationIt: r.luogo_it || "", start }),
        title, level, concluded: r.stato === 5, open: r.iscrizioni_aperte, online, residential, location: r.luogo_it || "",
        start, end: String(r.data_fine || r.data_inizio).slice(0, 10), price: r.standard_price, earlyBirdPrice: r.early_bird_price,
        seatsLeft: r.posti_disponibili, seatsTotal: r.posti_totali, schedule: r.orario_it || "", language: /^ital/i.test(r.lingua_it || "") ? "it" : "en",
      };
    });
}

export interface SeoEvent {
  id: string; slug: string; title: string; start: string | null; end: string | null; place: string; url: string; image: string | null; text: string;
}
interface EventRow { id: number; titolo: string; data_inizio: string | null; data_fine: string | null; luogo: string | null; link_evento: string | null; immagine_url: string | null; descrizione_it: string | null }

export async function getEvents(): Promise<SeoEvent[] | null> {
  const rows = await rest<EventRow>("eventi", "select=*");
  if (!rows) return null;
  return rows.map((r) => ({
    id: String(r.id), slug: eventSlug(r.id, r.titolo), title: r.titolo, start: r.data_inizio, end: r.data_fine || r.data_inizio,
    place: r.luogo || "", url: r.link_evento || "", image: r.immagine_url, text: (r.descrizione_it || "").trim(),
  }));
}
