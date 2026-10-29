import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ClientRoot from "../ClientRoot";
import { SeoShell } from "../../components/SeoShell";
import { resolvePath } from "../../lib/page-seo";

// Il sito è una single-page app (si esegue nel browser), ma ogni indirizzo ha il suo HTML sul server:
// titolo, descrizione, canonical, Open Graph e dati strutturati. Corsi ed eventi arrivano dal database e si rinfrescano ogni 5 minuti.
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ slug?: string[] }> };

const segmentsOf = async (p: Params["params"]) => ((await p).slug ?? []).map((s) => decodeURIComponent(s));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = await resolvePath(await segmentsOf(params));
  return r.kind === "ok" ? r.meta : {};
}

export default async function Page({ params }: Params) {
  const r = await resolvePath(await segmentsOf(params));
  if (r.kind === "notfound") notFound();
  if (r.kind === "redirect") permanentRedirect(r.to);
  if (r.kind !== "ok") return null;
  return (
    <>
      {r.jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" data-page-ld="" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <SeoShell {...r.shell} />
      <ClientRoot />
    </>
  );
}
