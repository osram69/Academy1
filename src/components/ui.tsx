import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { ArrowRight, Flame, Users } from "lucide-react";
import { cn } from "../utils/cn";
import type { Course, CourseStatus } from "../data";
import { getLivePrice } from "../data";

/* ----------------------------- hooks ------------------------------ */

export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

/* ----------------------------- Reveal ----------------------------- */

export function Reveal({
  children,
  className,
  delay = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ------------------------------- Tag ------------------------------ */

export function Tag({ children, dark = false, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em]",
        dark ? "text-white/72" : "text-steel",
        className
      )}
    >
      <span className="inline-block size-[7px] bg-flame" aria-hidden="true" />
      {children}
    </span>
  );
}

/* ------------------------------ Buttons --------------------------- */

export function Btn({
  children,
  href,
  onClick,
  variant = "flame",
  size = "md",
  className,
  withArrow = false,
  disabled,
  type,
  ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "flame" | "ink" | "ghost" | "white" | "line-dark";
  size?: "md" | "lg" | "sm";
  className?: string;
  withArrow?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  const base = cn(
    "group/btn inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full font-display font-semibold tracking-tight transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    size === "lg" && "px-8 py-4 text-[15px]",
    size === "md" && "px-6 py-3 text-sm",
    size === "sm" && "px-4 py-2 text-[13px]",
    variant === "flame" && "bg-flame text-white shadow-flame hover:bg-ink hover:shadow-lift",
    variant === "ink" && "bg-ink text-white hover:bg-flame hover:shadow-flame",
    variant === "white" && "bg-white text-ink hover:bg-flame hover:text-white hover:shadow-flame",
    variant === "ghost" && "border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-white",
    variant === "line-dark" && "border border-white/25 bg-transparent text-white hover:border-white hover:bg-white hover:text-ink",
    className
  );
  const inner = (
    <>
      <span>{children}</span>
      {withArrow && (
        <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden="true" />
      )}
    </>
  );
  if (href)
    return (
      <a href={href} className={base} aria-label={ariaLabel} onClick={onClick}>
        {inner}
      </a>
    );
  return (
    <button type={type ?? "button"} onClick={onClick} className={base} disabled={disabled} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

/* --------------------------- Status pill -------------------------- */

export function StatusPill({ status, seatsLeft, dark = false }: { status: CourseStatus; seatsLeft?: number | null; dark?: boolean }) {
  const map = {
    available: {
      cls: dark ? "bg-emerald-400/10 text-emerald-300 ring-emerald-300/25" : "bg-emerald-50 text-mint ring-mint/25",
      dot: "bg-emerald-400",
      label: "Posti disponibili",
    },
    few: {
      cls: dark ? "bg-amber-400/10 text-amber-300 ring-amber-300/25" : "bg-amber-50 text-gold ring-gold/30",
      dot: "bg-amber-400",
      label: seatsLeft ? `Ultimi ${seatsLeft} posti` : "Ultimi posti",
    },
    waitlist: {
      cls: dark ? "bg-white/10 text-white/70 ring-white/20" : "bg-ink/5 text-steel ring-ink/15",
      dot: "bg-steel",
      label: "Lista d'attesa",
    },
    concluded: {
      cls: dark ? "bg-white/10 text-white/72 ring-white/15" : "bg-ink/5 text-steel ring-ink/15",
      dot: "bg-steel",
      label: "Edizione conclusa",
    },
  } as const;
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", s.cls)}>
      <span className={cn("inline-block size-1.5 rounded-full", s.dot, (status === "available" || status === "few") && "animate-pulse-dot")} aria-hidden="true" />
      {s.label}
    </span>
  );
}

/* -------------------------- Early-bird chip ----------------------- */

export function EarlyBirdChip({ course, dark = false, className }: { course: Course; dark?: boolean; className?: string }) {
  const now = useNow(1000);
  const price = getLivePrice(course);
  if (!price.active) return null;
  const diff = price.until.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold",
        dark ? "bg-flame text-white" : "bg-flame/10 text-flame ring-1 ring-flame/30",
        className
      )}
    >
      <Flame className="size-3" aria-hidden="true" />
      <span>
        −{Math.round(course.earlyBirdPct * 100)}%
      </span>
      <span aria-hidden="true" className="opacity-50">·</span>
      <time aria-label={` early bird termina tra ${days} giorni e ${hrs} ore`}>
        {days > 0 ? `${days}g ` : ""}
        {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </time>
    </span>
  );
}

/* ---------------------------- Seats bar --------------------------- */

export function SeatsBar({ course, dark = false }: { course: Course; dark?: boolean }) {
  const { seatsTotal, seatsLeft } = course;
  if (seatsTotal == null || seatsLeft == null || seatsTotal <= 0 || course.concluded) return null;
  const pct = Math.round(((seatsTotal - seatsLeft) / seatsTotal) * 100);
  return (
    <div>
      <div className={cn("flex items-center justify-between text-[11.5px] font-medium", dark ? "text-white/68" : "text-steel")}>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          {course.status === "waitlist" ? "Edizione al completo" : `${seatsLeft} posti rimasti su ${seatsTotal}`}
        </span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div
        className={cn("mt-1.5 h-1 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-ink/8")}
        role="progressbar"
        aria-valuenow={seatsTotal - seatsLeft}
        aria-valuemin={0}
        aria-valuemax={seatsTotal}
        aria-label={`Posti occupati: ${seatsTotal - seatsLeft} su ${seatsTotal}`}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", course.status === "few" ? "bg-amber-400" : "bg-flame")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------- isometric cube svg --------------------- */

export function IsoCube({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path d="M50 8 92 29v42L50 92 8 71V29L50 8Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M50 8v42M8 29l42 21 42-21M50 50v42" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path d="M50 29 71 40v21L50 71 29 60V40l21-11Z" fill="currentColor" opacity="0.12" />
      <path d="M50 29 71 40v21L50 71 29 60V40l21-11Z" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
