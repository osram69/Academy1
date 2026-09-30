import { useEffect, useState } from "react";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { CourseDetail } from "./pages/CourseDetail";
import { Enroll } from "./pages/Enroll";
import { Admin } from "./admin/Admin";
import { bySlug } from "./data";

type Route = { page: "home" } | { page: "admin" } | { page: "catalog" } | { page: "course"; slug: string } | { page: "enroll"; slug: string };

function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "admin") return { page: "admin" };
  if (parts[0] === "corsi") return { page: "catalog" };
  if (parts[0] === "corso" && parts[1]) return { page: "course", slug: parts[1] };
  if (parts[0] === "iscriviti" && parts[1]) return { page: "enroll", slug: parts[1] };
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
    default:
      page = <Home />;
  }

  if (route.page === "admin") return <Admin hash={hash} />;

  return (
    <div className="min-h-screen bg-paper">
      <Nav route={hash} />
      {page}
      <Footer />
    </div>
  );
}
