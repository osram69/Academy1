/** Navigazione interna senza ricaricare la pagina (history API). Gli indirizzi sono percorsi veri: /corsi, /corso/<id>-..., /eventi/... */

export const NAV_EVENT = "app:navigate";

/** Porta un vecchio indirizzo con hash (/corso/12) al percorso corrispondente. */
export const fromLegacy = (href: string) => (href.startsWith("#/") ? href.slice(1) : href);

export function navigate(to: string, replace = false) {
  const url = fromLegacy(to);
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
    navigate(href);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
