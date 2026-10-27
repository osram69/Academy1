import ClientRoot from "./ClientRoot";

// Il sito è una single-page app a rotte con hash (#/corsi, #/admin, ...): si esegue solo nel browser.
export default function Page() {
  return <ClientRoot />;
}
