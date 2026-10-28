"use client";

import { useEffect } from "react";
import { CONSENT_EVENT, readConsent, setConsentDefaults, updateConsent, type Consent } from "../lib/consent";

function loadGtm(id: string) {
  if (document.getElementById("gtm-script")) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = "gtm-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/**
 * Google Tag Manager, attivo solo se NEXT_PUBLIC_GTM_ID è impostato e solo dopo il consenso agli analitici
 * (Consent Mode v2: tutto negato di default). Senza ID non carica nulla.
 */
export function Analytics() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_GTM_ID;
    if (!id) return;
    setConsentDefaults();
    const saved = readConsent();
    if (saved?.analytics) {
      updateConsent(saved);
      loadGtm(id);
    }
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<Consent>).detail;
      updateConsent(detail);
      if (detail?.analytics) loadGtm(id);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);
  return null;
}
