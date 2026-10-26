import { useEffect, useMemo, useState } from "react";
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

/** Limite iSAQB: max 12 partecipanti per corso con un solo docente. */
const MAX_SEATS = 12;

/* ================================ tipi =============================== */

interface Participant {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  cf: string;
  cPrivacy: boolean;
  cMarketing: boolean;
  cAV: boolean;
}
const emptyParticipant = (): Participant => ({
  nome: "", cognome: "", email: "", telefono: "", cf: "",
  cPrivacy: false, cMarketing: false, cAV: false,
});

type BillingType = "privato" | "pro" | "azienda" | "estera";

interface Billing {
  type: BillingType;
  nome: string; cognome: string; ragione: string;
  cf: string; piva: string; sdi: string; pec: string;
  via: string; cap: string; citta: string; paese: string; vatId: string;
}
const emptyBilling = (): Billing => ({
  type: "privato", nome: "", cognome: "", ragione: "", cf: "", piva: "",
  sdi: "", pec: "", via: "", cap: "", citta: "", paese: "Italia", vatId: "",
});

const STEPS = ["Corso e posti", "Partecipanti", "Fatturazione", "Pagamento"];

const METHOD_ICONS: Record<MethodId, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  sumup: Link2,
  bonifico: Landmark,
};

/* ============================== micro-UI ============================= */

function TextField({
  label, req, error, hint, className, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; req?: boolean; error?: string; hint?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={props.id}>
        {label} {req && <span className="req" aria-hidden="true">*</span>}
      </label>
      <input className={cn("field", error && "err")} aria-invalid={!!error} {...props} />
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-note">{hint}</p> : null}
    </div>
  );
}

function CheckRow({
  checked, onChange, title, desc, error, id,
}: { checked: boolean; onChange: (v: boolean) => void; title: React.ReactNode; desc?: string; error?: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
        error ? "border-err/50 bg-red-50/50" : checked ? "border-mint/40 bg-emerald-50/50" : "border-ink/12 bg-white hover:border-ink/30"
      )}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" aria-invalid={!!error} />
        <span className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all",
          checked ? "border-mint bg-mint text-white" : "border-ink/25 bg-white"
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

function StepConfigure({ course, count, setCount }: { course: Course; count: number; setCount: (n: number) => void }) {
  const price = getLivePrice(course);
  const fmt = FORMAT_META[course.format];
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card">
        <div className="relative h-36">
          <img src={course.image} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-ink/10" aria-hidden="true" />
          <p className="absolute bottom-3 left-5 rounded-full bg-ink/70 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
            {fmt.label} · Livello {course.level}
          </p>
        </div>
        <div className="p-6">
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">{course.title}</h3>
          <p className="mt-2 text-[14px] text-ink/60">
            {fmtRange(course.start, course.end)} · {course.effort} · {course.location}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href="#/corsi" className="link-sweep text-[13px] font-semibold text-flame">
              Cambia edizione o corso →
            </a>
            {course.seatsLeft != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-3 py-1 text-[12px] font-semibold text-mint">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {course.seatsLeft} posti disponibili
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-7">
        <label className="label" id="count-label">Quante persone iscrivi? <span className="req" aria-hidden="true">*</span></label>
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center rounded-full border border-ink/15 bg-paper p-1" role="group" aria-labelledby="count-label">
            <button onClick={() => setCount(Math.max(1, count - 1))} disabled={count <= 1} aria-label="Riduci partecipanti"
              className="grid size-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink hover:text-white disabled:opacity-30">
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-14 text-center font-display text-2xl font-bold tabular-nums" aria-live="polite">{count}</span>
            <button onClick={() => setCount(Math.min(MAX_SEATS, count + 1))} disabled={count >= MAX_SEATS} aria-label="Aumenta partecipanti"
              className="grid size-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink hover:text-white disabled:opacity-30">
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 5, 12].map((n) => (
              <button key={n} onClick={() => setCount(n)} aria-pressed={count === n}
                className={cn("rounded-full px-3.5 py-2 font-mono text-[12px] font-semibold transition-colors",
                  count === n ? "bg-ink text-white" : "border border-ink/15 text-ink/55 hover:border-ink hover:text-ink")}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <p className="field-note"><>Massimo {course.seatsLeft != null ? Math.min(MAX_SEATS, course.seatsLeft) : MAX_SEATS} posti per questa edizione · </>Prezzo a persona {eur(price.unit)} + IVA</p>
        {count >= 5 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-amber-50 p-4 text-[13px] leading-snug text-ink/75">
            <Users className="mt-0.5 size-4.5 shrink-0 text-gold" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-ink">Gruppi aziendali:</strong> ogni edizione ha al massimo 12
              partecipanti. Per più persone o per un'edizione dedicata{" "}
              <a className="link-sweep font-semibold text-flame" href="mailto:academy@cubeng.eu">scrivici</a>.
            </span>
          </div>
        )}
      </div>
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
  const isComplete = (p: Participant) => p.nome.trim() && p.cognome.trim() && /.+@.+\..+/.test(p.email) && p.cPrivacy;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white p-4.5 text-[13.5px] leading-snug text-ink/70">
        <Info className="mt-0.5 size-4.5 shrink-0 text-flame" aria-hidden="true" />
        <p>
          Servono i dati dei partecipanti per l'iscrizione al corso e l'attestato di partecipazione. <strong className="font-semibold text-ink">L'esame iSAQB non è incluso</strong>: si organizza a parte con gli enti autorizzati (280 € + IVA).
        </p>
      </div>

      {participants.map((p, i) => {
        const done = isComplete(p);
        const isOpen = open === i;
        const k = (f: string) => `p${i}-${f}`;
        return (
          <section key={i} className={cn("overflow-hidden rounded-3xl border bg-white transition-colors", isOpen ? "border-flame/40 shadow-card" : "border-ink/10")}
            aria-label={`Partecipante ${i + 1}`}>
            <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}
              className="flex w-full items-center gap-3.5 px-5 py-4 text-left sm:px-6">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full font-mono text-[11.5px] font-bold transition-colors",
                done ? "bg-mint text-white" : isOpen ? "bg-flame text-white" : "bg-ink/6 text-ink/55")}>
                {done ? <Check className="size-4" aria-hidden="true" /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] font-semibold tracking-tight text-ink">
                  {p.nome || p.cognome ? `${p.nome} ${p.cognome}`.trim() : `Partecipante ${i + 1}`}
                </span>
                <span className="block truncate font-mono text-[11px] text-steel">{p.email || "dati da completare"}</span>
              </span>
              {done && <span className="hidden rounded-full bg-mint/10 px-2.5 py-1 text-[11px] font-semibold text-mint sm:inline">Completo</span>}
              <ChevronDown className={cn("size-5 shrink-0 text-steel transition-transform duration-300", isOpen && "rotate-180 text-flame")} aria-hidden="true" />
            </button>

            <div className={cn("grid transition-all duration-400", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <div className="grid gap-4 border-t border-ink/8 p-5 sm:grid-cols-2 sm:p-6">
                  <TextField id={`${k("nome")}`} label="Nome" req placeholder="Giulia" autoComplete="given-name"
                    value={p.nome} onChange={(e) => update(i, { nome: e.target.value })}
                    error={attempted ? errors[k("nome")] : undefined} />
                  <TextField id={`${k("cognome")}`} label="Cognome" req placeholder="Rossi" autoComplete="family-name"
                    value={p.cognome} onChange={(e) => update(i, { cognome: e.target.value })}
                    error={attempted ? errors[k("cognome")] : undefined} />
                  <TextField id={`${k("email")}`} label="Email personale" req type="email" placeholder="giulia.rossi@azienda.it" autoComplete="email"
                    value={p.email} onChange={(e) => update(i, { email: e.target.value })}
                    error={attempted ? errors[k("email")] : undefined}
                    hint="Qui arrivano convocazione esame e materiali" />
                  <TextField id={`${k("telefono")}`} label="Telefono" type="tel" placeholder="+39 333 000 0000" autoComplete="tel"
                    value={p.telefono} onChange={(e) => update(i, { telefono: e.target.value })} />
                  <TextField id={`${k("cf")}`} label="Codice fiscale" placeholder="RSSGLI85M01H501Z" className="sm:col-span-2"
                    value={p.cf} onChange={(e) => update(i, { cf: e.target.value.toUpperCase() })}
                    error={attempted ? errors[k("cf")] : undefined}
                    hint="Facoltativo, 16 caratteri" />
                  <fieldset className="grid gap-2.5 sm:col-span-2">
                    <legend className="sr-only">Consensi di {p.nome || `partecipante ${i + 1}`}</legend>
                    <CheckRow id={`${k("privacy")}`} checked={p.cPrivacy} onChange={(v) => update(i, { cPrivacy: v })}
                      title={<>Consenso privacy <span className="text-flame">*</span> — necessario per iscrizione ed esame</>}
                      desc="Trattamento dati per gestione corso, certificazione iSAQB e adempimenti fiscali (GDPR 2016/679)."
                      error={attempted ? errors[k("privacy")] : undefined} />
                    <CheckRow id={`${k("av")}`} checked={p.cAV} onChange={(v) => update(i, { cAV: v })}
                      title="Registrazione audio-video (facoltativo)"
                      desc="Le sessioni live online possono essere registrate e condivise solo con i partecipanti dell'edizione." />
                    <CheckRow id={`${k("marketing")}`} checked={p.cMarketing} onChange={(v) => update(i, { cMarketing: v })}
                      title="Novità e offerte (facoltativo)"
                      desc="Novità su nuove edizioni del corso. Revocabile in qualsiasi momento." />
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
  { id: "privato", label: "Privato", desc: "Persona fisica, senza P.IVA", icon: User },
  { id: "pro", label: "Libero professionista", desc: "P.IVA individuale", icon: CreditCard },
  { id: "azienda", label: "Azienda italiana", desc: "Con codice SDI / PEC", icon: Building2 },
  { id: "estera", label: "Azienda estera", desc: "UE ed extra-UE", icon: Globe },
];

function StepBilling({ billing, set, errors, attempted }: {
  billing: Billing;
  set: (patch: Partial<Billing>) => void;
  errors: Record<string, string>;
  attempted: boolean;
}) {
  const t = billing.type;
  const k = (f: string) => `f-${f}`;
  const err = (f: string) => (attempted ? errors[k(f)] : undefined);
  const isCompany = t === "azienda" || t === "estera";

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="label">Chi riceve la fattura? <span className="req" aria-hidden="true">*</span></legend>
        <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Tipo di soggetto fatturante">
          {BILLING_TYPES.map((bt) => (
            <label key={bt.id} className={cn(
              "flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 transition-all",
              t === bt.id ? "border-flame bg-flame/[0.06] shadow-card" : "border-ink/12 bg-white hover:border-ink/35"
            )}>
              <input type="radio" name="billing-type" className="sr-only" checked={t === bt.id}
                onChange={() => set({ type: bt.id })} />
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                t === bt.id ? "bg-flame text-white" : "bg-ink/6 text-ink/50")}>
                <bt.icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold tracking-tight text-ink">{bt.label}</span>
                <span className="block text-[12px] text-steel">{bt.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          {isCompany ? (
            <TextField id="f-ragione" label="Ragione sociale" req placeholder="Acme S.r.l." autoComplete="organization"
              className="sm:col-span-2" value={billing.ragione} onChange={(e) => set({ ragione: e.target.value })} error={err("ragione")} />
          ) : (
            <>
              <TextField id="f-nome" label="Nome" req placeholder="Giulia" autoComplete="given-name"
                value={billing.nome} onChange={(e) => set({ nome: e.target.value })} error={err("nome")} />
              <TextField id="f-cognome" label="Cognome" req placeholder="Rossi" autoComplete="family-name"
                value={billing.cognome} onChange={(e) => set({ cognome: e.target.value })} error={err("cognome")} />
            </>
          )}

          {t !== "estera" && (
            <TextField id="f-cf" label="Codice fiscale" req={!isCompany} placeholder="RSSGLI85M01H501Z"
              value={billing.cf} onChange={(e) => set({ cf: e.target.value.toUpperCase() })}
              error={err("cf")} hint={isCompany ? "Se diverso dalla P.IVA" : undefined} />
          )}
          {(t === "pro" || t === "azienda") && (
            <TextField id="f-piva" label="Partita IVA" req inputMode="numeric" placeholder="01234567890" maxLength={11}
              value={billing.piva} onChange={(e) => set({ piva: e.target.value.replace(/\D/g, "") })}
              error={err("piva")} hint="11 cifre, fattura elettronica SDI" />
          )}
          {t === "estera" && (
            <TextField id="f-vatid" label="VAT / Tax ID" req placeholder="DE123456789"
              value={billing.vatId} onChange={(e) => set({ vatId: e.target.value.toUpperCase() })}
              error={err("vatId")} hint="Per inversione contabile IVA intra-UE" />
          )}
          {(t === "pro" || t === "azienda") && (
            <>
              <TextField id="f-sdi" label="Codice SDI" placeholder="A1B2C3D" maxLength={7}
                value={billing.sdi} onChange={(e) => set({ sdi: e.target.value.toUpperCase() })}
                error={err("sdipec")} />
              <TextField id="f-pec" label="PEC" type="email" placeholder="fatture@pec.acme.it"
                value={billing.pec} onChange={(e) => set({ pec: e.target.value })}
                error={err("sdipec")} hint="SDI o PEC: almeno uno dei due" />
            </>
          )}
          {t === "estera" && (
            <TextField id="f-paese" label="Paese" req placeholder="Germania" autoComplete="country-name"
              value={billing.paese === "Italia" ? "" : billing.paese} onChange={(e) => set({ paese: e.target.value })} error={err("paese")} />
          )}

          <TextField id="f-via" label="Indirizzo e numero civico" req placeholder="Via Roma 10" autoComplete="street-address"
            className="sm:col-span-2" value={billing.via} onChange={(e) => set({ via: e.target.value })} error={err("via")} />
          <TextField id="f-cap" label="CAP" req inputMode="numeric" placeholder="40121" autoComplete="postal-code"
            value={billing.cap} onChange={(e) => set({ cap: e.target.value })} error={err("cap")} />
          <TextField id="f-citta" label="Città" req placeholder="Roma" autoComplete="address-level2"
            value={billing.citta} onChange={(e) => set({ citta: e.target.value })} error={err("citta")} />
        </div>
      </div>

      <p className="flex items-start gap-2.5 text-[12.5px] leading-snug text-steel">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden="true" />
        Fattura elettronica emessa entro 48 ore dal pagamento. Per ordini d'acquisto (PO) aziendali, indica il
        riferimento nelle note della mail di conferma.
      </p>
    </div>
  );
}

/* ================= step 4 · pagamento (componente chiave) ============ */

const SPEED_META = {
  fast: { label: "Conferma immediata", cls: "bg-emerald-50 text-mint ring-mint/25" },
  mid: { label: "Entro 1 ora lavorativa", cls: "bg-amber-50 text-gold ring-gold/30" },
  slow: { label: "3–5 giorni lavorativi", cls: "bg-ink/5 text-steel ring-ink/15" },
} as const;

function StepPayment({
  method, setMethod, coupon, setCoupon, couponInput, setCouponInput, couponError, onApplyCoupon,
  terms, setTerms, errors, attempted, total, onPay, config, payError, busy,
}: {
  method: MethodId | null;
  setMethod: (m: MethodId) => void;
  coupon: { code: string; pct: number } | null;
  setCoupon: (c: { code: string; pct: number } | null) => void;
  couponInput: string; setCouponInput: (v: string) => void; couponError: string | null;
  onApplyCoupon: () => void;
  terms: boolean; setTerms: (v: boolean) => void;
  errors: Record<string, string>; attempted: boolean;
  total: number;
  onPay: () => void;
  config: ApiConfig | null; payError: string; busy: boolean;
}) {
  const active = PAYMENT_METHODS.find((m) => m.id === method);
  return (
    <div className="space-y-5">
      {/* coupon */}
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card">
        <label htmlFor="coupon" className="label">Codice sconto</label>
        {coupon ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-mint/35 bg-emerald-50 px-4 py-3">
            <span className="flex items-center gap-2.5 text-[14px] font-semibold text-mint">
              <TicketPercent className="size-4.5" aria-hidden="true" />
              {coupon.code} — sconto −{Math.round(coupon.pct * 100)}% applicato
            </span>
            <button onClick={() => setCoupon(null)} aria-label="Rimuovi codice sconto"
              className="grid size-8 place-items-center rounded-full text-mint transition-colors hover:bg-mint hover:text-white">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2.5">
              <input id="coupon" className={cn("field uppercase", couponError && "err")} placeholder="Inserisci il codice"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && onApplyCoupon()} />
              <Btn variant="ink" type="button" onClick={onApplyCoupon} ariaLabel="Applica codice sconto">
                Applica
              </Btn>
            </div>
            {couponError && <p className="field-error" role="alert">{couponError}</p>}
            <p className="field-note">Gli sconti si cumulano con l'early bird.</p>
          </>
        )}
      </div>

      {/* metodi */}
      <fieldset className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card">
        <legend className="sr-only">Scegli il metodo di pagamento</legend>
        <p className="label">Come preferisci pagare? <span className="req" aria-hidden="true">*</span></p>
        {errors.method && attempted && <p className="field-error mb-3" role="alert">{errors.method}</p>}

        <div className="grid gap-2.5" role="radiogroup" aria-label="Metodi di pagamento disponibili">
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
                        {enabled ? speed.label : "Non ancora attivo"}
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
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ember">Come funziona</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/75">
                  {active.id === "stripe" && (
                    <>Verrai reindirizzato al checkout sicuro Stripe (3-D Secure). <strong className="text-white">Conferma istantanea.</strong> Non memorizziamo i dati della carta.</>
                  )}
                  {active.id === "paypal" && (
                    <>Accedi al tuo conto PayPal e confermi: <strong className="text-white">conferma istantanea</strong>.</>
                  )}
                  {active.id === "sumup" && (
                    <>Verrai reindirizzato al <strong className="text-white">checkout sicuro SumUp</strong> per pagare con carta. Conferma immediata.</>
                  )}
                  {active.id === "bonifico" && (
                    <>Nessun pagamento ora: dopo la conferma ricevi IBAN e causale. <strong className="text-white">I posti restano riservati per alcuni giorni lavorativi</strong>; l'iscrizione è confermata alla ricezione del bonifico.</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* condizioni + CTA */}
      <CheckRow id="terms" checked={terms} onChange={setTerms}
        title={<>Accetto le <a href="#/" className="link-sweep text-flame">Condizioni generali</a> e la <a href="#/" className="link-sweep text-flame">Privacy policy</a> <span className="text-flame">*</span></>}
        desc="Inclusa la politica di rimborso: se il corso non viene erogato per mancanza del numero minimo di partecipanti, la quota è rimborsata."
        error={attempted ? errors.terms : undefined} />

      {config?.testMode && (
        <p className="rounded-xl border border-dashed border-ink/25 bg-white/70 px-4 py-3 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-steel">
          Ambiente di prova: pagamenti sandbox, nessun addebito reale
        </p>
      )}
      {payError && <p className="field-error" role="alert">{payError}</p>}

      <div className="sticky bottom-3 z-20">
        <button
          type="button"
          onClick={onPay}
          disabled={!method || busy}
          className={cn(
            "group flex w-full items-center justify-between gap-4 rounded-2xl p-5 font-display font-bold text-white transition-all duration-300 disabled:cursor-not-allowed",
            method ? "bg-flame shadow-flame hover:bg-ink" : "bg-ink/25"
          )}
          aria-label={method ? `${active?.cta ?? "Procedi"}, totale ${eur2(total)}` : "Scegli un metodo di pagamento per proseguire"}
          aria-disabled={!method}
        >
          <span className="flex items-center gap-3 text-[15px]">
            <Lock className="size-4.5" aria-hidden="true" />
            {active ? active.cta : "Scegli un metodo di pagamento"}
          </span>
          <span className="flex items-center gap-3">
            <span className="text-lg tabular-nums">{eur2(total)}</span>
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </button>
        <p className="mt-2 flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-steel">
          <ShieldCheck className="size-3.5 text-mint" aria-hidden="true" />
          Transazione cifrata TLS · PCI-DSS · nessun dato carta sui nostri server
        </p>
      </div>
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
  const { price, t } = orderTotals(course, count, coupon, billingType, privatePct);
  const sub = t.subtotal_cents / 100;
  const ebSave = price.active ? (course.price - price.unit) * count : 0;
  const extraSave = t.discount_cents / 100 - ebSave; // sconto privati o codice
  const net = (t.subtotal_cents - t.discount_cents) / 100;
  const vat = t.vat_cents / 100;
  const total = t.total_cents / 100;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-lift">
        <div className="flex items-center justify-between bg-ink px-6 py-4 text-white">
          <p className="flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/70">
            <TicketPercent className="size-3.5 text-ember" aria-hidden="true" />
            Il tuo ordine
          </p>
          {price.active && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-flame px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              <Flame className="size-3" aria-hidden="true" />
              Early bird
            </span>
          )}
        </div>
        <div className="p-6">
          <p className="font-display text-[15px] font-bold leading-snug tracking-tight text-ink">{course.short}</p>
          <p className="mt-1 text-[12.5px] text-steel">{fmtRange(course.start, course.end)} · {course.location}</p>

          <dl className="mt-5 space-y-2.5 border-t border-ink/8 pt-5 text-[13.5px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">{count} × quota {FORMAT_META[course.format].label}</dt>
              <dd className="font-semibold tabular-nums text-ink">{eur(sub)}</dd>
            </div>
            {price.active && (
              <div className="flex justify-between gap-4 text-mint">
                <dt className="flex items-center gap-1.5 font-medium">
                  <Flame className="size-3.5" aria-hidden="true" />
                  Early bird −{Math.round(course.earlyBirdPct * 100)}% (già applicato)
                </dt>
                <dd className="font-semibold tabular-nums">−{eur(ebSave)}</dd>
              </div>
            )}
            {t.applied && extraSave > 0 && (
              <div className="flex justify-between gap-4 text-mint">
                <dt className="font-medium">{t.applied === "PRIVATO" ? `Sconto privati −${privatePct}% sul listino` : `Codice ${t.applied}`}</dt>
                <dd className="font-semibold tabular-nums">−{eur(extraSave)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Imponibile</dt>
              <dd className="tabular-nums text-ink">{eur2(net)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">IVA 22%</dt>
              <dd className="tabular-nums text-ink">{eur2(vat)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-end justify-between border-t-2 border-ink/80 pt-4">
            <p className="text-[13px] font-semibold text-ink">Totale ordine</p>
            <p className="font-display text-[30px] font-bold leading-none tracking-tight text-ink" aria-live="polite">
              {eur2(total)}
            </p>
          </div>
          {price.active && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-flame/8 px-3 py-2 text-[11.5px] font-medium text-flame">
              <Timer className="size-3.5" aria-hidden="true" />
              Prezzo bloccato fino al {fmtFull(price.until)}
            </p>
          )}
        </div>
      </div>

      {/* stepper verticale */}
      <nav aria-label="Avanzamento iscrizione" className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card">
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
                  {state === "done" && <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-mint">ok</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <ul className="space-y-2 px-1 text-[12px] leading-snug text-steel">
        {[
          { icon: RotateCcw, t: "Rimborso se il corso non parte" },
          { icon: Landmark, t: "Bonifico bancario" },
          { icon: Lock, t: "Torna indietro quando vuoi: non perdi i dati" },
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
  const [payError, setPayError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileSummary, setMobileSummary] = useState(false);

  useEffect(() => {
    getConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  const setCount = (n: number) => {
    const clamped = Math.max(1, Math.min(MAX_SEATS, n));
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
    if (s === 1) {
      participants.forEach((p, i) => {
        if (!p.nome.trim()) errs[`p${i}-nome`] = "Obbligatorio";
        if (!p.cognome.trim()) errs[`p${i}-cognome`] = "Obbligatorio";
        if (!/.+@.+\..+/.test(p.email)) errs[`p${i}-email`] = "Email valida richiesta";
        if (p.cf && p.cf.replace(/\s/g, "").length !== 16) errs[`p${i}-cf`] = "Il codice fiscale ha 16 caratteri";
        if (!p.cPrivacy) errs[`p${i}-privacy`] = "Consenso necessario per procedere";
      });
    }
    if (s === 2) {
      const t = billing.type;
      const isCompany = t === "azienda" || t === "estera";
      if (isCompany && !billing.ragione.trim()) errs["f-ragione"] = "Obbligatorio";
      if (!isCompany && !billing.nome.trim()) errs["f-nome"] = "Obbligatorio";
      if (!isCompany && !billing.cognome.trim()) errs["f-cognome"] = "Obbligatorio";
      if (!isCompany && billing.cf.replace(/\s/g, "").length !== 16) errs["f-cf"] = "16 caratteri richiesti";
      if ((t === "pro" || t === "azienda") && !/^\d{11}$/.test(billing.piva)) errs["f-piva"] = "11 cifre numeriche";
      if ((t === "pro" || t === "azienda") && !billing.sdi.trim() && !billing.pec.trim())
        errs["f-sdipec"] = "Inserisci codice SDI o PEC";
      if (t === "estera" && !billing.vatId.trim()) errs["f-vatId"] = "Obbligatorio";
      if (t === "estera" && (!billing.paese.trim() || billing.paese === "Italia")) errs["f-paese"] = "Indica il paese";
      if (!billing.via.trim()) errs["f-via"] = "Obbligatorio";
      if (!billing.cap.trim()) errs["f-cap"] = "Obbligatorio";
      if (!billing.citta.trim()) errs["f-citta"] = "Obbligatorio";
    }
    if (s === 3) {
      if (!method) errs.method = "Scegli uno dei 4 metodi di pagamento";
      if (!terms) errs.terms = "Devi accettare le condizioni per procedere";
    }
    return errs;
  };
  const step0Errors = useMemo(() => validate(0), []); // sempre valido
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>({});
  void step0Errors;

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goTo = (s: number) => {
    setStep(s);
    setCurrentErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    try {
      setCoupon(await checkCoupon(Number(course.slug), code, billing.type));
      setCouponError(null);
    } catch (e) {
      setCoupon(null);
      setCouponError((e as Error).message);
    }
  };

  const pay = async () => {
    const errs = validate(3);
    setCurrentErrors(errs);
    setAttempted((a) => ({ ...a, 3: true }));
    if (Object.keys(errs).length > 0 || !method) return;
    setBusy(true);
    setPayError("");
    try {
      const res = await createOrder({ courseId: Number(course.slug), seats: count, method, coupon: coupon?.code ?? null, participants, billing });
      if (res.url) window.location.href = res.url; // checkout del provider
      else window.location.hash = `#/esito/${encodeURIComponent(res.ref)}/pending`; // bonifico
    } catch (e) {
      setPayError((e as Error).message);
      setBusy(false);
    }
  };

  /* ------------------------------ prezzo ----------------------------- */
  const total = orderTotals(course, count, coupon, billing.type, config?.privateDiscount ?? 0).t.total_cents / 100;

  /* ------------------------------ wizard ----------------------------- */
  return (
    <div className="bg-paper">
      {/* header */}
      <header className="relative overflow-hidden bg-ink pb-16 pt-32 text-white lg:pt-36">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/76">
            <CheckCircle2 className="size-3.5 text-mint" aria-hidden="true" />
            Iscrizione guidata · 4 passi · circa 4 minuti
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-[clamp(1.9rem,4.5vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.025em]">
            Iscriviti a <em className="font-serif italic text-flame">{course.short}.</em>
          </h1>
          <p className="mt-3 text-[14.5px] text-white/68">
            {fmtRange(course.start, course.end)} · {course.effort} · {course.location}
          </p>
        </div>
      </header>

      {/* barra mobile sticky: progresso + totale */}
      <div className="sticky top-[68px] z-30 border-b border-ink/10 bg-paper/92 lg:hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink/70">
            Passo {step + 1}<span className="text-ink/35">/4</span> — {STEPS[step]}
          </p>
          <button onClick={() => setMobileSummary((v) => !v)} aria-expanded={mobileSummary}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 font-mono text-[11.5px] font-bold text-white">
            {eur(total)}
            <ChevronDown className={cn("size-3.5 transition-transform", mobileSummary && "rotate-180")} aria-hidden="true" />
          </button>
        </div>
        <div className="h-[3px] bg-ink/8" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4} aria-label={`Passo ${step + 1} di 4: ${STEPS[step]}`}>
          <div className="h-full bg-flame transition-all duration-700" style={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>
        {mobileSummary && (
          <div className="border-t border-ink/8 px-5 pb-5 pt-4">
            <OrderRail course={course} count={count} coupon={coupon} billingType={billing.type} privatePct={config?.privateDiscount ?? 0} step={step} goTo={goTo} maxStep={maxStep} />
          </div>
        )}
      </div>

      {/* corpo */}
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-16">
        <div>
          {/* header step (desktop) */}
          <div className="mb-8 hidden lg:block">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-flame">
              Passo {step + 1} di 4
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">{STEPS[step]}</h2>
            {attempted[step] && Object.keys(currentErrors).length > 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-xl border border-err/30 bg-red-50 px-4 py-3 text-[13px] font-semibold text-err" role="alert">
                <AlertTriangle className="size-4" aria-hidden="true" />
                Controlla i campi evidenziati: manca qualcosa per proseguire.
              </p>
            )}
          </div>

          {step === 0 && <StepConfigure course={course} count={count} setCount={setCount} />}
          {step === 1 && (
            <StepParticipants participants={participants} update={updateParticipant} errors={currentErrors} attempted={!!attempted[1]} />
          )}
          {step === 2 && (
            <StepBilling billing={billing} set={setBilling} errors={currentErrors} attempted={!!attempted[2]} />
          )}
          {step === 3 && (
            <StepPayment
              method={method} setMethod={setMethod}
              coupon={coupon} setCoupon={setCoupon}
              couponInput={couponInput} setCouponInput={setCouponInput} couponError={couponError}
              onApplyCoupon={applyCoupon}
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
                Indietro
              </button>
            ) : (
              <a href={`#/corso/${course.slug}`} className="inline-flex items-center gap-2 text-[13px] font-semibold text-steel transition-colors hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Torna alla scheda corso
              </a>
            )}
            {step < 3 && (
              <button onClick={goNext}
                className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 font-display text-sm font-semibold text-white transition-all duration-300 hover:bg-flame hover:shadow-flame">
                Continua
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* rail desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <OrderRail course={course} count={count} coupon={coupon} billingType={billing.type} privatePct={config?.privateDiscount ?? 0} step={step} goTo={goTo} maxStep={maxStep} />
          </div>
        </div>
      </main>
    </div>
  );
}
