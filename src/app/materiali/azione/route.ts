import fs from "node:fs";
import { PUBLIC_KEY, canManageRoots, canSee, isTrainer, makeFolder, maxUploadBytes, privateRoot, removePath, resolve, saveUpload } from "@server/materiali.mjs";
import { areaUrl, sameOrigin, see, userOf } from "@server/materiali-http.mjs";

export const dynamic = "force-dynamic";

const parts = (v: FormDataEntryValue | null) => String(v ?? "").split("/").filter(Boolean);

// Modifiche ai file: solo trainer. action = carica | cartella | elimina
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Richiesta non valida.", { status: 403 });
  const user = userOf(request);
  if (!isTrainer(user)) return new Response("Accesso negato.", { status: 403 });

  const tooBig = Number(request.headers.get("content-length") || 0) > maxUploadBytes() + 1024 * 1024;
  const form = tooBig ? null : await request.formData().catch(() => null);
  const dir = parts(form?.get("dir") ?? null);
  const back = (code: string, n?: number) => see(`${areaUrl(dir)}?m=${code}${n ? `&n=${n}` : ""}`);
  if (!form) return back("grande");
  const action = String(form.get("action"));

  if (action === "cartella") {
    const name = String(form.get("nome") ?? "");
    if (!dir.length) {
      if (!canManageRoots(user)) return back("vietato");
      const r = makeFolder(privateRoot(), name);
      return back(r.error ? `err-${r.error}` : "creata");
    }
    const t = resolve(dir);
    if (!t || !canSee(user, t.key) || !fs.existsSync(t.full) || !fs.statSync(t.full).isDirectory()) return back("vietato");
    const r = makeFolder(t.full, name);
    return back(r.error ? `err-${r.error}` : "creata");
  }

  if (action === "carica") {
    const t = resolve(dir);
    if (!t || !canSee(user, t.key) || !fs.existsSync(t.full) || !fs.statSync(t.full).isDirectory()) return back("vietato");
    const files = form.getAll("files").filter((f): f is File => typeof f !== "string" && !!f.name && f.size > 0);
    if (!files.length) return back("err-vuoto");
    let done = 0;
    let error = "";
    for (const f of files) {
      const r = await saveUpload(t.full, f);
      if (r.error) error ||= r.error;
      else done++;
    }
    return back(error && !done ? `err-${error}` : error ? "parziale" : "caricati", done);
  }

  if (action === "elimina") {
    const target = parts(form.get("target"));
    const t = resolve(target);
    // le cartelle di primo livello (i corsi) le elimina solo chi ha "*"; la cartella pubblica non si elimina
    if (!t || !canSee(user, t.key) || !fs.existsSync(t.full) || (t.isRoot && (t.key === PUBLIC_KEY || !canManageRoots(user)))) return back("vietato");
    removePath(t.full);
    return see(`${areaUrl(target.slice(0, -1))}?m=eliminato`);
  }

  return back("vietato");
}
