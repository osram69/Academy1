// Messaggio d'esito delle azioni (codici fissi: nel testo non entra mai nulla preso dall'indirizzo).
const OK: Record<string, string> = {
  creata: "Cartella creata.",
  eliminato: "Eliminato.",
};
const ERR: Record<string, string> = {
  "err-nome": "Nome non valido (niente / \\ o punto iniziale).",
  "err-esiste": "Esiste già un elemento con questo nome.",
  "err-vuoto": "Nessun file selezionato.",
  "err-tipo": "Tipo di file non consentito.",
  "err-grande": "File troppo grande.",
  grande: "File troppo grande.",
  parziale: "Alcuni file non sono stati caricati (tipo non consentito o troppo grandi).",
  vietato: "Operazione non consentita.",
};

export function Notice({ m, n }: { m?: string; n?: string }) {
  if (!m) return null;
  const count = /^\d{1,4}$/.test(n ?? "") ? Number(n) : 0;
  const text = m === "caricati" || m === "parziale" ? `${count === 1 ? "1 file caricato" : `${count} file caricati`}.${m === "parziale" ? ` ${ERR.parziale}` : ""}` : (OK[m] ?? ERR[m]);
  if (!text) return null;
  const bad = m in ERR && m !== "parziale";
  return (
    <p role="status" className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${bad ? "bg-err/10 text-err" : "bg-mint/10 text-mint"}`}>
      {text}
    </p>
  );
}
