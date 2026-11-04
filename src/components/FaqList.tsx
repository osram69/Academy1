import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";
import { Reveal } from "./ui";
import { ExtLink } from "./IsaqbLinks";
import { RichText } from "./RichText";
import { FAQS } from "../data";

/** Elenco a fisarmonica delle domande frequenti: lo stesso nella home, nelle schede corso e nella pagina del corso Software Architect. */
export function FaqList({ items = FAQS }: { items?: { q: string; a: string; links?: { href: string; label: string }[] }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3.5">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={f.q} delay={i * 70}>
            <div className={cn("overflow-hidden rounded-2xl border bg-white transition-colors duration-300", isOpen ? "border-flame/50 shadow-card" : "border-ink/10")}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
              >
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] font-semibold text-flame">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[16.5px] font-semibold tracking-tight text-ink">{f.q}</span>
                </span>
                <ChevronDown className={cn("size-5 shrink-0 text-steel transition-transform duration-400", isOpen && "rotate-180 text-flame")} aria-hidden="true" />
              </button>
              <div
                id={`faq-panel-${i}`}
                role="region"
                className={cn(
                  "grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 pl-[3.7rem] text-[14.5px] leading-relaxed text-ink/65"><RichText text={f.a} /></p>
                  {"links" in f && f.links && (
                    <div className="-mt-3 flex flex-wrap gap-x-6 gap-y-2 px-6 pb-6 pl-[3.7rem] text-[14px]">
                      {f.links.map((l) => <ExtLink key={l.href} href={l.href} className="text-flame">{l.label}</ExtLink>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
