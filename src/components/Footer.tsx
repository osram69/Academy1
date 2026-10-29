import { navigate } from "../lib/nav";
import { Mail, MapPin, Phone, Send, ShieldCheck, Lock, FileCheck } from "lucide-react";
import { ORG, upcomingCourses } from "../data";
import { isaqbLinks } from "../links";
import { ExtLink } from "./IsaqbLinks";

import { lang, t } from "../i18n";
import { LegalLinkModal } from "./LegalLinkModal";
import { CookiePolicyContent, PrivacyNoticeContent, TermsContent } from "./LegalContent";
import { TERMS } from "../legal/content";
import { openCookieSettings } from "../lib/consent";
export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="bg-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <a href="/" className="inline-block" aria-label={t("Cube Academy — Home")}>
              <img src="/img/logo-cube-academy.png" alt={t("Cube Academy")} width={1000} height={173} className="h-10 w-auto" />
            </a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/68">
              {t("Training Provider accreditato iSAQB® dal 2024. Formiamo gli architetti del software italiani — online e in aula a Roma.")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: ShieldCheck, label: t("Accreditato iSAQB®") },
                { icon: Lock, label: t("Pagamenti sicuri") },
                { icon: FileCheck, label: t("Fattura elettronica") },
              ].map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[11px] font-medium text-white/76"
                >
                  <b.icon className="size-3.5 text-flame" aria-hidden="true" />
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          <nav aria-label={t("Corsi")}>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white/56">{t("Corsi")}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {upcomingCourses().slice(0, 5).map((c) => (
                <li key={c.slug}>
                  <a href={`/corso/${c.slug}`} className="link-sweep text-white/76 transition-colors hover:text-white">
                    {c.short}
                  </a>
                </li>
              ))}
              <li>
                <a href="/corsi" className="link-sweep font-medium text-flame">
                  {t("Tutto il calendario →")}</a>
              </li>
            </ul>
          </nav>

          <nav aria-label={t("Academy")}>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white/56">{t("Academy")}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { label: t("La certificazione CPSA-F"), section: "certificazione" },
                { label: t("I formati"), section: "formati" },
                { label: t("FAQ"), section: "faq" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/");
                      setTimeout(() => document.getElementById(l.section)?.scrollIntoView({ behavior: "smooth" }), 120);
                    }}
                    className="link-sweep text-white/76 transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/eventi" className="link-sweep text-white/76 transition-colors hover:text-white">
                  {t("Eventi")}</a>
              </li>
              <li>
                <a href="/contatti?oggetto=gruppi" className="link-sweep text-white/76 transition-colors hover:text-white">
                  {t("Formazione per team")}</a>
              </li>
              <li>
                <a href="/contatti" className="link-sweep text-white/76 transition-colors hover:text-white">
                  {t("Contatti")}</a>
              </li>
            </ul>
            <h3 className="mt-7 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white/56">{t("Risorse iSAQB")}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[isaqbLinks().cpsaF, isaqbLinks().about, isaqbLinks().certification, isaqbLinks().exams, isaqbLinks().isaqbIt].map((x) => (
                <li key={x.href}>
                  <ExtLink href={x.href} className="font-normal text-white/76 transition-colors hover:text-white">{x.label}</ExtLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white/56">{t("Contatti")}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/76">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden="true" />
                {ORG.address}
              </li>
              <li>
                <a href={`mailto:${ORG.email}`} className="flex items-center gap-2.5 transition-colors hover:text-white">
                  <Mail className="size-4 shrink-0 text-flame" aria-hidden="true" />
                  {ORG.email}
                </a>
              </li>
              <li>
                <a href="/contatti" className="flex items-center gap-2.5 font-semibold text-white transition-colors hover:text-flame">
                  <Send className="size-4 shrink-0 text-flame" aria-hidden="true" />
                  {t("Scrivici con il modulo di contatto")}
                </a>
              </li>
              <li>
                <a href={`tel:${ORG.phone.replace(/ /g, "")}`} className="flex items-center gap-2.5 transition-colors hover:text-white">
                  <Phone className="size-4 shrink-0 text-flame" aria-hidden="true" />
                  {ORG.phone}
                </a>
              </li>
            </ul>
            <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-sm text-white/76">
              <li>
                <LegalLinkModal label={t("Privacy")} title={t("Informativa Privacy")} className="transition-colors hover:text-white">
                  <PrivacyNoticeContent />
                </LegalLinkModal>
              </li>
              <li>
                <LegalLinkModal label={t("Condizioni generali")} title={TERMS[lang].title} className="transition-colors hover:text-white">
                  <TermsContent />
                </LegalLinkModal>
              </li>
              <li>
                <LegalLinkModal label={t("Cookie Policy")} title={t("Cookie Policy")} className="transition-colors hover:text-white">
                  <CookiePolicyContent />
                </LegalLinkModal>
              </li>
              <li>
                <button type="button" onClick={openCookieSettings} className="transition-colors hover:text-white">{t("Impostazioni cookie")}</button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-center font-mono text-[11px] text-white/56">
          <p className="leading-relaxed">
            © 2026 {ORG.company} · {t("Sede legale")}: {ORG.legalAddress} · {t("P.IVA")} {ORG.vat} · {t("REA")} {ORG.rea}
          </p>
        </div>
      </div>
    </footer>
  );
}
