import { Mail, MapPin, Phone, Send, ShieldCheck, Lock, FileCheck } from "lucide-react";
import { ORG, upcomingCourses } from "../data";

import { t } from "../i18n";
export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="bg-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <a href="#/" className="inline-block" aria-label={t("Cube Academy — Home")}>
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
                  <a href={`#/corso/${c.slug}`} className="link-sweep text-white/76 transition-colors hover:text-white">
                    {c.short}
                  </a>
                </li>
              ))}
              <li>
                <a href="#/corsi" className="link-sweep font-medium text-flame">
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
                    href="#/"
                    onClick={(e) => {
                      e.preventDefault();
                      if (window.location.hash !== "#/") window.location.hash = "#/";
                      setTimeout(() => document.getElementById(l.section)?.scrollIntoView({ behavior: "smooth" }), 120);
                    }}
                    className="link-sweep text-white/76 transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#/contatti?oggetto=gruppi" className="link-sweep text-white/76 transition-colors hover:text-white">
                  {t("Formazione per team")}</a>
              </li>
              <li>
                <a href="#/contatti" className="link-sweep text-white/76 transition-colors hover:text-white">
                  {t("Contatti")}</a>
              </li>
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
                <a href="#/contatti" className="flex items-center gap-2.5 font-semibold text-white transition-colors hover:text-flame">
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
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 font-mono text-[11px] text-white/56 sm:flex-row sm:items-center">
          <p>
            © 2026 {ORG.company}{ORG.vat ? ` · ${ORG.vat}` : ""}
          </p>
          <p className="flex gap-5">
            <a href="#/" className="transition-colors hover:text-white/70">{t("Privacy")}</a>
            <a href="#/" className="transition-colors hover:text-white/70">{t("Cookie")}</a>
            <a href="#/" className="transition-colors hover:text-white/70">{t("Termini")}</a>
          </p>
        </div>
      </div>

      {/* watermark */}
      <div className="pointer-events-none relative select-none overflow-hidden" aria-hidden="true">
        <p className="text-outline -mb-[0.23em] text-center font-display text-[24vw] font-bold leading-none tracking-tight">
          {t("CUBE")}</p>
      </div>
    </footer>
  );
}
