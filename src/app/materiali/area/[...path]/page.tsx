import fs from "node:fs";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { COOKIE, PUBLIC_KEY, canManageRoots, canSee, isTrainer, listDir, resolve, userFromToken } from "@server/materiali.mjs";
import { areaUrl } from "@server/materiali-http.mjs";
import { DeleteButton } from "../../../../components/materiali/DeleteButton";
import { Notice } from "../../notice";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<{ m?: string; n?: string }> };

const size = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const date = (t: number) => new Date(t).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
export default async function Area({ params, searchParams }: Props) {
  const parts = (await params).path;
  const q = await searchParams;
  const user = userFromToken((await cookies()).get(COOKIE)?.value);
  if (!user) redirect("/materiali");

  const r = resolve(parts);
  if (!r || !canSee(user, r.key) || !fs.existsSync(r.full) || !fs.statSync(r.full).isDirectory()) notFound();

  const items = listDir(r.full);
  const trainer = isTrainer(user);
  const isPublic = r.key === PUBLIC_KEY;
  const site = (process.env.SITE_URL || "").replace(/\/$/, "");
  const label = (k: string) => (k === PUBLIC_KEY ? "Pubblico" : k);
  const crumbs = parts.map((p, i) => ({ name: i ? p : label(p), href: areaUrl(parts.slice(0, i + 1)) }));
  const dirValue = parts.join("/");

  return (
    <>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-steel">
        <Link href="/materiali" className="text-flame hover:underline">Cartelle</Link>
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5">
            <span>/</span>
            {i === crumbs.length - 1 ? <b className="text-ink">{c.name}</b> : <Link href={c.href} className="text-flame hover:underline">{c.name}</Link>}
          </span>
        ))}
        <form method="post" action="/materiali/logout" className="ml-auto">
          <button className="rounded-lg border border-sand bg-white px-3 py-1.5 text-xs hover:border-flame">Esci</button>
        </form>
      </nav>

      {isPublic && (
        <p className="mt-4 rounded-lg bg-gold/10 px-4 py-2.5 text-sm text-gold">
          Questa cartella è pubblica: chi conosce il link di un file lo scarica senza login. Il contenuto non è elencato da nessuna parte.
        </p>
      )}
      <Notice m={q.m} n={q.n} />

      <div className="mt-5 overflow-hidden rounded-xl bg-white shadow-card">
        {items.length === 0 ? (
          <p className="p-8 text-center text-steel">Cartella vuota.</p>
        ) : (
          <ul className="divide-y divide-sand/70">
            {items.map((it) => {
              const target = [...parts, it.name];
              const href = it.isDir ? areaUrl(target) : isPublic ? `/materiali/p/${target.slice(1).map(encodeURIComponent).join("/")}` : `/materiali/scarica/${target.map(encodeURIComponent).join("/")}`;
              const canDelete = trainer && (target.length > 1 || canManageRoots(user));
              return (
                <li key={it.name} className="flex items-center gap-3 px-4 py-3">
                  <span aria-hidden>{it.isDir ? "📁" : "📄"}</span>
                  <div className="min-w-0 flex-1">
                    <a href={href} {...(it.isDir ? {} : { target: "_blank", rel: "noopener" })} className="block truncate font-medium hover:text-flame hover:underline">
                      {it.name}
                    </a>
                    {isPublic && !it.isDir && <div className="truncate text-xs text-steel select-all">{site + href}</div>}
                  </div>
                  <span className="hidden text-xs text-steel sm:block">{date(it.mtime)}</span>
                  <span className="w-20 text-right text-xs text-steel">{it.isDir ? "—" : size(it.size)}</span>
                  {canDelete && (
                    <form method="post" action="/materiali/azione">
                      <input type="hidden" name="action" value="elimina" />
                      <input type="hidden" name="target" value={target.join("/")} />
                      <DeleteButton label={it.name} isDir={it.isDir} />
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {trainer && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <form method="post" action="/materiali/azione" encType="multipart/form-data" className="rounded-xl bg-sand/50 p-4">
            <input type="hidden" name="action" value="carica" />
            <input type="hidden" name="dir" value={dirValue} />
            <label className="block text-sm font-medium">
              Carica file
              <input type="file" name="files" multiple required className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-paper" />
            </label>
            <button className="mt-3 rounded-lg bg-flame px-4 py-2 text-sm font-semibold text-white hover:bg-ember">Carica</button>
          </form>
          <form method="post" action="/materiali/azione" className="rounded-xl bg-sand/50 p-4">
            <input type="hidden" name="action" value="cartella" />
            <input type="hidden" name="dir" value={dirValue} />
            <label className="block text-sm font-medium">
              Nuova cartella
              <input name="nome" required maxLength={150} placeholder="Slide" className="mt-2 block w-full rounded-lg border border-sand bg-white px-3 py-2" />
            </label>
            <button className="mt-3 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink2">Crea cartella</button>
          </form>
        </div>
      )}
    </>
  );
}
