"use client";

import { useEffect, useState } from "react";

/** Testo per crawler, social e lettori di schermo già presente nell'HTML del server; sparisce quando l'app si avvia e mostra lo stesso contenuto. */
export function SeoShell({ h1, intro, links }: { h1: string; intro: string; links: { href: string; label: string }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (mounted) return null;
  return (
    <div className="sr-only">
      <h1>{h1}</h1>
      {intro && <p>{intro}</p>}
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
