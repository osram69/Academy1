"use client";

import dynamic from "next/dynamic";
import { loadDictionary } from "../i18n";

// niente rendering sul server: i moduli leggono lingua e storage del browser all'avvio
// il dizionario della lingua arriva prima dell'app: i testi tradotti si calcolano all'avvio dei moduli
const ClientApp = dynamic(async () => { await loadDictionary(); return import("./ClientApp"); }, { ssr: false });

export default function ClientRoot() {
  return <ClientApp />;
}
