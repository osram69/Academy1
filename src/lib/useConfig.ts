import { useEffect, useState } from "react";
import { getConfig, type ApiConfig } from "./api";

let cached: ApiConfig | null = null;

/** Configurazione pubblica dal server (metodi attivi, sconto privati). Null finché non arriva o se il server non risponde. */
export function useConfig(): ApiConfig | null {
  const [cfg, setCfg] = useState<ApiConfig | null>(cached);
  useEffect(() => {
    if (cached) return;
    getConfig().then((c) => { cached = c; setCfg(c); }).catch(() => undefined);
  }, []);
  return cfg;
}
