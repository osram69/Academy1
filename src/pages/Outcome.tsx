import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Landmark,
  Mail,
  RotateCcw,
  Send,
  XCircle,
  CalendarDays,
  ReceiptText,
} from "lucide-react";
import { cn } from "../utils/cn";
import { BANK, eur2, fmtFull, fmtRange, PAYMENT_METHODS, type Course, type MethodId } from "../data";

export type OutcomeVariant = "success" | "sumup" | "bank" | "cancelled" | "error";

export interface OrderInfo {
  course: Course;
  count: number;
  total: number;
  method: MethodId;
  orderRef: string;
}

const VARIANT_META: Record<OutcomeVariant, { label: string }> = {
  success: { label: "Successo" },
  sumup: { label: "Link SumUp" },
  bank: { label: "Bonifico" },
  cancelled: { label: "Annullato" },
  error: { label: "Errore" },
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard non disponibile: il testo resta selezionabile */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">{label}</p>
        <p className="mt-0.5 truncate font-mono text-[13.5px] font-semibold text-ink">{value}</p>
      </div>
      <button
        onClick={copy}
        aria-label={`Copia ${label}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[11.5px] font-semibold text-ink/70 transition-colors hover:border-ink hover:text-ink"
      >
        {copied ? <Check className="size-3.5 text-mint" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {copied ? "Copiato" : "Copia"}
      </button>
    </div>
  );
}

function RecapCard({ order }: { order: OrderInfo }) {
  const method = PAYMENT_METHODS.find((m) => m.id === order.method)!;
  return (
    <dl className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-5 text-sm sm:grid-cols-2">
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">Corso</dt>
        <dd className="mt-1 flex items-center gap-1.5 font-semibold text-ink">
          <CalendarDays className="size-3.5 text-flame" aria-hidden="true" />
          {order.course.short} · {fmtRange(order.course.start, order.course.end)}
        </dd>
      </div>
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">Partecipanti</dt>
        <dd className="mt-1 font-semibold text-ink">
          {order.count} {order.count === 1 ? "persona" : "persone"}
        </dd>
      </div>
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">Metodo</dt>
        <dd className="mt-1 font-semibold text-ink">{method.label}</dd>
      </div>
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">Riferimento ordine</dt>
        <dd className="mt-1 font-mono text-[13px] font-semibold text-ink">{order.orderRef}</dd>
      </div>
      <div className="sm:col-span-2 border-t border-ink/8 pt-3">
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">Totale (IVA inclusa)</dt>
        <dd className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{eur2(order.total)}</dd>
      </div>
    </dl>
  );
}

export function Outcome({ variant, onVariant, order, onRestart }: {
  variant: OutcomeVariant;
  onVariant: (v: OutcomeVariant) => void;
  order: OrderInfo;
  onRestart: () => void;
}) {
  const holdUntil = new Date(Date.now() + 8 * 86400000);
  const causale = `Iscrizione ${order.course.short} ${fmtRange(order.course.start, order.course.end)} rif. ${order.orderRef}`;

  const head: Record<OutcomeVariant, { icon: React.ReactNode; kicker: string; title: string; sub: string; tone: string }> = {
    success: {
      icon: <CheckCircle2 className="size-16 text-mint" strokeWidth={1.4} aria-hidden="true" />,
      kicker: "Pagamento riuscito",
      title: "Sei dei nostri. Aula confermata.",
      sub: "Riceverai entro pochi minuti la mail di conferma con ricevuta, dettagli logistici e accesso all'area partecipanti.",
      tone: "border-mint/40 bg-emerald-50",
    },
    sumup: {
      icon: <Send className="size-16 text-flame" strokeWidth={1.4} aria-hidden="true" />,
      kicker: "Prenotazione registrata",
      title: "Il link di pagamento è in arrivo.",
      sub: "Controlla la casella email del referente: il link SumUp arriva entro 1 ora lavorativa ed è valido 48 ore. Al pagamento, i posti sono confermati.",
      tone: "border-flame/40 bg-flame/5",
    },
    bank: {
      icon: <Clock className="size-16 text-gold" strokeWidth={1.4} aria-hidden="true" />,
      kicker: "Posti bloccati per te",
      title: "Manca solo il bonifico.",
      sub: "I posti restano riservati fino al termine indicato. Se la contabilità aziendale richiede più tempo, scrivici: estendiamo il blocco.",
      tone: "border-gold/40 bg-amber-50",
    },
    cancelled: {
      icon: <XCircle className="size-16 text-steel" strokeWidth={1.4} aria-hidden="true" />,
      kicker: "Pagamento annullato",
      title: "Nessun addebito effettuato.",
      sub: "Hai annullato l'operazione sul circuito di pagamento. I dati inseriti sono ancora qui: puoi riprendere da dove eri rimasto, anche cambiando metodo.",
      tone: "border-ink/15 bg-white",
    },
    error: {
      icon: <AlertTriangle className="size-16 text-err" strokeWidth={1.4} aria-hidden="true" />,
      kicker: "Qualcosa non ha funzionato",
      title: "Il pagamento non è andato a buon fine.",
      sub: "Nessun importo è stato addebitato (eventuali pre-autorizzazioni rientrano in 24–48h). Riprova o scegli un altro metodo: il bonifico funziona sempre.",
      tone: "border-err/30 bg-red-50/60",
    },
  };
  const h = head[variant];

  return (
    <div className="mx-auto max-w-3xl">
      {/* switcher stati — strumento di anteprima per il cliente */}
      <div className="mb-10 rounded-2xl border border-dashed border-ink/25 bg-white/70 p-4">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-steel">
          Anteprima stati della pagina di esito (demo)
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Anteprima varianti di esito">
          {(Object.keys(VARIANT_META) as OutcomeVariant[]).map((v) => (
            <button
              key={v}
              onClick={() => onVariant(v)}
              aria-pressed={variant === v}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                variant === v ? "bg-ink text-white" : "border border-ink/15 text-ink/55 hover:border-ink hover:text-ink"
              )}
            >
              {VARIANT_META[v].label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-[28px] border shadow-card", h.tone)}>
        <div className="p-8 text-center sm:p-12">
          <div className="inline-flex rounded-full bg-white/80 p-3 shadow-card">{h.icon}</div>
          <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-steel">{h.kicker}</p>
          <h2 className="mt-3 font-display text-[clamp(1.7rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            {h.title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-ink/65">{h.sub}</p>
        </div>

        <div className="border-t border-ink/8 bg-paper/70 p-6 sm:p-8">
          <RecapCard order={order} />

          {variant === "bank" && (
            <div className="mt-5 space-y-2.5" aria-label="Coordinate bancarie per il bonifico">
              <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-steel">
                <Landmark className="size-4 text-gold" aria-hidden="true" />
                Coordinate per il bonifico
              </p>
              <CopyRow label="Intestatario" value={BANK.holder} />
              <CopyRow label="IBAN" value={BANK.iban} />
              <CopyRow label="Banca" value={BANK.bank} />
              <CopyRow label="Causale" value={causale} />
              <div className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-amber-50 px-4 py-3 text-[13px] leading-snug text-ink/75">
                <Clock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-ink">Posti riservati fino al {fmtFull(holdUntil)}.</strong>{" "}
                  Invia la distinta a{" "}
                  <a className="link-sweep font-semibold text-flame" href="mailto:academy@cubeng.eu">
                    academy@cubeng.eu
                  </a>{" "}
                  per accelerare la conferma (3–5 giorni con riconciliazione automatica).
                </span>
              </div>
            </div>
          )}

          {variant === "success" && (
            <ol className="mt-5 space-y-3" aria-label="Prossimi passi">
              {[
                { t: "Entro pochi minuti", d: "mail di conferma con ricevuta e istruzioni per l'aula (o il link Zoom)." },
                { t: "Entro 48 ore", d: "fattura elettronica al soggetto fatturante indicato in fase d'ordine." },
                { t: "7 giorni prima del corso", d: "mail logistica con agenda, materiali pre-corso e test dei prerequisiti." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-4 rounded-xl border border-ink/10 bg-white px-4 py-3.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint/12 font-mono text-[11px] font-bold text-mint">
                    {i + 1}
                  </span>
                  <p className="text-[13.5px] leading-snug text-ink/70">
                    <strong className="font-semibold text-ink">{s.t}:</strong> {s.d}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {variant === "success" || variant === "sumup" || variant === "bank" ? (
              <>
                <a href="#/" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-flame">
                  Torna alla home
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a href="#/corsi" className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 font-display text-sm font-semibold text-ink transition-colors hover:border-ink">
                  <ReceiptText className="size-4" aria-hidden="true" />
                  Vedi altri corsi
                </a>
              </>
            ) : (
              <>
                <button
                  onClick={onRestart}
                  className="inline-flex items-center gap-2 rounded-full bg-flame px-6 py-3 font-display text-sm font-semibold text-white shadow-flame transition-colors hover:bg-ink"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Riprendi l'iscrizione
                </button>
                <a
                  href="mailto:academy@cubeng.eu"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 font-display text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  Scrivici: ti aiutiamo noi
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
