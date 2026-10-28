import { useEffect, useState } from "react";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Home } from "./views/Home";
import { Catalog } from "./views/Catalog";
import { CourseDetail } from "./views/CourseDetail";
import { Enroll } from "./views/Enroll";
import { Esito } from "./views/Esito";
import { Contact } from "./views/Contact";
import { LegalPage } from "./views/Legal";
import { CookieConsent } from "./components/CookieConsent";
import { Analytics } from "./components/Analytics";
import { Admin } from "./admin/Admin";
import { bySlug } from "./data";

type Route = { page: "home" } | { page: "admin" } | { page: "catalog" } | { page: "course"; slug: string } | { page: "enroll"; slug: string } | { page: "esito"; ref: string; status: string } | { page: "contact" } | { page: "legal"; kind: "privacy" | "cookie" };

function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("?")[0].split("/").filter(Boolean);
  if (parts[0] === "admin") return { page: "admin" };
  if (parts[0] === "corsi") return { page: "catalog" };
  if (parts[0] === "contatti") return { page: "contact" };
  if (parts[0] === "privacy") return { page: "legal", kind: "privacy" };
  if (parts[0] === "cookie-policy") return { page: "legal", kind: "cookie" };
  if (parts[0] === "corso" && parts[1]) return { page: "course", slug: parts[1] };
  if (parts[0] === "iscriviti" && parts[1]) return { page: "enroll", slug: parts[1] };
  if (parts[0] === "esito" && parts[1]) return { page: "esito", ref: decodeURIComponent(parts[1]), status: parts[2] || "pending" };
  return { page: "home" };
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash || "#/"));

  useEffect(() => {
    const onChange = () => {
      const h = window.location.hash || "#/";
      setHash(h);
      setRoute(parseRoute(h));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

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
      page = <Contact key={hash} />;
      break;
    case "esito":
      page = <Esito refCode={route.ref} status={route.status} />;
      break;
    default:
      page = <Home />;
  }

  if (route.page === "admin") return <Admin hash={hash} />;

  return (
    <div className="min-h-screen bg-paper">
      <Nav route={hash} />
      {page}
      <Footer />
      <CookieConsent />
      <Analytics />
    </div>
  );
}
