import { useMemo, useState } from "react";
import { ListFilter, UsersRound } from "lucide-react";
import { cn } from "../utils/cn";
import { ConcludedSection, CourseCard } from "../components/CourseCard";
import { Reveal, Tag } from "../components/ui";
import { COURSES, FORMAT_META, type CourseFormat, type CourseLevel, type Lang } from "../data";

const FORMAT_FILTERS: { id: CourseFormat | "all"; label: string }[] = [
  { id: "all", label: "Tutti i formati" },
  { id: "online", label: "Live Online" },
  { id: "aula", label: "In Aula" },
  { id: "prestige", label: "Prestige" },
];
const LEVEL_FILTERS: { id: CourseLevel | "all"; label: string }[] = [
  { id: "all", label: "Tutti i livelli" },
  { id: "Foundation", label: "Foundation" },
  { id: "Advanced", label: "Advanced" },
  { id: "Workshop", label: "Workshop" },
];
const LANG_FILTERS: { id: Lang | "all"; label: string }[] = [
  { id: "all", label: "IT + EN" },
  { id: "IT", label: "Italiano" },
  { id: "EN", label: "English" },
];

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-300",
              value === o.id
                ? "bg-ink text-white shadow-card"
                : "border border-ink/12 bg-white text-ink/60 hover:border-ink/40 hover:text-ink"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Catalog() {
  const [format, setFormat] = useState<CourseFormat | "all">("all");
  const [level, setLevel] = useState<CourseLevel | "all">("all");
  const [lang, setLang] = useState<Lang | "all">("all");

  const filtered = useMemo(
    () =>
      COURSES.filter(
        (c) =>
          (format === "all" || c.format === format) &&
          (level === "all" || c.level === level) &&
          (lang === "all" || c.language === lang)
      ),
    [format, level, lang]
  );
  const results = useMemo(
    () => filtered.filter((c) => !c.concluded).sort((a, b) => a.start.getTime() - b.start.getTime()),
    [filtered]
  );
  const concluded = useMemo(
    () => filtered.filter((c) => c.concluded).sort((a, b) => b.start.getTime() - a.start.getTime()),
    [filtered]
  );

  return (
    <div className="bg-paper">
      {/* header */}
      <header className="relative overflow-hidden bg-ink pb-20 pt-40 text-white lg:pb-24">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div
          className="absolute -left-40 top-0 size-[480px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <Tag dark>Catalogo 2026</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.6rem,6vw,4.6rem)] font-bold leading-[1.0] tracking-[-0.03em]">
              Ogni edizione. <em className="font-serif italic text-flame">Una sola schermata.</em>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/68">
              Niente più tabelle da foglio di calcolo: ogni corso è una scheda con posti, early bird e prezzo in tempo
              reale. Filtra per formato, livello e lingua.
            </p>
          </Reveal>
        </div>
      </header>

      {/* filtri */}
      <div className="sticky top-[68px] z-30 border-b border-ink/8 bg-paper/95 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-5 lg:px-8">
          <span className="hidden items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-steel md:inline-flex">
            <ListFilter className="size-4" aria-hidden="true" />
            Filtra
          </span>
          <FilterGroup label="Formato" options={FORMAT_FILTERS} value={format} onChange={setFormat} />
          <FilterGroup label="Livello" options={LEVEL_FILTERS} value={level} onChange={setLevel} />
          <FilterGroup label="Lingua" options={LANG_FILTERS} value={lang} onChange={setLang} />
          <p className="ml-auto font-mono text-[11.5px] uppercase tracking-widest text-steel" role="status" aria-live="polite">
            {results.length} {results.length === 1 ? "edizione" : "edizioni"}
          </p>
        </div>
      </div>

      {/* griglia */}
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        {results.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-ink/20 p-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">Nessuna edizione con questi filtri</p>
            <p className="mt-2 text-sm text-ink/55">Prova ad allargare formato o lingua — oppure scrivici per un'edizione dedicata.</p>
            <button
              onClick={() => {
                setFormat("all");
                setLevel("all");
                setLang("all");
              }}
              className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-flame"
            >
              Azzera i filtri
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:pb-12">
            {results.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 3) * 90}>
                <CourseCard course={c} index={i} />
              </Reveal>
            ))}
          </div>
        )}

        <ConcludedSection courses={concluded} />

        {/* banner team */}
        <Reveal className="mt-16">
          <aside className="relative overflow-hidden rounded-[28px] bg-ink p-8 text-white lg:p-12">
            <div className="bg-blueprint-dark absolute inset-0 opacity-50" aria-hidden="true" />
            <div
              className="absolute -right-24 -top-24 size-80 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, #e8321e 0%, transparent 65%)" }}
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-center gap-8">
              <span className="grid size-14 place-items-center rounded-2xl bg-flame">
                <UsersRound className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 basis-72">
                <h2 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
                  Hai un team da certificare?
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/72">
                  Da 8 persone in su: edizione privata con casi di studio sul vostro dominio, nella vostra sede, online
                  o in formato Prestige. Preventivo in 48 ore.
                </p>
              </div>
              <a
                href="mailto:academy@cubeng.eu?subject=Edizione%20privata%20per%20il%20nostro%20team"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 font-display text-sm font-semibold text-ink transition-all duration-300 hover:bg-flame hover:text-white hover:shadow-flame"
              >
                Richiedi un'offerta
              </a>
            </div>
          </aside>
        </Reveal>

        {/* nota formati */}
        <Reveal delay={100}>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(Object.keys(FORMAT_META) as CourseFormat[]).map((f) => (
              <div key={f} className="rounded-2xl border border-ink/10 bg-white p-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-flame">{FORMAT_META[f].label}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink/60">{FORMAT_META[f].blurb}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </main>
    </div>
  );
}
