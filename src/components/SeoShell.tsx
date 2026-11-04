"use client";

import { useEffect, useState } from "react";

interface Section {
  heading: string;
  items?: string[];
  faqs?: { q: string; a: string }[];
}

/** Testo per crawler, social e lettori di schermo già presente nell'HTML del server; sparisce quando l'app si avvia e mostra lo stesso contenuto. */
export function SeoShell({ h1, intro, links, sections = [] }: { h1: string; intro: string; links: { href: string; label: string }[]; sections?: Section[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (mounted) return null;
  return (
    <div className="sr-only">
      <h1>{h1}</h1>
      {intro && <p>{intro}</p>}
      {sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.items && (
            <ul>
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          )}
          {s.faqs?.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>
      ))}
      <nav aria-label="Pagine del sito">
        <ul>
          {links.map((l) => (
            <li key={l.href}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
