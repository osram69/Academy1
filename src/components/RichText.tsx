import { Fragment } from "react";

/** Mostra un testo con collegamenti scritti come [etichetta](/percorso) o [etichetta](https://…), p. es. [modulo di contatto](/contatti). */
export function RichText({ text, linkClassName = "link-sweep font-semibold text-flame" }: { text: string; linkClassName?: string }) {
  const parts = text.split(/(\[[^\]]+\]\((?:\/|https:\/\/)[^)\s]*\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]*)\)$/.exec(part);
        return m ? (
          <a key={i} href={m[2]} className={linkClassName}>{m[1]}</a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
