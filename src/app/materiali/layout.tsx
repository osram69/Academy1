import type { Metadata } from "next";

// Area di servizio, separata dal sito: nessun link dalla home, mai indicizzata.
export const metadata: Metadata = {
  title: "Materiali",
  alternates: {},
  robots: { index: false, follow: false, nocache: true },
};

export default function MaterialiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="bg-ink text-paper">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Cube <span className="text-ember">Academy</span>
          </span>
          <span className="ml-auto text-sm text-paper/60">Materiali dei corsi</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
      <footer className="mx-auto max-w-4xl px-5 pb-10 text-xs leading-relaxed text-steel">
        © Cube Engineering S.r.l. – Tutti i diritti riservati. I documenti di questa area sono di proprietà di Cube Engineering S.r.l.:
        qualsiasi uso da parte di terzi non espressamente autorizzato sarà perseguito a norma di legge.
      </footer>
    </div>
  );
}
