/** Indirizzi leggibili e stabili per corsi ed eventi. L'id numerico in testa è la chiave: il resto è solo descrittivo (SEO). */

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");

/** es. 12-cpsa-f-foundation-online-2026-11-10 */
export function courseSlug(c: { id: number; level: string; online: boolean; residential: boolean; locationIt: string; start: string | null }): string {
  const where = c.online ? "online" : c.residential ? "residenziale" : slugify(c.locationIt) || "aula";
  return [c.id, "cpsa-f", slugify(c.level), where, (c.start || "").slice(0, 10)].filter(Boolean).join("-");
}

/** es. 3-cube-academy-al-software-architecture-gathering-2024 */
export const eventSlug = (id: string | number, title: string) => (/^\d+$/.test(String(id)) ? `${id}-${slugify(title)}`.replace(/-$/, "") : String(id));

/** Id numerico all'inizio di uno slug (o null). */
export const leadingId = (slug: string): number | null => {
  const m = /^(\d+)(?:-|$)/.exec(slug);
  return m ? Number(m[1]) : null;
};
