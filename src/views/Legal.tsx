import { lang } from "../i18n";
import { COOKIE, PRIVACY, TERMS } from "../legal/content";
import { CookiePolicyContent, PrivacyNoticeContent, TermsContent } from "../components/LegalContent";

/** Pagine autonome #/privacy e #/cookie-policy (per link diretti); gli stessi testi si aprono anche in popup. */
export function LegalPage({ kind }: { kind: "privacy" | "cookie" | "terms" }) {
  const title = kind === "privacy" ? PRIVACY[lang].title : kind === "terms" ? TERMS[lang].title : COOKIE[lang].title;
  return (
    <div className="bg-paper">
      <header className="relative overflow-hidden bg-ink pb-12 pt-32 text-white lg:pt-36">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-5 lg:px-8">
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,3rem)] font-bold leading-[1.05] tracking-[-0.025em]">{title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10 lg:px-8 lg:py-14">
        <article className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-9">
          {kind === "privacy" ? <PrivacyNoticeContent /> : kind === "terms" ? <TermsContent /> : <CookiePolicyContent />}
        </article>
      </main>
    </div>
  );
}
