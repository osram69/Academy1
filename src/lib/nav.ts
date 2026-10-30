import { lang, withLang } from "../i18n";

/** Navigazione interna senza ricaricare la pagina (history API). Gli indirizzi sono percorsi veri: /corsi, /corso/<id>-..., /eventi/...
 *  Nelle lingue diverse dall'italiano portano il prefisso (/en/corsi): lo aggiunge `navigate`, chi la chiama usa i percorsi semplici. */

export const NAV_EVENT = "app:navigate";

/** Porta un vecchio indirizzo con hash (/corso/12) al percorso corrispondente. */
export const fromLegacy = (href: string) => (href.startsWith("#/") ? href.slice(1) : href);

export function navigate(to: string, replace = false) {
  const url = withLang(fromLegacy(to));
  if (url === window.location.pathname + window.location.search + window.location.hash) return;
  window.history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new Event(NAV_EVENT));
}

const SERVER_PATHS = /^\/(api|pagamento|_next)(\/|$)/;

/** Intercetta i clic sui link interni (anche i vecchi #/percorso presenti in testi salvati a database). */
export function installLinkInterceptor() {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const href = a.getAttribute("href") || "";
    const internal = href.startsWith("#/") || (href.startsWith("/") && !href.startsWith("//") && !SERVER_PATHS.test(href) && !/\.[a-z0-9]{2,5}($|[?#])/i.test(href));
    if (!internal) return;
    e.preventDefault();
    // già su quella pagina (logo o "Home" dalla home): non c'è nulla da caricare, si torna in cima
    if (withLang(fromLegacy(href)) === window.location.pathname + window.location.search) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(href);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

/**
 * Nelle pagine non italiane i link interni (scritti come /corsi in tutto il sito, anche nei testi del database) vengono portati
 * alla versione nella stessa lingua (/en/corsi): così chi legge la pagina, motori di ricerca compresi, resta nella sua lingua.
 */
export function installLangLinks() {
  if (lang === "it") return () => undefined;
  const fix = (a: Element) => {
    const href = a.getAttribute("href");
    if (!href) return;
    const next = withLang(href);
    if (next !== href) a.setAttribute("href", next);
  };
  const scan = (root: ParentNode) => root.querySelectorAll("a[href^='/']").forEach(fix);
  scan(document);
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") fix(r.target as Element);
      else r.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        const el = n as Element;
        if (el.matches("a[href]")) fix(el);
        scan(el);
      });
    }
  });
  obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
  return () => obs.disconnect();
}
