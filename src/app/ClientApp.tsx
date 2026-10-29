"use client";

import { useCallback, useEffect, useState } from "react";
import App from "../App";
import { loadCourses } from "../data";
import { t } from "../i18n";

function LoadError({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 text-center">
      <div>
        <p className="font-display text-2xl font-bold text-ink">{t("Non riusciamo a caricare i corsi")}</p>
        <p className="mt-2 text-sm text-ink/60">{t("Il servizio è momentaneamente non raggiungibile. Riprova tra qualche istante.")}</p>
        <button onClick={retry} className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-flame">
          {t("Riprova")}
        </button>
      </div>
    </div>
  );
}

/** I corsi vengono dal database: si carica la lista prima del primo render. L'area #/admin parte comunque. */
export default function ClientApp() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const boot = useCallback(async () => {
    setState("loading");
    try {
      await loadCourses();
      setState("ready");
    } catch (e) {
      console.error(e);
      setState(window.location.pathname.startsWith("/admin") ? "ready" : "error");
    }
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  if (state === "error") return <LoadError retry={boot} />;
  if (state === "loading") return null;
  return <App />;
}
