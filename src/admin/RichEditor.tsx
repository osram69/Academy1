import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Bold, Eraser, Italic, Link2, List, ListOrdered, Redo2, Underline, Undo2, Unlink } from "lucide-react";

/**
 * Editor di testo con le due schede di WordPress: "Visuale" (barra degli strumenti e anteprima del testo formattato)
 * e "Codice" (HTML grezzo). Il valore è sempre una stringa HTML.
 */
export function RichEditor({ value, onChange, minHeight = 280 }: { value: string; onChange: (html: string) => void; minHeight?: number }) {
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(value); // ultimo HTML emesso dall'editor: serve a non riscrivere il testo mentre si digita

  // entrando nella scheda Visuale si carica il testo corrente
  useLayoutEffect(() => {
    if (mode === "visual" && ref.current) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // modifiche arrivate da fuori (es. traduzione automatica o scheda Codice)
  useEffect(() => {
    if (mode === "visual" && ref.current && value !== last.current) {
      ref.current.innerHTML = value;
      last.current = value;
    }
  }, [value, mode]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const html = el.textContent?.trim() === "" && !el.querySelector("img,hr,li") ? "" : el.innerHTML;
    last.current = html;
    onChange(html);
  };

  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const tool = (label: string, icon: ReactNode, action: () => void) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      // mouseDown (non click) con preventDefault: così la selezione nel testo non va persa
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      className="grid size-8 place-items-center rounded-md text-ink/70 hover:bg-sand hover:text-ink"
    >
      {icon}
    </button>
  );

  const tab = (id: "visual" | "code", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === id}
      onClick={() => setMode(id)}
      className={`rounded-t-md border border-b-0 px-3.5 py-1.5 text-[12.5px] font-semibold ${mode === id ? "border-ink/20 bg-white text-ink" : "border-transparent bg-sand/60 text-ink/60 hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div role="tablist" className="-mb-px flex justify-end gap-1">
        {tab("visual", "Visuale")}
        {tab("code", "Codice")}
      </div>
      <div className="overflow-hidden rounded-lg rounded-tr-none border border-ink/20 bg-white focus-within:border-flame focus-within:ring-2 focus-within:ring-flame/20">
        {mode === "visual" ? (
          <>
            <div className="flex flex-wrap items-center gap-0.5 border-b border-ink/10 bg-sand/40 px-2 py-1.5">
              <select
                aria-label="Stile del paragrafo"
                defaultValue="p"
                onChange={(e) => { run("formatBlock", `<${e.target.value}>`); e.target.value = "p"; }}
                className="mr-1 rounded-md border border-ink/15 bg-white px-2 py-1 text-[12.5px]"
              >
                <option value="p">Paragrafo</option>
                <option value="h2">Titolo 2</option>
                <option value="h3">Titolo 3</option>
                <option value="h4">Titolo 4</option>
              </select>
              {tool("Grassetto", <Bold className="size-4" />, () => run("bold"))}
              {tool("Corsivo", <Italic className="size-4" />, () => run("italic"))}
              {tool("Sottolineato", <Underline className="size-4" />, () => run("underline"))}
              <span className="mx-1 h-5 w-px bg-ink/15" aria-hidden="true" />
              {tool("Elenco puntato", <List className="size-4" />, () => run("insertUnorderedList"))}
              {tool("Elenco numerato", <ListOrdered className="size-4" />, () => run("insertOrderedList"))}
              <span className="mx-1 h-5 w-px bg-ink/15" aria-hidden="true" />
              {tool("Inserisci link", <Link2 className="size-4" />, () => {
                const url = window.prompt("Indirizzo del link (https://… oppure #/percorso)");
                if (url) run("createLink", url);
              })}
              {tool("Rimuovi link", <Unlink className="size-4" />, () => run("unlink"))}
              {tool("Rimuovi formattazione", <Eraser className="size-4" />, () => run("removeFormat"))}
              <span className="mx-1 h-5 w-px bg-ink/15" aria-hidden="true" />
              {tool("Annulla", <Undo2 className="size-4" />, () => run("undo"))}
              {tool("Ripeti", <Redo2 className="size-4" />, () => run("redo"))}
            </div>
            <div
              ref={ref}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Testo"
              onInput={emit}
              onBlur={emit}
              // si incolla solo testo semplice: niente stili sporchi copiati da Word o da altri siti
              onPaste={(e) => {
                e.preventDefault();
                document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
              }}
              style={{ minHeight }}
              className="px-4 py-3 text-[14.5px] leading-relaxed text-ink outline-none [&_a]:text-flame [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-bold [&_h4]:mt-3 [&_h4]:font-bold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
            />
          </>
        ) : (
          <textarea
            value={value}
            onChange={(e) => { last.current = e.target.value; onChange(e.target.value); }}
            spellCheck={false}
            style={{ minHeight }}
            aria-label="Codice HTML"
            className="block w-full resize-y bg-white px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink outline-none"
          />
        )}
      </div>
    </div>
  );
}
