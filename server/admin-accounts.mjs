// Creazione e reimpostazione password degli utenti del pannello (Impostazioni → Amministratori, solo superuser).
// Il client Supabase (service role) arriva dall'esterno: così la logica si prova con un finto client.
// Il livello `superuser` non si assegna né si tocca da qui: solo da SQL.
import { generatePassword } from "../shared/password.mjs";
import { isEmail } from "../shared/validators.mjs";

const ok = (body) => ({ status: 200, body });
const fail = (status, error) => ({ status, body: { error } });

export const ASSIGNABLE = ["administrator", "trainer"];
const MIN_PASSWORD = 10;
const MAX_PASSWORD = 200;
const SUPERUSER_ONLY_SQL = "Il superuser si gestisce solo da SQL.";

const norm = (e) => String(e || "").trim().toLowerCase();
/** Come in core.mjs: senza la colonna `ruolo` (prima della migrazione 9) ogni riga è superuser. */
const levelOf = (row) => (row?.ruolo === "trainer" ? "trainer" : row?.ruolo === "administrator" ? "administrator" : "superuser");
const passwordProblem = (pw) => (pw.length < MIN_PASSWORD ? `La password deve avere almeno ${MIN_PASSWORD} caratteri.` : pw.length > MAX_PASSWORD ? "Password troppo lunga." : "");

async function adminRows(db) {
  const { data, error } = await db.from("admin_emails").select("*").order("email");
  return { rows: data || [], error };
}

/** Crea l'utente Supabase (già confermato) con una password provvisoria e gli assegna il livello. Se l'utente esiste già assegna solo il livello. */
export async function createAdminUser(db, body) {
  const email = norm(body?.email);
  const ruolo = body?.ruolo;
  if (!isEmail(email)) return fail(400, "Email non valida.");
  if (ruolo === "superuser") return fail(403, SUPERUSER_ONLY_SQL);
  if (!ASSIGNABLE.includes(ruolo)) return fail(400, "Livello non valido.");
  const given = typeof body?.password === "string" ? body.password : "";
  if (given && passwordProblem(given)) return fail(400, passwordProblem(given));

  const { rows, error } = await adminRows(db);
  if (error) return fail(500, error.message);
  if (rows.some((r) => norm(r.email) === email)) return fail(409, "Questa email è già tra gli amministratori.");

  const password = given || generatePassword(12);
  const { data, error: createError } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  let created = true;
  let newId = data?.user?.id;
  if (createError) {
    if (!/already|registered|exists/i.test(createError.message || "")) return fail(500, createError.message || "Creazione dell'utente non riuscita.");
    created = false; // esisteva già in Supabase: si assegna solo il livello
    newId = undefined;
  }

  const { error: insertError } = await db.from("admin_emails").insert({ email, ruolo });
  if (insertError) {
    if (created && newId) await db.auth.admin.deleteUser(newId); // niente account orfano
    return fail(500, insertError.message || "Salvataggio del livello non riuscito.");
  }
  return ok(created ? { email, ruolo, created, password } : { email, ruolo, created });
}

/** Trova l'utente Supabase con quell'email scorrendo le pagine dell'elenco. */
async function findAuthUser(db, email) {
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) return { error };
    const users = data?.users || [];
    const hit = users.find((u) => norm(u.email) === email);
    if (hit) return { user: hit };
    if (users.length < perPage) break;
  }
  return { user: null };
}

/** Imposta una nuova password provvisoria (scritta o generata) a un administrator o trainer; mai al superuser. */
export async function resetAdminPassword(db, emailRaw, body) {
  const email = norm(emailRaw);
  const { rows, error } = await adminRows(db);
  if (error) return fail(500, error.message);
  const row = rows.find((r) => norm(r.email) === email);
  if (!row) return fail(404, "Utente non presente tra gli amministratori.");
  if (levelOf(row) === "superuser") return fail(403, SUPERUSER_ONLY_SQL);
  const given = typeof body?.password === "string" ? body.password : "";
  if (given && passwordProblem(given)) return fail(400, passwordProblem(given));

  const found = await findAuthUser(db, email);
  if (found.error) return fail(500, found.error.message);
  if (!found.user) return fail(404, "Utente non presente in Supabase.");
  const password = given || generatePassword(12);
  const { error: updateError } = await db.auth.admin.updateUserById(found.user.id, { password });
  if (updateError) return fail(500, updateError.message || "Reimpostazione non riuscita.");
  return ok({ email, password });
}
