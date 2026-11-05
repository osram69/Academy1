import { lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent } from "react";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Home } from "./views/Home";
import { ABOUT } from "./content/about-copy";
import { CERT } from "./content/cert-copy";
import { EXAM } from "./content/exam-copy";
import { LANDING } from "./content/landing-copy";
import { CookieConsent } from "./components/CookieConsent";
import { Analytics } from "./components/Analytics";
import { bySlug } from "./data";
import { lang, langFromPath, stripLang, t } from "./i18n";
import { applySeo, type SeoInput } from "./lib/seo";
import { NAV_EVENT, fromLegacy, installLangLinks, installLinkInterceptor, navigate } from "./lib/nav";

/** Pagine caricate a richiesta: la home resta nel pacchetto iniziale, le altre (e l'area admin) arrivano solo quando servono. */
function lazyPage<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  const C = lazy(factory) as LazyExoticComponent<T> & { preload: () => Promise<unknown> };
  C.preload = factory;
  return C;
}
const Catalog = lazyPage(() => import("./views/Catalog").then((m) => ({ default: m.Catalog })));
const CourseDetail = lazyPage(() => import("./views/CourseDetail").then((m) => ({ default: m.CourseDetail })));
const Enroll = lazyPage(() => import("./views/Enroll").then((m) => ({ default: m.Enroll })));
const Esito = lazyPage(() => import("./views/Esito").then((m) => ({ default: m.Esito })));
const Contact = lazyPage(() => import("./views/Contact").then((m) => ({ default: m.Contact })));
const Landing = lazyPage(() => import("./views/Landing").then((m) => ({ default: m.Landing })));
const Exam = lazyPage(() => import("./views/Exam").then((m) => ({ default: m.Exam })));
const Certification = lazyPage(() => import("./views/Certification").then((m) => ({ default: m.Certification })));
const About = lazyPage(() => import("./views/About").then((m) => ({ default: m.About })));
const Events = lazyPage(() => import("./views/Events").then((m) => ({ default: m.Events })));
const EventDetail = lazyPage(() => import("./views/Events").then((m) => ({ default: m.EventDetail })));
const LegalPage = lazyPage(() => import("./views/Legal").then((m) => ({ default: m.LegalPage })));
const Admin = lazyPage(() => import("./admin/Admin").then((m) => ({ default: m.Admin })));

type Route = { page: "home" } | { page: "admin" } | { page: "catalog" } | { page: "course"; slug: string } | { page: "enroll"; slug: string } | { page: "esito"; ref: string; status: string } | { page: "contact" } | { page: "landing" } | { page: "exam" } | { page: "cert" } | { page: "about" } | { page: "events" } | { page: "event"; id: string } | { page: "legal"; kind: "privacy" | "cookie" | "terms" };

export function parseRoute(path: string): Route {
  const parts = stripLang(path.split("?")[0]).split("/").filter(Boolean);
  if (parts[0] === "admin") return { page: "admin" };
  if (parts[0] === "corsi") return { page: "catalog" };
  if (parts[0] === "contatti") return { page: "contact" };
  if (parts[0] === "corso-architettura-software") return { page: "landing" };
  if (parts[0] === "esame-cpsa-f") return { page: "exam" };
  if (parts[0] === "certificazione-isaqb") return { page: "cert" };
  if (parts[0] === "chi-siamo") return { page: "about" };
  if (parts[0] === "eventi" && parts[1]) return { page: "event", id: decodeURIComponent(parts[1]) };
  if (parts[0] === "eventi") return { page: "events" };
  if (parts[0] === "privacy") return { page: "legal", kind: "privacy" };
  if (parts[0] === "cookie-policy") return { page: "legal", kind: "cookie" };
  if (parts[0] === "condizioni") return { page: "legal", kind: "terms" };
  if (parts[0] === "corso" && parts[1]) return { page: "course", slug: decodeURIComponent(parts[1]) };
  if (parts[0] === "iscriviti" && parts[1]) return { page: "enroll", slug: decodeURIComponent(parts[1]) };
  if (parts[0] === "esito" && parts[1]) return { page: "esito", ref: decodeURIComponent(parts[1]), status: parts[2] || "pending" };
  return { page: "home" };
}

/** Inizia a scaricare la pagina richiesta dall'indirizzo, in parallelo con l'elenco corsi. */
export function preloadRoute(path: string) {
  const r = parseRoute(path);
  const pages: Record<string, { preload: () => Promise<unknown> } | undefined> = {
    admin: Admin, catalog: Catalog, course: CourseDetail, enroll: Enroll, esito: Esito, contact: Contact, landing: Landing,
    exam: Exam, cert: Certification, about: About, events: Events, event: EventDetail, legal: LegalPage,
  };
  void pages[r.page]?.preload();
}

/** A pagina caricata, scarica in sottofondo le altre pagine pubbliche (non l'admin) così i clic sono immediati. */
export function preloadPublicPages() {
  for (const p of [Catalog, CourseDetail, Landing, Exam, Certification, About, Contact, Events, Enroll]) void p.preload();
}

function seoFor(route: Route): SeoInput {
  switch (route.page) {
    case "catalog":
      return { title: t("Catalogo corsi"), description: t("Calendario dei corsi iSAQB® CPSA-F: edizioni online e in aula a Roma, prezzi e iscrizione.") };
    case "course": {
      const c = bySlug(route.slug);
      return c && !c.concluded ? { title: c.title, description: c.tagline || c.description } : {};
    }
    case "enroll":
    case "esito":
    case "admin":
      return { noindex: true, title: route.page === "admin" ? "Admin" : t("Iscrizione") };
    case "contact":
      return { title: t("Contatti") };
    case "landing":
      return { title: t(LANDING.title), description: t(LANDING.description) };
    case "about":
      return { title: t(ABOUT.title), description: t(ABOUT.description) };
    case "cert":
      return { title: t(CERT.title), description: t(CERT.description) };
    case "exam":
      return { title: t(EXAM.title), description: t(EXAM.description) };
    case "events":
    case "event":
      return { title: t("Eventi") };
    case "legal":
      return { title: route.kind === "privacy" ? t("Privacy") : route.kind === "cookie" ? t("Cookie Policy") : t("Condizioni generali") };
    default:
      return {};
  }
}

export default function App() {
  // vecchi indirizzi con hash (#/corso/12): si portano al percorso corrispondente
  const [loc, setLoc] = useState(() => window.location.pathname + window.location.search);
  const route = parseRoute(loc);
  const path = stripLang(loc.split("?")[0]);

  useEffect(() => {
    const onChange = () => {
      // "indietro" tra due lingue: i testi sono già tradotti all'avvio, quindi si ricarica la pagina nella lingua giusta
      if (langFromPath(window.location.pathname) !== lang) {
        window.location.reload();
        return;
      }
      const next = window.location.pathname + window.location.search;
      setLoc((prev) => {
        if (prev.split("?")[0] !== next.split("?")[0]) window.scrollTo({ top: 0 });
        return next;
      });
    };
    const legacy = () => setTimeout(() => {
      if (window.location.hash.startsWith("#/")) navigate(fromLegacy(window.location.hash), true);
    }, 0);
    window.addEventListener("hashchange", legacy);
    window.addEventListener(NAV_EVENT, onChange);
    window.addEventListener("popstate", onChange);
    const stop = installLinkInterceptor();
    const stopLangLinks = installLangLinks();
    legacy();
    return () => {
      window.removeEventListener("hashchange", legacy);
      window.removeEventListener(NAV_EVENT, onChange);
      window.removeEventListener("popstate", onChange);
      stop();
      stopLangLinks();
    };
  }, []);

  useEffect(() => applySeo(seoFor(route)), [loc]);

  // vecchio indirizzo breve (/corso/12): si porta a quello descrittivo senza aggiungere una voce alla cronologia
  useEffect(() => {
    if (route.page !== "course" && route.page !== "enroll") return;
    const c = bySlug(route.slug);
    if (c && c.slug !== route.slug) navigate(`/${route.page === "course" ? "corso" : "iscriviti"}/${c.slug}`, true);
  }, [loc]);

  let page: React.ReactNode;
  switch (route.page) {
    case "catalog":
      page = <Catalog />;
      break;
    case "course": {
      const course = bySlug(route.slug);
      page = course && !course.concluded ? <CourseDetail course={course} /> : <Catalog />;
      break;
    }
    case "enroll": {
      const course = bySlug(route.slug);
      page = course && !course.concluded ? <Enroll key={course.slug} course={course} /> : <Catalog />;
      break;
    }
    case "legal":
      page = <LegalPage kind={route.kind} />;
      break;
    case "contact":
      page = <Contact key={loc} />;
      break;
    case "landing":
      page = <Landing />;
      break;
    case "about":
      page = <About />;
      break;
    case "cert":
      page = <Certification />;
      break;
    case "exam":
      page = <Exam />;
      break;
    case "events":
      page = <Events />;
      break;
    case "event":
      page = <EventDetail key={route.id} id={route.id} />;
      break;
    case "esito":
      page = <Esito refCode={route.ref} status={route.status} />;
      break;
    default:
      page = <Home />;
  }

  if (route.page === "admin") return <Suspense fallback={null}><Admin hash={`#${path}`} /></Suspense>;

  return (
    <div className="min-h-screen bg-paper">
      <Nav route={path} />
      <Suspense fallback={null}>{page}</Suspense>
      <Footer />
      <CookieConsent />
      <Analytics />
    </div>
  );
}
