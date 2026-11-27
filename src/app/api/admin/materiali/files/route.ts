import { adminGate } from "@server/core.mjs";
import { respond } from "@server/http.mjs";
import { adminFilesDelete, adminFilesDownload, adminFilesList, adminFilesMkdir, adminFilesUpload, adminMaxUpload } from "@server/materiali-admin.mjs";

export const dynamic = "force-dynamic";

// Accessibile anche ai trainer (level "trainer"); la gestione degli utenti (../route.ts) resta solo per gli amministratori.
// File dell'area /materiali gestiti dal pannello admin. Percorso = segmenti separati da "/" ("" = radice).
const partsOf = (v: unknown) => String(v ?? "").split("/").filter(Boolean);
const pathOf = (request: Request) => partsOf(new URL(request.url).searchParams.get("path"));

export async function GET(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"), "trainer");
  if (denied) return respond(denied);
  const download = new URL(request.url).searchParams.get("file");
  return download ? adminFilesDownload(pathOf(request), request) : respond(adminFilesList(pathOf(request)));
}

export async function POST(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"), "trainer");
  if (denied) return respond(denied);

  if ((request.headers.get("content-type") || "").includes("application/json")) {
    const b = await request.json().catch(() => ({}));
    return respond(adminFilesMkdir(partsOf(b.dir), String(b.nome ?? "")));
  }
  if (Number(request.headers.get("content-length") || 0) > adminMaxUpload() + 1024 * 1024) return respond({ status: 413, body: { error: "File troppo grande." } });
  const form = await request.formData().catch(() => null);
  if (!form) return respond({ status: 400, body: { error: "Richiesta non valida." } });
  const files = form.getAll("files").filter((f): f is File => typeof f !== "string" && !!f.name && f.size > 0);
  if (!files.length) return respond({ status: 400, body: { error: "Nessun file selezionato." } });
  return respond(await adminFilesUpload(partsOf(form.get("dir")), files));
}

export async function DELETE(request: Request) {
  const denied = await adminGate(request.headers.get("authorization"), "trainer");
  return respond(denied ?? adminFilesDelete(pathOf(request)));
}
