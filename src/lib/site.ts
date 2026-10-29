/** Origine pubblica del sito (canonical, Open Graph, sitemap). Si cambia con SITE_URL, senza toccare il codice. */
export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://academy.cubeng.eu").replace(/\/$/, "");

export const SITE = {
  name: "Cube Academy",
  title: "Cube Academy — Certificazione iSAQB® CPSA-F",
  description: "Cube Academy — Training Provider accreditato iSAQB® dal 2024. Corsi CPSA-Foundation online e in aula a Roma.",
  image: "/img/hero-structure.jpg", // 1408x768
  logo: "/img/logo-cube-academy.png",
  company: "Cube Engineering S.r.l.",
  vat: "12870461006",
  email: "academy@cubeng.eu",
  phone: "+39 06 92 92 87 80",
  street: "Via San Martino Della Battaglia, 31",
  postalCode: "00185",
  city: "Roma",
};
