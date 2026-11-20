"use client";

// Unico pezzo con JavaScript: chiede conferma prima di eliminare (le cartelle si cancellano con tutto il contenuto).
export function DeleteButton({ label, isDir }: { label: string; isDir: boolean }) {
  return (
    <button
      type="submit"
      className="rounded-md border border-err/30 px-2.5 py-1 text-xs font-medium text-err hover:bg-err hover:text-white"
      onClick={(e) => {
        const what = isDir ? `la cartella "${label}" e tutto il suo contenuto` : `il file "${label}"`;
        if (!confirm(`Eliminare ${what}? L'operazione non si può annullare.`)) e.preventDefault();
      }}
    >
      Elimina
    </button>
  );
}
