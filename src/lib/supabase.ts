import { createClient } from "@supabase/supabase-js";

// Valori pubblici (URL del progetto + chiave "anon"): la sicurezza è garantita dalla RLS lato database.
// Vanno impostati come variabili d'ambiente di build (vedi .env.example).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

export const supabase = createClient(url || "http://invalid.local", anon || "missing-key", {
  auth: { persistSession: true, autoRefreshToken: true },
});
