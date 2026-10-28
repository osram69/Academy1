import { FileCheck2 } from "lucide-react";
import { lang } from "../i18n";
import { COOKIE, PRIVACY } from "../legal/content";
import { openCookieSettings } from "../lib/consent";

// Stessi testi per le pagine (#/privacy, #/cookie-policy) e per i popup aperti dai moduli e dal footer.
const h3 = "mt-5 font-display text-[15.5px] font-bold tracking-tight text-ink";
const p = "mt-1.5 text-[14px] leading-relaxed text-ink/75";

export function PrivacyNoticeContent() {
  const c = PRIVACY[lang];
  return (
    <div>
      {lang !== "it" && (
        <div className="flex items-start gap-3 rounded-xl border border-ink/10 bg-paper p-3.5 text-[13px] text-ink/70">
          <FileCheck2 className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden="true" />
          <p>{c.note}</p>
        </div>
      )}
      {c.sections.map(([h, b]) => (
        <section key={h}>
          <h3 className={h3}>{h}</h3>
          <p className={p}>{b}</p>
        </section>
      ))}
      <p className="mt-5 text-[14px] font-semibold text-ink">{c.revoke}</p>
    </div>
  );
}

export function CookiePolicyContent() {
  const c = COOKIE[lang];
  return (
    <div>
      <h3 className={h3 + " !mt-0"}>{c.whatTitle}</h3>
      <p className={p}>{c.what}</p>
      <h3 className={h3}>{c.catTitle}</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-ink/10">
        <table className="w-full min-w-[480px] text-left text-[13px]">
          <thead className="bg-sand/50 text-[11.5px] uppercase tracking-wider text-steel">
            <tr>{c.headers.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {c.rows.map((r) => (
              <tr key={r[0]} className="border-t border-ink/8 align-top">
                <td className="px-3 py-2 font-semibold text-ink">{r[0]}</td>
                <td className="px-3 py-2 text-ink/75">{r[1]}</td>
                <td className="px-3 py-2 text-ink/75">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className={h3}>{c.inUseTitle}</h3>
      {c.inUse.map(([h, b]) => (
        <div key={h}>
          <h4 className="mt-3 text-[14px] font-semibold text-ink">{h}</h4>
          <p className={p}>{b}</p>
        </div>
      ))}
      <h3 className={h3}>{c.manageTitle}</h3>
      <p className={p}>{c.manage}</p>
      <button type="button" onClick={openCookieSettings} className="mt-3 rounded-full bg-ink px-5 py-2.5 font-display text-[13.5px] font-semibold text-white transition-colors hover:bg-flame">
        {c.button}
      </button>
    </div>
  );
}
