"use client";

import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { NO_CONSENT, OPEN_SETTINGS_EVENT, readConsent, saveConsent, type Consent } from "../lib/consent";
import { t } from "../i18n";
import { LegalLinkModal } from "./LegalLinkModal";
import { CookiePolicyContent } from "./LegalContent";

/** Banner di scelta dei cookie all'apertura del sito; si riapre da "Impostazioni cookie" nel footer. */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState(false);
  const [consent, setConsent] = useState<Consent>(NO_CONSENT);

  useEffect(() => {
    const saved = readConsent();
    if (saved) setConsent(saved);
    else setVisible(true);
    const open = () => {
      setConsent(readConsent() ?? NO_CONSENT);
      setSettings(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  const save = (next: Consent) => {
    setConsent(saveConsent(next));
    setVisible(false);
    setSettings(false);
  };

  if (!visible) return null;

  const btn = "rounded-full px-5 py-2.5 font-display text-[13.5px] font-semibold transition-colors";
  const option = (label: string, checked: boolean, opts: { note?: string; disabled?: boolean; onChange?: (v: boolean) => void } = {}) => (
    <label key={label} className="flex items-center justify-between gap-4 rounded-xl border border-white/12 bg-white/5 px-4 py-3">
      <span className="text-[14px] font-medium text-white">
        {label}
        {opts.note && <small className="ml-2 text-[11.5px] font-normal text-white/60">{opts.note}</small>}
      </span>
      <input type="checkbox" className="size-5 accent-flame" checked={checked} disabled={opts.disabled} onChange={(e) => opts.onChange?.(e.target.checked)} />
    </label>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-5" role="region" aria-label={t("La tua privacy, la tua scelta")}>
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/12 bg-ink2 p-5 text-white shadow-lift sm:p-7">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ember">COOKIE</span>
        <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight">{t("La tua privacy, la tua scelta")}</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/72">
          {t("Usiamo strumenti tecnici necessari per far funzionare il sito. Con il tuo consenso potremo usare anche cookie analitici, per capire quali pagine sono utili e migliorarle, e di marketing, per misurare le nostre campagne. Puoi cambiare scelta in ogni momento da «Impostazioni cookie» nel piè di pagina.")}{" "}
          <LegalLinkModal label={t("Cookie Policy")} title={t("Cookie Policy")} className="font-semibold text-ember underline underline-offset-2">
            <CookiePolicyContent />
          </LegalLinkModal>
        </p>

        {settings && (
          <div className="mt-4 space-y-2">
            {option(t("Cookie necessari"), true, { note: t("Sempre attivi"), disabled: true })}
            {option(t("Cookie analitici"), consent.analytics, { onChange: (v) => setConsent({ ...consent, analytics: v }) })}
            {option(t("Cookie marketing"), consent.marketing, { onChange: (v) => setConsent({ ...consent, marketing: v }) })}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <button className={cn(btn, "border border-white/25 text-white hover:border-white")} onClick={() => save(NO_CONSENT)}>{t("Solo necessari")}</button>
          {settings ? (
            <button className={cn(btn, "bg-flame text-white hover:bg-ember")} onClick={() => save(consent)}>{t("Salva preferenze")}</button>
          ) : (
            <>
              <button className={cn(btn, "text-white/80 hover:text-white")} onClick={() => setSettings(true)}>{t("Impostazioni")}</button>
              <button className={cn(btn, "bg-flame text-white hover:bg-ember")} onClick={() => save({ necessary: true, analytics: true, marketing: true })}>{t("Accetta tutti")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
