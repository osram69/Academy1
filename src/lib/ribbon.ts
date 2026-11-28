// Altezza totale dei nastri sotto la barra del menu (workshop, promozione): serve a --ribbon-h, che sposta ancore e punti "sticky" sotto di essi.
const parts = new Map<string, number>();

/** Registra l'altezza di un nastro (0 = non c'è più) e aggiorna --ribbon-h con la somma. */
export function setRibbonPart(key: string, px: number): void {
  if (px > 0) parts.set(key, px);
  else parts.delete(key);
  const total = [...parts.values()].reduce((a, b) => a + b, 0);
  if (total > 0) document.documentElement.style.setProperty("--ribbon-h", `${total}px`);
  else document.documentElement.style.removeProperty("--ribbon-h");
}
