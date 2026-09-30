// Definizione (whitelist) delle colonne della tabella corsi modificabili dal pannello admin.
// Tipi: str, html (HTML libero, solo admin), url, int, dec, bool, dt (datetime), date, state
export const LANGS = ["IT", "EN", "FR", "DE"];

// colonne per-lingua: nel DB alcune usano il trattino ("Data-IT"), altre l'underscore
const DASH = ["Data", "Luogo", "Lingua", "Note"];
export const langCol = (base, lang) => `${base}${DASH.includes(base) ? "-" : "_"}${lang}`;

const c = (name, type, opts = {}) => ({ name, type, nullable: true, ...opts });

export const COLUMNS = [
  c("Titolo", "html", { nullable: false, max: 255 }),
  c("Livello", "str", { max: 10 }),
  c("stato", "state"),
  c("in_evidenza", "bool"),
  c("iscrizioni_aperte", "bool"),
  c("standard_price", "int"),
  c("early_bird_price", "int"),
  c("early_bird_start", "dt", { nullable: false }),
  c("early_bird_end", "dt", { nullable: false }),
  c("early_bird_percentuale", "dec", { nullable: false }),
  c("data_inizio", "date"),
  c("data_fine", "date"),
  c("posti_totali", "int"),
  c("posti_disponibili", "int"),
  c("codice_sconto_privati", "str", { max: 10 }),
];

for (let i = 1; i <= 3; i++) {
  COLUMNS.push(
    c(`codice_sconto_${i}`, "str", { max: 50 }),
    c(`codice_sconto_${i}_data_inizio`, "dt"),
    c(`codice_sconto_${i}_data_fine`, "dt"),
    c(`codice_sconto_${i}_percentuale`, "dec")
  );
}

for (const l of LANGS) {
  COLUMNS.push(
    c(langCol("Data", l), "str", { max: 60 }),
    c(langCol("Luogo", l), "str", { max: 15 }),
    c(langCol("Lingua", l), "str", { max: 11 }),
    c(langCol("Note", l), "str", { max: 10 }),
    c(`link_readmore_${l}`, "url", { nullable: false, max: 150 }),
    c(`link_booking_${l}`, "url", { nullable: false, max: 150 }),
    c(`home_subtitle_${l}`, "html", { nullable: false }),
    c(`read_more_${l}`, "html")
  );
}

export const STATI = {
  0: "In Programma",
  1: "Confermato",
  2: "Non visualizzato",
  3: "Non Confermato",
  4: "In corso",
  5: "Completato",
};

const ZERO_DT = "0000-00-00 00:00:00";

/** Valida/normalizza un valore in arrivo dal form. Ritorna {ok, value} o {ok:false, error}. */
export function coerce(col, raw) {
  const empty = raw === undefined || raw === null || String(raw).trim() === "";
  switch (col.type) {
    case "bool":
      return { ok: true, value: raw === true || raw === 1 || raw === "1" || raw === "true" ? 1 : 0 };
    case "state": {
      const n = Number(raw);
      if (!(n in STATI)) return { ok: false, error: "stato non valido" };
      return { ok: true, value: n };
    }
    case "int": {
      if (empty) return { ok: true, value: null };
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) return { ok: false, error: "numero intero non valido" };
      return { ok: true, value: n };
    }
    case "dec": {
      if (empty) return { ok: true, value: col.nullable ? null : 0 };
      const n = Number(String(raw).replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > 100) return { ok: false, error: "percentuale non valida" };
      return { ok: true, value: n };
    }
    case "dt": {
      if (empty) return { ok: true, value: col.nullable ? null : ZERO_DT };
      const v = String(raw).trim().replace("T", " ");
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(v)) return { ok: false, error: "data/ora non valida" };
      return { ok: true, value: v.length === 16 ? v + ":00" : v };
    }
    case "date": {
      if (empty) return { ok: true, value: null };
      const v = String(raw).trim().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { ok: false, error: "data non valida" };
      return { ok: true, value: v };
    }
    case "url": {
      const v = empty ? "" : String(raw).trim();
      if (v && !/^https?:\/\//i.test(v)) return { ok: false, error: "URL non valido (deve iniziare con http:// o https://)" };
      if (col.max && v.length > col.max) return { ok: false, error: `massimo ${col.max} caratteri` };
      return { ok: true, value: v };
    }
    default: {
      // str / html
      const v = empty ? (col.nullable ? null : "") : String(raw);
      if (v && col.max && v.length > col.max) return { ok: false, error: `massimo ${col.max} caratteri` };
      return { ok: true, value: v };
    }
  }
}
