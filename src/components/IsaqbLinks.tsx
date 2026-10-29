import { ArrowUpRight } from "lucide-react";
import { isaqbLinks } from "../links";
import { cn } from "../utils/cn";

/** Collegamento esterno (nuova scheda) con icona. */
export function ExtLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("link-sweep inline-flex items-center gap-1 font-semibold", className)}>
      {children}
      <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

/** Elenco dei collegamenti verso iSAQB: CPSA-F, associazione, certificazione ed esami. */
export function IsaqbLinks({ dark = false, className }: { dark?: boolean; className?: string }) {
  const l = isaqbLinks();
  const tone = dark ? "text-ember" : "text-flame";
  return (
    <ul className={cn("flex flex-wrap gap-x-6 gap-y-2.5 text-[14px]", className)}>
      {[l.cpsaF, l.about, l.certification, l.exams, l.isaqbIt].map((x) => (
        <li key={x.href}>
          <ExtLink href={x.href} className={tone}>{x.label}</ExtLink>
        </li>
      ))}
    </ul>
  );
}
