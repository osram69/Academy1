import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { MaterialiFilesPage } from "./MaterialiFiles";
import { MaterialiUsersPage } from "./MaterialiUsers";

/* Gestione dell'area /materiali (slide e materiali dei corsi): file e utenti. */

const TABS = [["file", "File"], ["utenti", "Utenti"]] as const;

/** `filesOnly`: il trainer gestisce solo i file; gli account degli studenti restano agli amministratori. */
export function MaterialiPage({ session, filesOnly = false }: { session: Session; filesOnly?: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("file");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Materiali</h1>
          <p className="text-[13px] text-steel">
            Slide e materiali dei corsi, visibili agli studenti su <a className="text-flame underline" href="/materiali" target="_blank" rel="noopener">/materiali</a>.
          </p>
        </div>
        {!filesOnly && <div role="tablist" className="flex gap-1 rounded-full bg-ink/5 p-1 text-[13px] font-semibold">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-full px-4 py-1.5 ${tab === id ? "bg-ink text-white" : "text-ink/70 hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>}
      </div>
      {tab === "file" || filesOnly ?<MaterialiFilesPage session={session} /> : <MaterialiUsersPage session={session} />}
    </div>
  );
}
