import { createClient } from "@supabase/supabase-js";

// Valori pubblici (URL del progetto + chiave "anon"): la sicurezza è garantita dalla RLS lato database.
// Vanno impostati come variabili d'ambiente di build (vedi .env.example).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anon);

export const supabase = createClient(url || "http://invalid.local", anon || "missing-key", {
  auth: { persistSession: true, autoRefreshToken: true },
});
