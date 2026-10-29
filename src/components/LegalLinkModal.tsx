"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { t } from "../i18n";
import { OPEN_SETTINGS_EVENT } from "../lib/consent";

/**
 * Apre un testo legale (informativa privacy, cookie policy) in un popup invece di cambiare pagina:
 * un link dentro un modulo porterebbe l'utente fuori da ciò che sta compilando. Il <dialog> è montato
 * su document.body perché il pulsante sta spesso dentro un <p> o un <label>, dove non possono stare
 * titoli e tabelle.
 */
export function LegalLinkModal({ label, title, className, children, onRead }: { label: string; title: string; className?: string; children: ReactNode; onRead?: () => void }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  // "letto" = testo scorso fino in fondo (o abbastanza corto da non richiedere lo scroll)
  const checkRead = () => {
    const el = body.current;
    if (el && onRead && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) onRead();
  };
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const close = () => {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  };

  // il <dialog> modale sta sopra a tutto (top layer): per mostrare il pannello dei cookie va chiuso prima
  useEffect(() => {
    if (!open) return;
    const onSettings = () => {
      dialog.current?.close();
      setOpen(false);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, onSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onSettings);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    checkRead();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button type="button" ref={trigger} className={className ?? "link-sweep font-semibold text-flame"} onClick={() => setOpen(true)}>
        {label}
      </button>
      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            aria-labelledby={id}
            onCancel={close}
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
            className="m-auto max-h-[88vh] w-[min(820px,94vw)] overflow-hidden rounded-3xl border border-ink/10 bg-white p-0 text-ink shadow-lift backdrop:bg-ink/70"
          >
            <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-6 py-4">
              <h2 id={id} className="font-display text-xl font-bold tracking-tight">{title}</h2>
              <button type="button" onClick={close} aria-label={t("Chiudi")} className="grid size-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink hover:text-white">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div ref={body} onScroll={checkRead} className="max-h-[calc(88vh-72px)] overflow-y-auto px-6 py-5">{children}</div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
