import { supabase } from "../lib/supabase";

export type Translations = Record<"en" | "fr" | "de", Record<string, string>>;

/** Chiede al server di tradurre dall'italiano in inglese, francese e tedesco i testi indicati ({ chiave: testo }). */
export async function translateFromItalian(fields: Record<string, string>): Promise<Translations> {
  const { data } = await supabase.auth.getSession();
  const r = await fetch("/api/admin/translate", {
    method: "POST",
    headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Server non raggiungibile");
  return j.translations as Translations;
}
