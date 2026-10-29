import { Fragment } from "react";

/** Mostra un testo con collegamenti interni scritti come [etichetta](/percorso), p. es. [modulo di contatto](/contatti). */
export function RichText({ text, linkClassName = "link-sweep font-semibold text-flame" }: { text: string; linkClassName?: string }) {
  const parts = text.split(/(\[[^\]]+\]\(\/[^)\s]*\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/.exec(part);
        return m ? (
          <a key={i} href={m[2]} className={linkClassName}>{m[1]}</a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
