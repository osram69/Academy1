import { useEffect, useState } from "react";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Home } from "./views/Home";
import { Catalog } from "./views/Catalog";
import { CourseDetail } from "./views/CourseDetail";
import { Enroll } from "./views/Enroll";
import { Esito } from "./views/Esito";
import { Contact } from "./views/Contact";
import { Events, EventDetail } from "./views/Events";
import { LegalPage } from "./views/Legal";
import { CookieConsent } from "./components/CookieConsent";
import { Analytics } from "./components/Analytics";
import { Admin } from "./admin/Admin";
import { bySlug } from "./data";
import { t } from "./i18n";
import { applySeo, type SeoInput } from "./lib/seo";
import { NAV_EVENT, fromLegacy, installLinkInterceptor, navigate } from "./lib/nav";

type Route = { page: "home" } | { page: "admin" } | { page: "catalog" } | { page: "course"; slug: string } | { page: "enroll"; slug: string } | { page: "esito"; ref: string; status: string } | { page: "contact" } | { page: "events" } | { page: "event"; id: string } | { page: "legal"; kind: "privacy" | "cookie" | "terms" };

export function parseRoute(path: string): Route {
  const parts = path.split("?")[0].split("/").filter(Boolean);
  if (parts[0] === "admin") return { page: "admin" };
  if (parts[0] === "corsi") return { page: "catalog" };
  if (parts[0] === "contatti") return { page: "contact" };
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
  const path = loc.split("?")[0];

  useEffect(() => {
    const onChange = () => {
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
    legacy();
    return () => {
      window.removeEventListener("hashchange", legacy);
      window.removeEventListener(NAV_EVENT, onChange);
      window.removeEventListener("popstate", onChange);
      stop();
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

  if (route.page === "admin") return <Admin hash={`#${path}`} />;

  return (
    <div className="min-h-screen bg-paper">
      <Nav route={path} />
      {page}
      <Footer />
      <CookieConsent />
      <Analytics />
    </div>
  );
}
