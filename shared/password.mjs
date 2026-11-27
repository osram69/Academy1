// Password casuali facili da dettare: niente I l O 0 1, con maiuscole, minuscole, cifre e qualche simbolo.
// Usato sia dal server sia dall'interfaccia del pannello (stessa regola ovunque).
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*?";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

/** Intero casuale in [0, max) da crypto.getRandomValues, senza distorsione (scarta i valori oltre l'ultimo multiplo di max). */
export function cryptoInt(max) {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do globalThis.crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

export function generatePassword(length = 8, rnd = cryptoInt) {
  const pick = (set) => set[rnd(set.length)];
  // una per categoria, poi il resto a caso, poi si mescola
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) chars.push(pick(ALL));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
