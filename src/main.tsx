import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { loadCourses } from "./data";

import { t } from "./i18n";
const root = createRoot(document.getElementById("root")!);

document.title = t("Cube Academy — Certificazione iSAQB® CPSA-F");
document.querySelector('meta[name="description"]')?.setAttribute("content", t("Cube Academy — Training Provider accreditato iSAQB® dal 2024. Corsi CPSA-Foundation online e in aula a Roma."));

function LoadError({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 text-center">
      <div>
        <p className="font-display text-2xl font-bold text-ink">{t("Non riusciamo a caricare i corsi")}</p>
        <p className="mt-2 text-sm text-ink/60">{t("Il servizio è momentaneamente non raggiungibile. Riprova tra qualche istante.")}</p>
        <button onClick={retry} className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-flame">
          {t("Riprova")}</button>
      </div>
    </div>
  );
}

// I corsi vengono dal database: si carica la lista prima del primo render.
// L'area #/admin non dipende dalla lista pubblica, quindi parte comunque.
async function boot() {
  try {
    await loadCourses();
  } catch (e) {
    console.error(e);
    if (!window.location.hash.startsWith("#/admin")) {
      root.render(<LoadError retry={boot} />);
      return;
    }
  }
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

boot();
