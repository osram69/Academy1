import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send } from "lucide-react";
import { cn } from "../utils/cn";
import { isEmail, isPhone } from "../../shared/validators.mjs";
import { ORG } from "../data";
import { lang, t } from "../i18n";
import { sendContact } from "../lib/api";
import { Tag } from "../components/ui";
import { LegalLinkModal } from "../components/LegalLinkModal";
import { PrivacyNoticeContent } from "../components/LegalContent";

/* Pagina "Contatti": modulo di contatto (#/contatti). Accetta #/contatti?oggetto=gruppi&corso=<nome> per precompilare. */

const TOPICS: { id: string; label: string }[] = [
  { id: "info", label: t("Informazioni sul corso") },
  { id: "iscrizione", label: t("Iscrizione o pagamento") },
  { id: "gruppi", label: t("Gruppi aziendali / edizioni dedicate") },
  { id: "attesa", label: t("Lista d'attesa") },
  { id: "rimborso", label: t("Rimborsi e fatturazione") },
  { id: "prestige", label: t("Corsi residenziali Prestige") },
  { id: "altro", label: t("Altro") },
];

type Field = "name" | "email" | "phone" | "message" | "consent";

function initialFromHash() {
  const query = new URLSearchParams((window.location.hash.split("?")[1] ?? ""));
  const topic = TOPICS.some((x) => x.id === query.get("oggetto")) ? (query.get("oggetto") as string) : "info";
  const course = query.get("corso") ?? "";
  let message = "";
  if (topic === "attesa" && course) message = t("Vorrei essere inserito in lista d'attesa per: {course}.", { course });
  if (topic === "gruppi") message = t("Vorremmo informazioni su un'edizione dedicata per il nostro team. Numero di partecipanti: ");
  return { topic, message };
}

export function Contact() {
  const initial = useMemo(initialFromHash, []);
  const startedAt = useRef(Date.now());
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: initial.topic, message: initial.message, consent: false, website: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const errors: Partial<Record<Field, string>> = {};
  if (form.name.trim().length < 2) errors.name = t("Obbligatorio");
  if (!form.email.trim()) errors.email = t("Obbligatorio");
  else if (!isEmail(form.email)) errors.email = t("Email non valida");
  if (form.phone.trim() && !isPhone(form.phone)) errors.phone = t("Numero di telefono non valido");
  if (form.message.trim().length < 10) errors.message = t("Scrivi almeno 10 caratteri");
  if (!form.consent) errors.consent = t("Consenso necessario per procedere");
  const show = (f: Field) => (attempted || touched[f] ? errors[f] : undefined);
  const touch = (f: Field) => setTouched((p) => ({ ...p, [f]: true }));
  const set = (patch: Partial<typeof form>) => setForm((p) => ({ ...p, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (Object.keys(errors).length) {
      document.querySelector(".field.err")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendContact({ ...form, lang, elapsedMs: Date.now() - startedAt.current });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="bg-paper">
      <header className="relative overflow-hidden bg-ink pb-14 pt-32 text-white lg:pt-36">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <Tag dark>{t("Contatti")}</Tag>
          <h1 className="mt-4 max-w-2xl font-display text-[clamp(1.9rem,4.5vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.025em]">
            {t("Scrivici,")}{" "}<em className="font-serif italic text-flame">{t("ti rispondiamo noi.")}</em>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-white/68">{t("Domande sui corsi, sulle iscrizioni, sulla fatturazione o su un'edizione per il tuo team: compila il modulo.")}</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1fr_340px] lg:px-8 lg:py-16">
        {done ? (
          <section className="rounded-3xl border border-mint/40 bg-emerald-50 p-8 text-center shadow-card" role="status">
            <CheckCircle2 className="mx-auto size-14 text-mint" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">{t("Messaggio inviato")}</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/70">
              {t("Grazie, abbiamo ricevuto la tua richiesta. Ti risponderemo il prima possibile all'indirizzo indicato: ti abbiamo mandato anche una copia del messaggio.")}
            </p>
            <a href="#/" className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-flame">{t("Torna alla home")}</a>
          </section>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="c-name">{t("Nome e cognome")}{" "}<span className="req" aria-hidden="true">*</span></label>
                <input id="c-name" className={cn("field", show("name") && "err")} autoComplete="name" value={form.name} aria-invalid={!!show("name")}
                  onChange={(e) => set({ name: e.target.value })} onBlur={() => touch("name")} />
                {show("name") && <p className="field-error" role="alert">{show("name")}</p>}
              </div>
              <div>
                <label className="label" htmlFor="c-email">{t("Email")}{" "}<span className="req" aria-hidden="true">*</span></label>
                <input id="c-email" type="email" className={cn("field", show("email") && "err")} autoComplete="email" value={form.email} aria-invalid={!!show("email")}
                  onChange={(e) => set({ email: e.target.value })} onBlur={() => touch("email")} />
                {show("email") && <p className="field-error" role="alert">{show("email")}</p>}
              </div>
              <div>
                <label className="label" htmlFor="c-phone">{t("Telefono")}</label>
                <input id="c-phone" type="tel" className={cn("field", show("phone") && "err")} autoComplete="tel" placeholder="+39 333 000 0000" value={form.phone} aria-invalid={!!show("phone")}
                  onChange={(e) => set({ phone: e.target.value })} onBlur={() => touch("phone")} />
                {show("phone") ? <p className="field-error" role="alert">{show("phone")}</p> : <p className="field-note">{t("Facoltativo")}</p>}
              </div>
              <div>
                <label className="label" htmlFor="c-topic">{t("Argomento")}</label>
                <select id="c-topic" className="field" value={form.topic} onChange={(e) => set({ topic: e.target.value })}>
                  {TOPICS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="c-message">{t("Messaggio")}{" "}<span className="req" aria-hidden="true">*</span></label>
              <textarea id="c-message" rows={7} maxLength={3000} className={cn("field", show("message") && "err")} value={form.message} aria-invalid={!!show("message")}
                onChange={(e) => set({ message: e.target.value })} onBlur={() => touch("message")} />
              {show("message") && <p className="field-error" role="alert">{show("message")}</p>}
            </div>

            {/* campo trappola per i bot: invisibile alle persone */}
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="c-website">Website</label>
              <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set({ website: e.target.value })} />
            </div>

            <div>
              <label htmlFor="c-consent" className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3.5", show("consent") ? "border-err/50 bg-red-50/50" : "border-ink/12 bg-white")}>
                <input id="c-consent" type="checkbox" className="mt-1 size-4 accent-flame" checked={form.consent} onChange={(e) => set({ consent: e.target.checked })} onBlur={() => touch("consent")} />
                <span className="text-[13px] leading-snug text-ink/75">
                  {t("Acconsento al trattamento dei miei dati per rispondere a questa richiesta (GDPR 2016/679).")}{" "}
                  <LegalLinkModal label={t("(leggi l'informativa privacy)")} title={t("Informativa Privacy")}><PrivacyNoticeContent /></LegalLinkModal>{" "}
                  <span className="text-flame">*</span>
                </span>
              </label>
              {show("consent") && <p className="field-error" role="alert">{show("consent")}</p>}
            </div>

            {error && <p className="field-error" role="alert">{error}</p>}

            <button type="submit" disabled={busy}
              className="group inline-flex items-center gap-2.5 rounded-full bg-flame px-7 py-3.5 font-display text-sm font-semibold text-white shadow-flame transition-colors hover:bg-ink disabled:opacity-60">
              <Send className="size-4" aria-hidden="true" />
              {busy ? t("Invio in corso…") : t("Invia messaggio")}
            </button>
          </form>
        )}

        <aside className="space-y-4 lg:sticky lg:top-[calc(96px+var(--ribbon-h,0px))] lg:self-start" aria-label={t("Contatti")}>
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">{ORG.company}</h2>
            <ul className="mt-4 space-y-3.5 text-[14px] text-ink/75">
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden="true" />{ORG.address}</li>
              <li><a href={`tel:${ORG.phone.replace(/[ .]/g, "")}`} className="flex items-center gap-3 hover:text-flame"><Phone className="size-4 shrink-0 text-flame" aria-hidden="true" />{ORG.phone}</a></li>
              <li><a href={`mailto:${ORG.email}`} className="flex items-center gap-3 hover:text-flame"><Mail className="size-4 shrink-0 text-flame" aria-hidden="true" />{ORG.email}</a></li>
            </ul>
            <iframe
              title={t("Mappa della sede di Via Venti Settembre 118, Roma")}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="mt-5 h-48 w-full rounded-xl border border-ink/10"
              src="https://www.openstreetmap.org/export/embed.html?bbox=12.4894%2C41.9010%2C12.4975%2C41.9065&layer=mapnik&marker=41.9037423%2C12.4934357"
            />
            <a
              href="https://www.openstreetmap.org/?mlat=41.9037423&mlon=12.4934357#map=17/41.9037423/12.4934357"
              target="_blank"
              rel="noopener noreferrer"
              className="link-sweep mt-2 inline-block text-[12.5px] font-semibold text-flame"
            >
              {t("Apri la mappa ingrandita")}
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
