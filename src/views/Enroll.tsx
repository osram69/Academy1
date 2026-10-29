import { navigate } from "../lib/nav";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Flame,
  Globe,
  Info,
  Landmark,
  Link2,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  TicketPercent,
  Timer,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "../utils/cn";
import { Btn } from "../components/ui";
import { computeTotals } from "../../shared/pricing.mjs";
import { isCapItalia, isCodiceFiscale, isCodiceFiscaleAny, isEmail, isPartitaIva, isPhone, isSdi, isVatIdEstero } from "../../shared/validators.mjs";
import { LegalLinkModal } from "../components/LegalLinkModal";
import { ExtLink } from "../components/IsaqbLinks";
import { isaqbLinks } from "../links";
import { PrivacyNoticeContent, TermsContent } from "../components/LegalContent";
import { TERMS } from "../legal/content";
import { checkCoupon, createOrder, getConfig, type ApiConfig } from "../lib/api";
import {
  FORMAT_META,
  PAYMENT_METHODS,
  eur,
  eur2,
  fmtFull,
  fmtRange,
  getLivePrice,
  type Course,
  type MethodId,
} from "../data";

import { lang, t } from "../i18n";
/** Limite iSAQB: max 12 partecipanti per corso con un solo docente. */
const MAX_SEATS = 12;
/** Il singolo privato (per me stesso) iscrive una sola persona; professionisti e aziende fino a 12. */
const maxSeatsFor = (type: string) => (type === "privato" ? 1 : MAX_SEATS);

/* ================================ tipi =============================== */

interface Participant {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  cPrivacy: boolean;
  cMarketing: boolean;
  cAV: boolean;
}
const emptyParticipant = (): Participant => ({
  nome: "", cognome: "", email: "", telefono: "",
  cPrivacy: false, cMarketing: false, cAV: false,
});

type BillingType = "privato" | "pro" | "azienda" | "estera";

interface Billing {
  type: BillingType | ""; // vuoto finché non si sceglie per chi ci si iscrive: il prezzo non presume alcuno sconto
  nome: string; cognome: string; ragione: string;
  cf: string; piva: string; sdi: string; pec: string;
  via: string; cap: string; citta: string; paese: string; vatId: string;
}
const emptyBilling = (): Billing => ({
  type: "", nome: "", cognome: "", ragione: "", cf: "", piva: "",
  sdi: "", pec: "", via: "", cap: "", citta: "", paese: "Italia", vatId: "",
});

const STEPS = [t("Corso, posti e sconti"), t("Partecipanti"), t("Fatturazione"), t("Pagamento")];

const METHOD_ICONS: Record<MethodId, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  sumup: Link2,
  bonifico: Landmark,
};

/* ============================== micro-UI ============================= */

/** Chiamata quando un campo perde il focus: da lì in poi mostra il suo errore. */
const TouchCtx = createContext<(id?: string) => void>(() => undefined);

function TextField({
  label, req, error, hint, className, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; req?: boolean; error?: string; hint?: string }) {
  const touch = useContext(TouchCtx);
  return (
    <div className={className}>
      <label className="label" htmlFor={props.id}>
        {label} {req && <span className="req" aria-hidden="true">*</span>}
      </label>
      <input className={cn("field", error && "err")} aria-invalid={!!error} {...props} onBlur={(e) => { touch(props.id); props.onBlur?.(e); }} />
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-note">{hint}</p> : null}
    </div>
  );
}

function CheckRow({
  checked, onChange, title, desc, error, id, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; title: React.ReactNode; desc?: React.ReactNode; error?: string; id: string; disabled?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
        disabled ? "cursor-not-allowed border-ink/12 bg-white" : "cursor-pointer",
        error ? "border-err/50 bg-red-50/50" : checked ? "border-mint/40 bg-emerald-50/50" : !disabled && "border-ink/12 bg-white hover:border-ink/30"
      )}>
        <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" aria-invalid={!!error} />
        <span className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all",
          checked ? "border-mint bg-mint text-white" : disabled ? "border-ink/15 bg-ink/5" : "border-ink/25 bg-white"
        )} aria-hidden="true">
          {checked && <Check className="size-3.5" />}
        </span>
        <span className="min-w-0">
          <span className="block text-[13.5px] font-semibold leading-snug text-ink">{title}</span>
          {desc && <span className="mt-0.5 block text-[12px] leading-snug text-steel">{desc}</span>}
        </span>
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

/* ======================= step 1 · corso e posti ====================== */

/** Per chi ci si iscrive: decide fatturazione e sconti, quindi si sceglie subito. */
const AUDIENCE: { id: BillingType; label: string; desc: string; icon: typeof User }[] = [
  { id: "privato", label: t("Per me stesso"), desc: t("Come privato, senza P.IVA"), icon: User },
  { id: "pro", label: t("Per me, come professionista"), desc: t("Con la mia P.IVA individuale"), icon: CreditCard },
  { id: "azienda", label: t("Per la mia azienda"), desc: t("Azienda italiana: fattura con SDI o PEC"), icon: Building2 },
  { id: "estera", label: t("Per un'azienda estera"), desc: t("UE ed extra-UE"), icon: Globe },
];

interface CouponProps {
  coupon: { code: string; pct: number } | null;
  setCoupon: (c: { code: string; pct: number } | null) => void;
  couponInput: string; setCouponInput: (v: string) => void; couponError: string | null;
  onApplyCoupon: () => void;
}

function CouponBox({ coupon, setCoupon, couponInput, setCouponInput, couponError, onApplyCoupon }: CouponProps) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-7">
      <label htmlFor="coupon" className="label">{t("Codice sconto")}</label>
      {coupon ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-mint/35 bg-emerald-50 px-4 py-3">
          <span className="flex items-center gap-2.5 text-[14px] font-semibold text-mint">
            <TicketPercent className="size-4.5" aria-hidden="true" />
            {coupon.code}{" "}{t("— sconto −")}{Math.round(coupon.pct * 100)}{t("% applicato")}</span>
          <button type="button" onClick={() => setCoupon(null)} aria-label={t("Rimuovi codice sconto")}
            className="grid size-8 place-items-center rounded-full text-mint transition-colors hover:bg-mint hover:text-white">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2.5">
            <input id="coupon" className={cn("field uppercase", couponError && "err")} placeholder={t("Inserisci il codice")}
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onApplyCoupon(); } }} />
            <Btn variant="ink" type="button" onClick={onApplyCoupon} ariaLabel={t("Applica codice sconto")}>
              {t("Applica")}</Btn>
          </div>
          {couponError && <p className="field-error" role="alert">{couponError}</p>}
          <p className="field-note">{t("Gli sconti si cumulano con l'early bird.")}</p>
        </>
      )}
    </div>
  );
}

function StepConfigure({ course, count, setCount, maxSeats, billingType, setBillingType, privatePct, errors, ...couponProps }: {
  course: Course; count: number; setCount: (n: number) => void; maxSeats: number;
  billingType: BillingType | ""; setBillingType: (t: BillingType) => void; privatePct: number;
  errors: Record<string, string>;
} & CouponProps) {
  const price = getLivePrice(course);
  const fmt = FORMAT_META[course.format];
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card">
        <div className="relative h-36">
          <img src={course.image} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-ink/10" aria-hidden="true" />
          <p className="absolute bottom-3 left-5 rounded-full bg-ink/70 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
            {fmt.label}{" "}{t("· Livello")}{" "}{course.level}
          </p>
        </div>
        <div className="p-6">
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">{course.title}</h3>
          <p className="mt-2 text-[14px] text-ink/60">
            {fmtRange(course.start, course.end)} · {course.effort} · {course.location}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href="/corsi" className="link-sweep text-[13px] font-semibold text-flame">
              {t("Cambia edizione o corso →")}</a>
            {course.seatsLeft != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-3 py-1 text-[12px] font-semibold text-mint">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {course.seatsLeft}{" "}{t("posti disponibili")}</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-7">
        <label className="label" id="count-label">{t("Quante persone iscrivi?")}{" "}<span className="req" aria-hidden="true">*</span></label>
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center rounded-full border border-ink/15 bg-paper p-1" role="group" aria-labelledby="count-label">
            <button onClick={() => setCount(Math.max(1, count - 1))} disabled={count <= 1} aria-label={t("Riduci partecipanti")}
              className="grid size-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink hover:text-white disabled:opacity-30">
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-14 text-center font-display text-2xl font-bold tabular-nums" aria-live="polite">{count}</span>
            <button onClick={() => setCount(Math.min(maxSeats, count + 1))} disabled={count >= maxSeats} aria-label={t("Aumenta partecipanti")}
              className="grid size-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink hover:text-white disabled:opacity-30">
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 5, 12].filter((n) => n <= maxSeats).map((n) => (
              <button key={n} onClick={() => setCount(n)} aria-pressed={count === n}
                className={cn("rounded-full px-3.5 py-2 font-mono text-[12px] font-semibold transition-colors",
                  count === n ? "bg-ink text-white" : "border border-ink/15 text-ink/55 hover:border-ink hover:text-ink")}>
                {n}
              </button>
            ))}
          </div>
        </div>
        {maxSeats === 1 && <p className="field-note font-medium text-flame">{t("Iscrizione a titolo personale: un solo partecipante. Per iscrivere più persone scegli «Per me, come professionista» o «Per la mia azienda».")}</p>}
        <p className="field-note"><>{t("Massimo")}{" "}{course.seatsLeft != null ? Math.min(MAX_SEATS, course.seatsLeft) : MAX_SEATS}{" "}{t("posti per questa edizione ·")}{" "}</>{t("Prezzo a persona")}{" "}{eur(price.unit)}{" "}{t("+ IVA")}</p>
        {count >= 5 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-amber-50 p-4 text-[13px] leading-snug text-ink/75">
            <Users className="mt-0.5 size-4.5 shrink-0 text-gold" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-ink">{t("Gruppi aziendali:")}</strong>{" "}{t("ogni edizione ha al massimo 12 partecipanti. Per più persone o per un'edizione dedicata")}{" "}
              <a className="link-sweep font-semibold text-flame" href="/contatti?oggetto=gruppi">{t("scrivici")}</a>.
            </span>
          </div>
        )}
      </div>

      <fieldset className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-7">
        <legend className="sr-only">{t("Per chi ti stai iscrivendo?")}</legend>
        <p className="label">{t("Per chi ti stai iscrivendo?")}{" "}<span className="req" aria-hidden="true">*</span></p>
        <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label={t("Per chi ti stai iscrivendo?")}>
          {AUDIENCE.map((a) => (
            <label key={a.id} className={cn(
              "flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 transition-all",
              billingType === a.id ? "border-flame bg-flame/[0.06] shadow-card" : "border-ink/12 bg-white hover:border-ink/35"
            )}>
              <input type="radio" name="audience" className="sr-only" checked={billingType === a.id} onChange={() => setBillingType(a.id)} />
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                billingType === a.id ? "bg-flame text-white" : "bg-ink/6 text-ink/50")}>
                <a.icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-ink">
                  {a.label}
                  {a.id === "privato" && privatePct > 0 && (
                    <span className="rounded-full bg-mint px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">−{privatePct}%</span>
                  )}
                </span>
                <span className="block text-[12px] text-steel">{a.desc}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.type && <p className="field-error mt-3" role="alert">{errors.type}</p>}
        <p className="field-note">{t("Il prezzo nel riepilogo si adatta alla tua scelta.")}</p>
        {billingType === "privato" && privatePct > 0 && (
          <p className="mt-3 rounded-xl border border-mint/35 bg-emerald-50 px-4 py-3 text-[13.5px] font-medium text-mint" role="status">
            {t("Sconto privati −{pct}% sul listino", { pct: privatePct })}{" "}{t("applicato al riepilogo ordine.")}
          </p>
        )}
      </fieldset>

      <CouponBox {...couponProps} />
    </div>
  );
}

/* ========================= step 2 · partecipanti ===================== */

function StepParticipants({
  participants, update, errors, attempted,
}: {
  participants: Participant[];
  update: (i: number, patch: Partial<Participant>) => void;
  errors: Record<string, string>;
  attempted: boolean;
}) {
  const [open, setOpen] = useState(0);
  const isComplete = (p: Participant) => p.nome.trim() && p.cognome.trim() && isEmail(p.email) && (!p.telefono.trim() || isPhone(p.telefono)) && p.cPrivacy;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white p-4.5 text-[13.5px] leading-snug text-ink/70">
        <Info className="mt-0.5 size-4.5 shrink-0 text-flame" aria-hidden="true" />
        <p>
          {t("Servono i dati dei partecipanti per l'iscrizione al corso e l'attestato di partecipazione.")}{" "}<strong className="font-semibold text-ink">{t("L'esame iSAQB non è incluso")}</strong>{t(": si organizza a parte con gli enti autorizzati (280 € + IVA).")}{" "}<ExtLink href={isaqbLinks().exams.href} className="text-flame">{isaqbLinks().exams.label}</ExtLink></p>
      </div>

      {participants.map((p, i) => {
        const done = isComplete(p);
        const isOpen = open === i;
        const k = (f: string) => `p${i}-${f}`;
        return (
          <section key={i} className={cn("overflow-hidden rounded-3xl border bg-white transition-colors", isOpen ? "border-flame/40 shadow-card" : "border-ink/10")}
            aria-label={t("Partecipante {n}", { n: i + 1 })}>
            <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}
              className="flex w-full items-center gap-3.5 px-5 py-4 text-left sm:px-6">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full font-mono text-[11.5px] font-bold transition-colors",
                done ? "bg-mint text-white" : isOpen ? "bg-flame text-white" : "bg-ink/6 text-ink/55")}>
                {done ? <Check className="size-4" aria-hidden="true" /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] font-semibold tracking-tight text-ink">
                  {p.nome || p.cognome ? `${p.nome} ${p.cognome}`.trim() : t("Partecipante {n}", { n: i + 1 })}
                </span>
                <span className="block truncate font-mono text-[11px] text-steel">{p.email || t("dati da completare")}</span>
              </span>
              {done && <span className="hidden rounded-full bg-mint/10 px-2.5 py-1 text-[11px] font-semibold text-mint sm:inline">{t("Completo")}</span>}
              <ChevronDown className={cn("size-5 shrink-0 text-steel transition-transform duration-300", isOpen && "rotate-180 text-flame")} aria-hidden="true" />
            </button>

            <div className={cn("grid transition-all duration-400", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <div className="grid gap-4 border-t border-ink/8 p-5 sm:grid-cols-2 sm:p-6">
                  <TextField id={`${k("nome")}`} label={t("Nome")} req placeholder={t("Giulia")} autoComplete="given-name"
                    value={p.nome} onChange={(e) => update(i, { nome: e.target.value })}
                    error={attempted ? errors[k("nome")] : undefined} />
                  <TextField id={`${k("cognome")}`} label={t("Cognome")} req placeholder={t("Rossi")} autoComplete="family-name"
                    value={p.cognome} onChange={(e) => update(i, { cognome: e.target.value })}
                    error={attempted ? errors[k("cognome")] : undefined} />
                  <TextField id={`${k("email")}`} label={t("Email personale")} req type="email" placeholder={t("giulia.rossi@azienda.it")} autoComplete="email"
                    value={p.email} onChange={(e) => update(i, { email: e.target.value })}
                    error={attempted ? errors[k("email")] : undefined}
                    hint={t("Qui arrivano le istruzioni del corso e i materiali")} />
                  <TextField id={`${k("telefono")}`} label={t("Telefono")} type="tel" placeholder="+39 333 000 0000" autoComplete="tel"
                    value={p.telefono} onChange={(e) => update(i, { telefono: e.target.value })}
                    error={attempted ? errors[k("telefono")] : undefined} />
                  <fieldset className="grid gap-2.5 sm:col-span-2">
                    <legend className="sr-only">{t("Consensi di")}{" "}{p.nome || t("partecipante {n}", { n: i + 1 })}</legend>
                    <CheckRow id={`${k("privacy")}`} checked={p.cPrivacy} onChange={(v) => update(i, { cPrivacy: v })}
                      title={<>{t("Consenso privacy")}{" "}<span className="text-flame">*</span>{" "}{t("— necessario per l'iscrizione")}</>}
                      desc={<>{t("Trattamento dati per gestione del corso e adempimenti fiscali (GDPR 2016/679).")}{" "}<LegalLinkModal label={t("(leggi l'informativa privacy)")} title={t("Informativa Privacy")}><PrivacyNoticeContent /></LegalLinkModal></>}
                      error={attempted ? errors[k("privacy")] : undefined} />
                    <CheckRow id={`${k("marketing")}`} checked={p.cMarketing} onChange={(v) => update(i, { cMarketing: v })}
                      title={t("Novità e offerte (facoltativo)")}
                      desc={t("Novità su nuove edizioni del corso. Revocabile in qualsiasi momento.")} />
                  </fieldset>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ========================= step 3 · fatturazione ===================== */

const BILLING_TYPES: { id: BillingType; label: string; desc: string; icon: typeof User }[] = [
  { id: "privato", label: t("Privato"), desc: t("Persona fisica, senza P.IVA"), icon: User },
  { id: "pro", label: t("Libero professionista"), desc: t("P.IVA individuale"), icon: CreditCard },
  { id: "azienda", label: t("Azienda italiana"), desc: t("Con codice SDI / PEC"), icon: Building2 },
  { id: "estera", label: t("Azienda estera"), desc: t("UE ed extra-UE"), icon: Globe },
];

function StepBilling({ billing, set, errors, attempted, privatePct, onEditType }: {
  billing: Billing;
  privatePct: number;
  onEditType: () => void;
  set: (patch: Partial<Billing>) => void;
  errors: Record<string, string>;
  attempted: boolean;
}) {
  const btype = billing.type;
  const k = (f: string) => `f-${f}`;
  const err = (f: string) => (attempted ? errors[k(f)] : undefined);
  const isCompany = btype === "azienda" || btype === "estera";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-4 shadow-card">
        <p className="text-[14px] text-ink/75">
          {t("Fatturazione a")}{" "}<strong className="font-semibold text-ink">{BILLING_TYPES.find((x) => x.id === btype)?.label}</strong>
          {btype === "privato" && privatePct > 0 && <span className="ml-2 rounded-full bg-mint px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">−{privatePct}%</span>}
        </p>
        <button type="button" onClick={onEditType} className="link-sweep text-[13px] font-semibold text-flame">{t("Modifica")}</button>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          {isCompany ? (
            <TextField id="f-ragione" label={t("Ragione sociale")} req placeholder={t("Acme S.r.l.")} autoComplete="organization"
              className="sm:col-span-2" value={billing.ragione} onChange={(e) => set({ ragione: e.target.value })} error={err("ragione")} />
          ) : (
            <>
              <TextField id="f-nome" label={t("Nome")} req placeholder={t("Giulia")} autoComplete="given-name"
                value={billing.nome} onChange={(e) => set({ nome: e.target.value })} error={err("nome")} />
              <TextField id="f-cognome" label={t("Cognome")} req placeholder={t("Rossi")} autoComplete="family-name"
                value={billing.cognome} onChange={(e) => set({ cognome: e.target.value })} error={err("cognome")} />
            </>
          )}

          {btype !== "estera" && (
            <TextField id="f-cf" label={t("Codice fiscale")} req={!isCompany} placeholder={t("RSSMRA85M01H501Q")}
              value={billing.cf} onChange={(e) => set({ cf: e.target.value.toUpperCase() })}
              error={err("cf")} hint={isCompany ? t("Se diverso dalla P.IVA") : t("16 caratteri, es. RSSMRA85M01H501Q")} />
          )}
          {(btype === "pro" || btype === "azienda") && (
            <TextField id="f-piva" label={t("Partita IVA")} req inputMode="numeric" placeholder="01234567890" maxLength={11}
              value={billing.piva} onChange={(e) => set({ piva: e.target.value.replace(/\D/g, "") })}
              error={err("piva")} hint={t("11 cifre, fattura elettronica SDI")} />
          )}
          {btype === "estera" && (
            <TextField id="f-vatId" label={t("VAT / Tax ID")} req placeholder={t("DE123456789")}
              value={billing.vatId} onChange={(e) => set({ vatId: e.target.value.toUpperCase() })}
              error={err("vatId")} hint={t("Per inversione contabile IVA intra-UE")} />
          )}
          {(btype === "pro" || btype === "azienda") && (
            <>
              <TextField id="f-sdi" label={t("Codice SDI")} placeholder="A1B2C3D" maxLength={7}
                value={billing.sdi} onChange={(e) => set({ sdi: e.target.value.toUpperCase() })}
                error={err("sdi")} />
              <TextField id="f-pec" label={t("PEC")} type="email" placeholder={t("fatture@pec.acme.it")}
                value={billing.pec} onChange={(e) => set({ pec: e.target.value })}
                error={err("pec")} hint={t("SDI o PEC: almeno uno dei due")} />
            </>
          )}
          {btype === "estera" && (
            <TextField id="f-paese" label={t("Paese")} req placeholder={t("Germania")} autoComplete="country-name"
              value={billing.paese === "Italia" ? "" : billing.paese} onChange={(e) => set({ paese: e.target.value })} error={err("paese")} />
          )}

          <TextField id="f-via" label={t("Indirizzo e numero civico")} req placeholder={t("Via Roma 10")} autoComplete="street-address"
            className="sm:col-span-2" value={billing.via} onChange={(e) => set({ via: e.target.value })} error={err("via")} />
          <TextField id="f-cap" label={t("CAP")} req inputMode="numeric" placeholder="00187" autoComplete="postal-code"
            value={billing.cap} onChange={(e) => set({ cap: e.target.value.trim() })} error={err("cap")} />
          <TextField id="f-citta" label={t("Città")} req placeholder={t("Roma")} autoComplete="address-level2"
            value={billing.citta} onChange={(e) => set({ citta: e.target.value })} error={err("citta")} />
        </div>
      </div>

      <p className="flex items-start gap-2.5 text-[12.5px] leading-snug text-steel">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden="true" />
        {t("La fattura elettronica è emessa da Cube Engineering ai dati di fatturazione indicati.")}</p>
    </div>
  );
}

/* ================= step 4 · pagamento (componente chiave) ============ */

const SPEED_META = {
  fast: { label: t("Conferma immediata"), cls: "bg-emerald-50 text-mint ring-mint/25" },
  mid: { label: t("Entro 1 ora lavorativa"), cls: "bg-amber-50 text-gold ring-gold/30" },
  slow: { label: t("3–5 giorni lavorativi"), cls: "bg-ink/5 text-steel ring-ink/15" },
} as const;

function StepPayment({
  method, setMethod,
  terms, setTerms, errors, attempted, total, onPay, config, payError, busy,
}: {
  method: MethodId | null;
  setMethod: (m: MethodId) => void;
  terms: boolean; setTerms: (v: boolean) => void;
  errors: Record<string, string>; attempted: boolean;
  total: number;
  onPay: () => void;
  config: ApiConfig | null; payError: string; busy: boolean;
}) {
  const active = PAYMENT_METHODS.find((m) => m.id === method);
  // l'accettazione si sblocca solo dopo aver letto le Condizioni generali fino in fondo
  const [termsRead, setTermsRead] = useState(terms);
  return (
    <div className="space-y-5">
      {/* metodi */}
      <fieldset className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card">
        <legend className="sr-only">{t("Scegli il metodo di pagamento")}</legend>
        <p className="label">{t("Come preferisci pagare?")}{" "}<span className="req" aria-hidden="true">*</span></p>
        {errors.method && attempted && <p className="field-error mb-3" role="alert">{errors.method}</p>}

        <div className="grid gap-2.5" role="radiogroup" aria-label={t("Metodi di pagamento disponibili")}>
          {PAYMENT_METHODS.map((m) => {
            const selected = method === m.id;
            const Icon = METHOD_ICONS[m.id];
            const speed = SPEED_META[m.speed];
            const enabled = !config || config.methods[m.id as keyof ApiConfig["methods"]];
            return (
              <label key={m.id} className={cn(
                "group relative block rounded-2xl border p-4.5 transition-all duration-300",
                enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                selected ? "border-flame bg-flame/[0.05] shadow-card" : "border-ink/12 hover:border-ink/35"
              )}>
                <input type="radio" name="pay-method" className="sr-only" checked={selected} disabled={!enabled} onChange={() => setMethod(m.id)} />
                <span className="flex items-start gap-4">
                  <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
                    selected ? "bg-flame text-white" : "bg-ink/6 text-ink/55 group-hover:bg-ink/10")}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[15px] font-bold tracking-tight text-ink">{m.label}</span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1", speed.cls)}>
                        <Timer className="size-3" aria-hidden="true" />
                        {enabled ? speed.label : t("Non ancora attivo")}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-snug text-ink/60">{m.detail}</span>
                  </span>
                  <span className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    selected ? "border-flame bg-flame text-white" : "border-ink/25")} aria-hidden="true">
                    {selected && <Check className="size-3" strokeWidth={3.5} />}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {/* pannello esplicativo del metodo scelto */}
        <div className={cn("grid transition-all duration-500 ease-out", active ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="overflow-hidden">
            {active && (
              <div className="rounded-2xl bg-ink p-5 text-white" role="status">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ember">{t("Come funziona")}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/75">
                  {active.id === "stripe" && (
                    <>{t("Verrai reindirizzato al checkout sicuro Stripe (3-D Secure).")}{" "}<strong className="text-white">{t("Conferma istantanea.")}</strong>{" "}{t("Non memorizziamo i dati della carta.")}</>
                  )}
                  {active.id === "paypal" && (
                    <>{t("Accedi al tuo conto PayPal e confermi:")}{" "}<strong className="text-white">{t("conferma istantanea")}</strong>.</>
                  )}
                  {active.id === "sumup" && (
                    <>{t("Verrai reindirizzato al")}{" "}<strong className="text-white">{t("checkout sicuro SumUp")}</strong>{" "}{t("per pagare con carta. Conferma immediata.")}</>
                  )}
                  {active.id === "bonifico" && (
                    <>{t("Nessun pagamento ora: dopo la conferma ricevi IBAN e causale.")}{" "}<strong className="text-white">{t("I posti restano riservati per alcuni giorni lavorativi")}</strong>{t("; l'iscrizione è confermata alla ricezione del bonifico.")}</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* condizioni + CTA */}
      <CheckRow id="terms" checked={terms} onChange={setTerms} disabled={!termsRead}
        title={<>{t("Accetto le")}{" "}<LegalLinkModal label={t("Condizioni generali")} title={TERMS[lang].title} className="link-sweep text-flame" onRead={() => setTermsRead(true)}><TermsContent /></LegalLinkModal>{" "}{t("e la")}{" "}<LegalLinkModal label={t("Privacy policy")} title={t("Informativa Privacy")} className="link-sweep text-flame"><PrivacyNoticeContent /></LegalLinkModal> <span className="text-flame">*</span></>}
        desc={termsRead
          ? t("Inclusa la politica di rimborso: se il corso non viene erogato per mancanza del numero minimo di partecipanti, la quota è rimborsata.")
          : <span className="font-semibold text-flame">{t("Per accettare, apri le Condizioni generali e leggile fino in fondo.")}</span>}
        error={attempted ? errors.terms : undefined} />

      <div>
        <button
          type="button"
          onClick={onPay}
          disabled={!method || busy}
          className={cn(
            "group flex w-full items-center justify-between gap-4 rounded-2xl p-5 font-display font-bold text-white transition-all duration-300 disabled:cursor-not-allowed",
            method && terms ? "bg-mint shadow-card hover:bg-[#0f5a37]" : "bg-ink/25"
          )}
          aria-label={method ? t("{action}, totale {total}", { action: active?.cta ?? t("Procedi"), total: eur2(total) }) : t("Scegli un metodo di pagamento per proseguire")}
          aria-disabled={!method}
        >
          <span className="flex items-center gap-3 text-[15px]">
            <Lock className="size-4.5" aria-hidden="true" />
            {active ? active.cta : t("Scegli un metodo di pagamento")}
          </span>
          <span className="flex items-center gap-3">
            <span className="text-lg tabular-nums">{eur2(total)}</span>
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </button>
        <p className="mt-2 flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-steel">
          <ShieldCheck className="size-3.5 text-mint" aria-hidden="true" />
          {t("Transazione cifrata TLS · PCI-DSS · nessun dato carta sui nostri server")}</p>
      </div>
      {config?.testMode && (
        <p className="rounded-xl border border-dashed border-ink/25 bg-white/70 px-4 py-3 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-steel">
          {t("Ambiente di prova: pagamenti sandbox, nessun addebito reale")}</p>
      )}
      {payError && <p className="field-error" role="alert">{payError}</p>}
    </div>
  );
}

/* ============================ rail riepilogo ========================= */

/** Totali dell'ordine: stessa funzione usata dal server, che resta l'unica fonte dell'importo addebitato. */
function orderTotals(course: Course, count: number, coupon: { code: string; pct: number } | null, billingType: string, privatePct: number) {
  const price = getLivePrice(course);
  return {
    price,
    t: computeTotals({
      listEuro: course.price, earlyEuro: price.active ? price.unit : null, seats: count, billingType,
      privatePct: privatePct / 100, couponPct: coupon?.pct ?? 0, couponCode: coupon?.code ?? null,
    }),
  };
}

function OrderRail({ course, count, coupon, billingType, privatePct, step, goTo, maxStep }: {
  course: Course; count: number; coupon: { code: string; pct: number } | null; billingType: string; privatePct: number;
  step: number; goTo: (s: number) => void; maxStep: number;
}) {
  const { price, t: tot } = orderTotals(course, count, coupon, billingType, privatePct);
  const sub = tot.subtotal_cents / 100;
  const ebSave = price.active ? (course.price - price.unit) * count : 0;
  const extraSave = tot.discount_cents / 100 - ebSave; // sconto privati o codice
  const net = (tot.subtotal_cents - tot.discount_cents) / 100;
  const vat = tot.vat_cents / 100;
  const total = tot.total_cents / 100;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-lift">
        <div className="flex items-center justify-between bg-ink px-6 py-4 text-white">
          <p className="flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/70">
            <TicketPercent className="size-3.5 text-ember" aria-hidden="true" />
            {t("Il tuo ordine")}</p>
          {price.active && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-flame px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              <Flame className="size-3" aria-hidden="true" />
              {t("Early bird")}</span>
          )}
        </div>
        <div className="p-6">
          <p className="font-display text-[15px] font-bold leading-snug tracking-tight text-ink">{course.short}</p>
          <p className="mt-1 text-[12.5px] text-steel">{fmtRange(course.start, course.end)} · {course.location}</p>

          <dl className="mt-5 space-y-2.5 border-t border-ink/8 pt-5 text-[13.5px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">{count}{" "}{t("× quota")}{" "}{FORMAT_META[course.format].label}</dt>
              <dd className="font-semibold tabular-nums text-ink">{eur(sub)}</dd>
            </div>
            {price.active && (
              <div className="flex justify-between gap-4 text-mint">
                <dt className="flex items-center gap-1.5 font-medium">
                  <Flame className="size-3.5" aria-hidden="true" />
                  {t("Early bird −")}{Math.round(course.earlyBirdPct * 100)}{t("% (già applicato)")}</dt>
                <dd className="font-semibold tabular-nums">−{eur(ebSave)}</dd>
              </div>
            )}
            {!billingType && privatePct > 0 && (
              <p className="rounded-lg bg-flame/8 px-3 py-2 text-[12px] font-medium text-flame">
                {t("Scegli per chi ti iscrivi per vedere il prezzo definitivo: i privati hanno −{pct}% sul listino.", { pct: privatePct })}
              </p>
            )}
            {tot.applied && extraSave > 0 && (
              <div className="flex justify-between gap-4 text-mint">
                <dt className="font-medium">{tot.applied === "PRIVATO" ? t("Sconto privati −{pct}% sul listino", { pct: privatePct }) : t("Codice {code}", { code: tot.applied })}</dt>
                <dd className="font-semibold tabular-nums">−{eur(extraSave)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">{t("Imponibile")}</dt>
              <dd className="tabular-nums text-ink">{eur2(net)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">{t("IVA 22%")}</dt>
              <dd className="tabular-nums text-ink">{eur2(vat)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-end justify-between border-t-2 border-ink/80 pt-4">
            <p className="text-[13px] font-semibold text-ink">{t("Totale ordine")}</p>
            <p className="font-display text-[30px] font-bold leading-none tracking-tight text-ink" aria-live="polite">
              {eur2(total)}
            </p>
          </div>
          {price.active && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-flame/8 px-3 py-2 text-[11.5px] font-medium text-flame">
              <Timer className="size-3.5" aria-hidden="true" />
              {t("Prezzo bloccato fino al")}{" "}{fmtFull(price.until)}
            </p>
          )}
        </div>
      </div>

      {/* stepper verticale */}
      <nav aria-label={t("Avanzamento iscrizione")} className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card">
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            const clickable = i <= maxStep && i !== step;
            return (
              <li key={s}>
                <button
                  onClick={() => clickable && goTo(i)}
                  disabled={!clickable}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors",
                    clickable && "hover:bg-paper",
                    state === "current" && "bg-paper"
                  )}
                >
                  <span className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold transition-colors",
                    state === "done" && "bg-mint text-white",
                    state === "current" && "bg-flame text-white shadow-flame",
                    state === "todo" && "bg-ink/6 text-ink/40"
                  )}>
                    {state === "done" ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn(
                    "text-[13.5px] font-semibold",
                    state === "current" ? "text-ink" : state === "done" ? "text-ink/70" : "text-ink/40"
                  )}>
                    {s}
                  </span>
                  {state === "done" && <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-mint">{t("ok")}</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <ul className="space-y-2 px-1 text-[12px] leading-snug text-steel">
        {[
          { icon: RotateCcw, t: t("Rimborso se il corso non parte") },
          { icon: Landmark, t: t("Bonifico bancario") },
          { icon: Lock, t: t("Torna indietro quando vuoi: non perdi i dati") },
        ].map((r) => (
          <li key={r.t} className="flex items-start gap-2">
            <r.icon className="mt-0.5 size-3.5 shrink-0 text-mint" aria-hidden="true" />
            {r.t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================== wizard =============================== */

/** Il menu è alto 68 px; il riquadro ordine resta 2 cm (76 px) sotto di esso (sticky top-[144px]).
 *  Porta il titolo del passo ("Passo 1 di 4 · Corso e posti") subito sotto la barra del menu, saltando l'intestazione. */
function scrollToSteps(smooth = false) {
  const target = document.getElementById("enroll-steps");
  if (!target) return;
  const bar = document.getElementById("enroll-bar");
  const barH = bar && bar.offsetParent !== null ? bar.offsetHeight : 0; // sulla versione mobile la barra di avanzamento resta fissa sotto il menu
  const gap = barH ? barH + 20 : 76; // su desktop 2 cm sotto il menu, la stessa distanza del riquadro ordine
  const ribbon = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ribbon-h")) || 0; // nastro workshop sotto il menu
  const top = target.getBoundingClientRect().top + window.scrollY - (68 + ribbon + gap);
  window.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "instant" });
}

export function Enroll({ course }: { course: Course }) {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [count, setCountRaw] = useState(1);
  const [participants, setParticipants] = useState<Participant[]>([emptyParticipant()]);
  const [billing, setBillingRaw] = useState<Billing>(emptyBilling());
  const [method, setMethod] = useState<MethodId | null>(null);
  const [coupon, setCoupon] = useState<{ code: string; pct: number } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const privatePct = course.privateDiscount ? config?.privateDiscount ?? 0 : 0;
  const [payError, setPayError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileSummary, setMobileSummary] = useState(false);

  useEffect(() => {
    getConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  // aprendo l'iscrizione si parte già dal titolo del passo, senza dover scorrere l'intestazione
  useEffect(() => {
    const id = window.setTimeout(() => scrollToSteps(), 60);
    return () => window.clearTimeout(id);
  }, []);

  const setCount = (n: number) => {
    const clamped = Math.max(1, Math.min(maxSeatsFor(billing.type), n));
    setCountRaw(clamped);
    setParticipants((ps) => {
      if (clamped > ps.length) return [...ps, ...Array.from({ length: clamped - ps.length }, emptyParticipant)];
      return ps.slice(0, clamped);
    });
  };
  const updateParticipant = (i: number, patch: Partial<Participant>) =>
    setParticipants((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setBilling = (patch: Partial<Billing>) => setBillingRaw((b) => ({ ...b, ...patch }));

  /* ---------------------------- validazione -------------------------- */
  const validate = (s: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (s === 0 && !billing.type) errs.type = t("Scegli per chi ti stai iscrivendo");
    if (s === 1) {
      participants.forEach((p, i) => {
        if (!p.nome.trim()) errs[`p${i}-nome`] = t("Obbligatorio");
        if (!p.cognome.trim()) errs[`p${i}-cognome`] = t("Obbligatorio");
        if (!p.email.trim()) errs[`p${i}-email`] = t("Obbligatorio");
        else if (!isEmail(p.email)) errs[`p${i}-email`] = t("Email non valida");
        if (p.telefono.trim() && !isPhone(p.telefono)) errs[`p${i}-telefono`] = t("Numero di telefono non valido");
        if (!p.cPrivacy) errs[`p${i}-privacy`] = t("Consenso necessario per procedere");
      });
    }
    if (s === 2) {
      const bt = billing.type;
      const isCompany = bt === "azienda" || bt === "estera";
      const cf = billing.cf.trim();
      if (isCompany && !billing.ragione.trim()) errs["f-ragione"] = t("Obbligatorio");
      if (!isCompany && !billing.nome.trim()) errs["f-nome"] = t("Obbligatorio");
      if (!isCompany && !billing.cognome.trim()) errs["f-cognome"] = t("Obbligatorio");
      if (bt !== "estera") {
        if (!isCompany && !cf) errs["f-cf"] = t("Obbligatorio");
        else if (cf && !(isCompany ? isCodiceFiscaleAny(cf) : isCodiceFiscale(cf))) errs["f-cf"] = t("Codice fiscale non valido: controlla i caratteri");
      }
      if (bt === "pro" || bt === "azienda") {
        if (!billing.piva.trim()) errs["f-piva"] = t("Obbligatorio");
        else if (!isPartitaIva(billing.piva)) errs["f-piva"] = t("Partita IVA non valida: controlla le 11 cifre");
        if (billing.sdi.trim() && !isSdi(billing.sdi)) errs["f-sdi"] = t("Il codice SDI ha 7 caratteri");
        if (billing.pec.trim() && !isEmail(billing.pec)) errs["f-pec"] = t("PEC non valida");
        if (!billing.sdi.trim() && !billing.pec.trim()) errs["f-pec"] = t("Inserisci codice SDI o PEC");
      }
      if (bt === "estera") {
        if (!billing.vatId.trim()) errs["f-vatId"] = t("Obbligatorio");
        else if (!isVatIdEstero(billing.vatId)) errs["f-vatId"] = t("VAT ID non valido (es. DE123456789)");
        if (!billing.paese.trim() || billing.paese === "Italia") errs["f-paese"] = t("Indica il paese");
      }
      if (!billing.via.trim()) errs["f-via"] = t("Obbligatorio");
      if (!billing.cap.trim()) errs["f-cap"] = t("Obbligatorio");
      else if (bt !== "estera" && !isCapItalia(billing.cap)) errs["f-cap"] = t("CAP non valido: 5 cifre");
      if (!billing.citta.trim()) errs["f-citta"] = t("Obbligatorio");
    }
    if (s === 3) {
      if (!method) errs.method = t("Scegli uno dei 4 metodi di pagamento");
      if (!terms) errs.terms = t("Devi accettare le condizioni per procedere");
    }
    return errs;
  };

  /* gli errori di un campo compaiono quando perde il focus (o dopo "Continua") */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = useCallback((id?: string) => {
    if (id) setTouched((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }, []);
  const visibleErrors = (st: number): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [id, msg] of Object.entries(validate(st))) {
      if (attempted[st] || touched[id] || (id === "f-pec" && touched["f-sdi"])) out[id] = msg;
    }
    return out;
  };
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>({});

  const goNext = () => {
    const errs = validate(step);
    setCurrentErrors(errs);
    setAttempted((a) => ({ ...a, [step]: true }));
    if (Object.keys(errs).length > 0) {
      document.querySelector(".field.err, [role='alert']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const next = Math.min(3, step + 1);
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
    scrollToSteps(true);
  };
  const goTo = (s: number) => {
    setStep(s);
    setCurrentErrors({});
    scrollToSteps(true);
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    if (!billing.type) {
      setCouponError(t("Scegli prima per chi ti stai iscrivendo"));
      return;
    }
    try {
      setCoupon(await checkCoupon(course.id, code, billing.type));
      setCouponError(null);
    } catch (e) {
      setCoupon(null);
      setCouponError((e as Error).message);
    }
  };

  // un codice può valere solo per certe tipologie: se cambia la scelta lo si ricontrolla
  useEffect(() => {
    if (!coupon || !billing.type) return;
    let cancelled = false;
    checkCoupon(course.id, coupon.code, billing.type)
      .then((c) => { if (!cancelled) setCoupon(c); })
      .catch(() => {
        if (cancelled) return;
        setCoupon(null);
        setCouponError(t("Il codice non vale per questa tipologia: l'abbiamo rimosso."));
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing.type]);

  const pay = async () => {
    const errs = validate(3);
    setCurrentErrors(errs);
    setAttempted((a) => ({ ...a, 3: true }));
    if (Object.keys(errs).length > 0 || !method) return;
    setBusy(true);
    setPayError("");
    try {
      const res = await createOrder({ lang, courseId: course.id, seats: count, method, coupon: coupon?.code ?? null, participants, billing });
      if (res.url) window.location.href = res.url; // checkout del provider
      else navigate(`/esito/${encodeURIComponent(res.ref)}/pending`); // bonifico
    } catch (e) {
      setPayError((e as Error).message);
      setBusy(false);
    }
  };

  /* ------------------------------ prezzo ----------------------------- */
  const total = orderTotals(course, count, coupon, billing.type, privatePct).t.total_cents / 100;

  /* ------------------------------ wizard ----------------------------- */
  return (
    <TouchCtx.Provider value={touch}>
    <div className="bg-paper">
      {/* header */}
      <header className="relative overflow-hidden bg-ink pb-16 pt-32 text-white lg:pt-36">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/76">
            <CheckCircle2 className="size-3.5 text-mint" aria-hidden="true" />
            {t("Iscrizione guidata · 4 passi · circa 4 minuti")}</p>
          <h1 className="mt-5 max-w-2xl font-display text-[clamp(1.9rem,4.5vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.025em]">
            {t("Iscriviti a")}{" "}<em className="font-serif italic text-flame">{course.short}.</em>
          </h1>
          <p className="mt-3 text-[14.5px] text-white/68">
            {fmtRange(course.start, course.end)} · {course.effort} · {course.location}
          </p>
        </div>
      </header>

      {/* barra mobile sticky: progresso + totale */}
      <div id="enroll-bar" className="sticky top-[calc(68px+var(--ribbon-h,0px))] z-30 border-b border-ink/10 bg-paper/92 lg:hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink/70">
            {t("Passo")}{" "}{step + 1}<span className="text-ink/35">/4</span> — {STEPS[step]}
          </p>
          <button onClick={() => setMobileSummary((v) => !v)} aria-expanded={mobileSummary}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 font-mono text-[11.5px] font-bold text-white">
            {eur(total)}
            <ChevronDown className={cn("size-3.5 transition-transform", mobileSummary && "rotate-180")} aria-hidden="true" />
          </button>
        </div>
        <div className="h-[3px] bg-ink/8" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4} aria-label={t("Passo {n} di 4: {name}", { n: step + 1, name: STEPS[step] })}>
          <div className="h-full bg-flame transition-all duration-700" style={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>
        {mobileSummary && (
          <div className="border-t border-ink/8 px-5 pb-5 pt-4">
            <OrderRail course={course} count={count} coupon={coupon} billingType={billing.type} privatePct={privatePct} step={step} goTo={goTo} maxStep={maxStep} />
          </div>
        )}
      </div>

      {/* corpo */}
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-16">
        <div id="enroll-steps">
          {/* header step (desktop) */}
          <div className="mb-8 hidden lg:block">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-flame">
              {t("Passo")}{" "}{step + 1}{" "}{t("di 4")}</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">{STEPS[step]}</h2>
            {attempted[step] && Object.keys(currentErrors).length > 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-xl border border-err/30 bg-red-50 px-4 py-3 text-[13px] font-semibold text-err" role="alert">
                <AlertTriangle className="size-4" aria-hidden="true" />
                {t("Controlla i campi evidenziati: manca qualcosa per proseguire.")}</p>
            )}
          </div>

          {step === 0 && (
            <StepConfigure course={course} count={count} setCount={setCount}
              maxSeats={maxSeatsFor(billing.type)}
              billingType={billing.type} setBillingType={(type) => { setBilling({ type }); setCurrentErrors({}); if (maxSeatsFor(type) < count) setCount(maxSeatsFor(type)); }} privatePct={privatePct}
              errors={visibleErrors(0)}
              coupon={coupon} setCoupon={setCoupon}
              couponInput={couponInput} setCouponInput={setCouponInput} couponError={couponError}
              onApplyCoupon={applyCoupon} />
          )}
          {step === 1 && (
            <StepParticipants participants={participants} update={updateParticipant} errors={visibleErrors(1)} attempted />
          )}
          {step === 2 && (
            <StepBilling billing={billing} set={setBilling} errors={visibleErrors(2)} attempted privatePct={privatePct} onEditType={() => goTo(0)} />
          )}
          {step === 3 && (
            <StepPayment
              method={method} setMethod={setMethod}
              terms={terms} setTerms={setTerms}
              errors={currentErrors} attempted={!!attempted[3]}
              total={total} onPay={pay} config={config} payError={payError} busy={busy}
            />
          )}

          {/* nav step */}
          <div className="mt-9 flex items-center justify-between gap-4">
            {step > 0 ? (
              <button onClick={() => goTo(step - 1)}
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-[13.5px] font-semibold text-ink/70 transition-colors hover:border-ink hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t("Indietro")}</button>
            ) : (
              <a href={`/corso/${course.slug}`} className="inline-flex items-center gap-2 text-[13px] font-semibold text-steel transition-colors hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t("Torna alla scheda corso")}</a>
            )}
            {step < 3 && (
              <button onClick={goNext}
                className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 font-display text-sm font-semibold text-white transition-all duration-300 hover:bg-flame hover:shadow-flame">
                {t("Continua")}<ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* rail desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-[calc(144px+var(--ribbon-h,0px))]">
            <OrderRail course={course} count={count} coupon={coupon} billingType={billing.type} privatePct={privatePct} step={step} goTo={goTo} maxStep={maxStep} />
          </div>
        </div>
      </main>
    </div>
    </TouchCtx.Provider>
  );
}
