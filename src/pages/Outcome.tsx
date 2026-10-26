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
  XCircle,
  CalendarDays,
  ReceiptText,
} from "lucide-react";
import { cn } from "../utils/cn";
import { eur2, fmtRange, PAYMENT_METHODS, type Course, type MethodId } from "../data";
import type { BankDetails } from "../lib/api";

import { t } from "../i18n";
export type OutcomeVariant = "success" | "pending" | "bank" | "cancelled" | "error";

export interface OrderInfo {
  course: Course;
  count: number;
  total: number;
  method: MethodId;
  orderRef: string;
  bank?: BankDetails;
  testMode?: boolean;
}

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
        aria-label={t("Copia {label}", { label })}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[11.5px] font-semibold text-ink/70 transition-colors hover:border-ink hover:text-ink"
      >
        {copied ? <Check className="size-3.5 text-mint" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {copied ? t("Copiato") : t("Copia")}
      </button>
    </div>
  );
}

function RecapCard({ order }: { order: OrderInfo }) {
  const method = PAYMENT_METHODS.find((m) => m.id === order.method)!;
  return (
    <dl className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-5 text-sm sm:grid-cols-2">
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">{t("Corso")}</dt>
        <dd className="mt-1 flex items-center gap-1.5 font-semibold text-ink">
          <CalendarDays className="size-3.5 text-flame" aria-hidden="true" />
          {order.course.short} · {fmtRange(order.course.start, order.course.end)}
        </dd>
      </div>
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">{t("Partecipanti")}</dt>
        <dd className="mt-1 font-semibold text-ink">
          {order.count} {order.count === 1 ? t("persona") : t("persone")}
        </dd>
      </div>
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">{t("Metodo")}</dt>
        <dd className="mt-1 font-semibold text-ink">{method.label}</dd>
      </div>
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">{t("Riferimento ordine")}</dt>
        <dd className="mt-1 font-mono text-[13px] font-semibold text-ink">{order.orderRef}</dd>
      </div>
      <div className="sm:col-span-2 border-t border-ink/8 pt-3">
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">{t("Totale (IVA inclusa)")}</dt>
        <dd className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{eur2(order.total)}</dd>
      </div>
    </dl>
  );
}

export function Outcome({ variant, order }: { variant: OutcomeVariant; order: OrderInfo }) {
  const onRestart = () => { window.location.hash = `#/iscriviti/${order.course.slug}`; };
  const causale = `Iscrizione ${order.course.short} ${fmtRange(order.course.start, order.course.end)} rif. ${order.orderRef}`;

  const head: Record<OutcomeVariant, { icon: React.ReactNode; kicker: string; title: string; sub: string; tone: string }> = {
    success: {
      icon: <CheckCircle2 className="size-16 text-mint" strokeWidth={1.4} aria-hidden="true" />,
      kicker: t("Pagamento riuscito"),
      title: t("Sei dei nostri. Aula confermata."),
      sub: t("Abbiamo registrato il pagamento. Ti scriviamo all'indirizzo indicato con le istruzioni per partecipare al corso. Conserva il riferimento dell'ordine."),
      tone: "border-mint/40 bg-emerald-50",
    },
    pending: {
      icon: <Clock className="size-16 text-flame" strokeWidth={1.4} aria-hidden="true" />,
      kicker: t("Pagamento in verifica"),
      title: t("Stiamo aspettando la conferma del circuito."),
      sub: t("Il pagamento non risulta ancora confermato. Se hai completato l'operazione, ricarica questa pagina tra qualche minuto; in caso di dubbi scrivi a academy@cubeng.eu indicando il riferimento dell'ordine."),
      tone: "border-flame/40 bg-flame/5",
    },
    bank: {
      icon: <Clock className="size-16 text-gold" strokeWidth={1.4} aria-hidden="true" />,
      kicker: t("Iscrizione registrata"),
      title: t("Manca solo il bonifico."),
      sub: t("I posti restano riservati per alcuni giorni lavorativi. L'iscrizione è confermata alla ricezione del pagamento: se serve più tempo, scrivici."),
      tone: "border-gold/40 bg-amber-50",
    },
    cancelled: {
      icon: <XCircle className="size-16 text-steel" strokeWidth={1.4} aria-hidden="true" />,
      kicker: t("Pagamento annullato"),
      title: t("Nessun addebito effettuato."),
      sub: t("Hai annullato l'operazione sul circuito di pagamento. I dati inseriti sono ancora qui: puoi riprendere da dove eri rimasto, anche cambiando metodo."),
      tone: "border-ink/15 bg-white",
    },
    error: {
      icon: <AlertTriangle className="size-16 text-err" strokeWidth={1.4} aria-hidden="true" />,
      kicker: t("Qualcosa non ha funzionato"),
      title: t("Il pagamento non è andato a buon fine."),
      sub: t("Riprova o scegli un altro metodo. Per assistenza scrivi a academy@cubeng.eu."),
      tone: "border-err/30 bg-red-50/60",
    },
  };
  const h = head[variant];

  return (
    <div className="mx-auto max-w-3xl">
      {order.testMode && (
        <p className="mb-6 rounded-xl border border-dashed border-ink/25 bg-white/70 px-4 py-3 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-steel">
          {t("Ambiente di prova: nessun addebito reale")}</p>
      )}

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

          {variant === "bank" && order.bank && (
            <div className="mt-5 space-y-2.5" aria-label={t("Coordinate bancarie per il bonifico")}>
              <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-steel">
                <Landmark className="size-4 text-gold" aria-hidden="true" />
                {t("Coordinate per il bonifico")}</p>
              <CopyRow label={t("Intestatario")} value={order.bank.holder} />
              <CopyRow label={t("IBAN")} value={order.bank.iban} />
              {order.bank.bank && <CopyRow label={t("Banca")} value={order.bank.bank} />}
              <CopyRow label={t("Causale")} value={causale} />
              <div className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-amber-50 px-4 py-3 text-[13px] leading-snug text-ink/75">
                <Clock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-ink">{t("Posti riservati per alcuni giorni lavorativi.")}</strong>{" "}
                  {t("Invia la distinta a")}{" "}
                  <a className="link-sweep font-semibold text-flame" href="mailto:academy@cubeng.eu">
                    {t("academy@cubeng.eu")}</a>{" "}
                  {t("per accelerare la conferma.")}</span>
              </div>
            </div>
          )}

          {variant === "success" && (
            <ol className="mt-5 space-y-3" aria-label={t("Prossimi passi")}>
              {[
                { t: t("Conferma"), d: t("ti scriviamo all'email del partecipante con le istruzioni per collegarti al corso (Zoom).") },
                { t: t("Fattura"), d: t("Cube Engineering emette la fattura elettronica ai dati di fatturazione indicati.") },
                { t: t("Esame iSAQB®"), d: t("non è incluso: si organizza a parte con gli enti autorizzati (280 € + IVA).") },
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
            {variant === "success" || variant === "pending" || variant === "bank" ? (
              <>
                <a href="#/" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-flame">
                  {t("Torna alla home")}<ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a href="#/corsi" className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 font-display text-sm font-semibold text-ink transition-colors hover:border-ink">
                  <ReceiptText className="size-4" aria-hidden="true" />
                  {t("Vedi altri corsi")}</a>
              </>
            ) : (
              <>
                <button
                  onClick={onRestart}
                  className="inline-flex items-center gap-2 rounded-full bg-flame px-6 py-3 font-display text-sm font-semibold text-white shadow-flame transition-colors hover:bg-ink"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {t("Riprendi l'iscrizione")}</button>
                <a
                  href="mailto:academy@cubeng.eu"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 font-display text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {t("Scrivici: ti aiutiamo noi")}</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
