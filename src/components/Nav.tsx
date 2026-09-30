import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "../utils/cn";
import { nextCourse, fmtRange } from "../data";

const LINKS = [
  { label: "Home", href: "#/" },
  { label: "Catalogo corsi", href: "#/corsi" },
  { label: "Certificazione", href: "#/", section: "certificazione" },
  { label: "Prestige", href: "#/", section: "formati" },
  { label: "FAQ", href: "#/", section: "faq" },
];

const LANGS = ["IT", "EN", "FR", "DE"];

export function Nav({ route }: { route: string }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("IT");
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const next = nextCourse();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [route]);

  const go = (href: string, section?: string) => (e: React.MouseEvent) => {
    if (!section) return;
    e.preventDefault();
    setOpen(false);
    if (window.location.hash !== href) window.location.hash = href;
    setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const isActive = (href: string) =>
    href === "#/corsi" ? route.startsWith("#/corsi") || route.startsWith("#/corso/") : route === "#/" || route === "";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "border-b transition-colors duration-500",
          scrolled ? "border-white/10 bg-ink/95" : "border-white/8 bg-ink/90"
        )}
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          {/* logo */}
          <a href="#/" className="group flex items-center gap-3" aria-label="Cube Academy — Home">
            <img
              src="/img/logo-cube-academy.png"
              alt="Cube Academy"
              width={1000}
              height={169}
              className="h-8 w-auto sm:h-11"
            />
          </a>

          {/* desktop links */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigazione principale">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={go(l.href, l.section)}
                className={cn(
                  "link-sweep text-[13.5px] font-medium transition-colors",
                  isActive(l.href) && !l.section ? "text-white" : "text-white/60 hover:text-white"
                )}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* language switcher */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[11px] font-medium tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label="Seleziona lingua"
              >
                {lang}
                <ChevronDown className={cn("size-3 transition-transform", langOpen && "rotate-180")} aria-hidden="true" />
              </button>
              {langOpen && (
                <ul
                  className="absolute right-0 top-full mt-2 w-28 overflow-hidden rounded-xl border border-white/10 bg-ink2 py-1 shadow-lift"
                  role="listbox"
                  aria-label="Lingue disponibili"
                >
                  {LANGS.map((l) => (
                    <li key={l}>
                      <button
                        role="option"
                        aria-selected={l === lang}
                        onClick={() => {
                          setLang(l);
                          setLangOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left font-mono text-[11px] tracking-widest transition-colors",
                          l === lang ? "bg-flame/15 text-flame" : "text-white/60 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {l}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <a
              href={`#/iscriviti/${next.slug}`}
              className="group hidden items-center gap-2.5 rounded-full bg-flame py-2 pl-4 pr-5 font-display text-[13px] font-semibold text-white shadow-flame transition-all duration-300 hover:bg-white hover:text-ink md:inline-flex"
            >
              Iscriviti
              <span className="font-mono text-[10px] font-medium tracking-wider opacity-75">
                {fmtRange(next.start, next.end)}
              </span>
            </a>

            <button
              className="grid size-10 place-items-center rounded-full border border-white/15 text-white lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Chiudi menu" : "Apri menu"}
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* mobile menu */}
      <div
        className={cn(
          "fixed inset-0 top-[68px] z-40 flex flex-col bg-ink px-6 pb-10 pt-6 transition-all duration-500 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        )}
        aria-hidden={!open}
      >
        <nav className="flex flex-col divide-y divide-white/8" aria-label="Menu mobile">
          {LINKS.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              onClick={go(l.href, l.section)}
              className="flex items-baseline justify-between py-5 font-display text-3xl font-semibold tracking-tight text-white"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {l.label}
              <span className="font-mono text-[11px] text-flame">0{i + 1}</span>
            </a>
          ))}
        </nav>
        <a
          href={`#/iscriviti/${next.slug}`}
          className="mt-auto inline-flex items-center justify-center rounded-full bg-flame py-4 font-display font-semibold text-white"
        >
          Iscriviti alla prossima edizione
        </a>
        <div className="mt-4 flex justify-center gap-2">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-widest",
                l === lang ? "border-flame bg-flame/15 text-flame" : "border-white/15 text-white/50"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
