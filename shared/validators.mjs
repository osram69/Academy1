// Controlli formali sui dati di iscrizione, condivisi da browser e server. Restituiscono true se il valore è valido.

const MONTH_LETTERS = "ABCDEHLMPRST";
const OMOCODIA = "LMNPQRSTUV"; // lettere che sostituiscono le cifre 0-9 nei casi di omocodia
const ODD = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];

/** Codice fiscale di persona fisica (16 caratteri): struttura, data di nascita plausibile e carattere di controllo. */
export function isCodiceFiscale(value) {
  const cf = String(value).replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf)) return false;
  if (!MONTH_LETTERS.includes(cf[8])) return false;

  const digit = (c) => (/\d/.test(c) ? Number(c) : OMOCODIA.indexOf(c));
  const day = digit(cf[9]) * 10 + digit(cf[10]);
  if (!((day >= 1 && day <= 31) || (day >= 41 && day <= 71))) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const c = cf[i];
    const v = /\d/.test(c) ? c.charCodeAt(0) - 48 : c.charCodeAt(0) - 65;
    sum += i % 2 === 0 ? ODD[v] : v; // posizioni dispari (1ª, 3ª, ...) usano la tabella dedicata
  }
  return String.fromCharCode(65 + (sum % 26)) === cf[15];
}

/** Partita IVA italiana (11 cifre) con cifra di controllo. */
export function isPartitaIva(value) {
  const v = String(value).replace(/\s/g, "");
  if (!/^\d{11}$/.test(v)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let d = Number(v[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10 === Number(v[10]);
}

/** Codice fiscale di società: coincide con la P.IVA (11 cifre) oppure è un codice di persona fisica. */
export const isCodiceFiscaleAny = (value) => isPartitaIva(value) || isCodiceFiscale(value);

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

/** Codice destinatario SDI: 7 caratteri alfanumerici. */
export const isSdi = (value) => /^[A-Za-z0-9]{7}$/.test(String(value).trim());

export const isCapItalia = (value) => /^\d{5}$/.test(String(value).trim());

/** Numero di telefono: cifre con prefisso e separatori facoltativi, da 6 a 15 cifre. */
export function isPhone(value) {
  const v = String(value).trim();
  if (!/^\+?[\d\s().-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 6 && digits <= 15;
}

/** VAT ID estero: prefisso paese di 2 lettere seguito da 2-12 caratteri alfanumerici. */
export const isVatIdEstero = (value) => /^[A-Za-z]{2}[A-Za-z0-9]{2,12}$/.test(String(value).replace(/[\s.-]/g, ""));
