import type { Metadata, Viewport } from "next";
import "../index.css";
import { SITE, SITE_URL } from "../lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["iSAQB", "CPSA-F", "CPSA Foundation", "certificazione architetto software", "corso architettura software", "training provider iSAQB", "Roma", "Cube Academy", "Cube Engineering"],
  authors: [{ name: SITE.company, url: SITE_URL }],
  creator: SITE.company,
  publisher: SITE.company,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: "it_IT",
    alternateLocale: ["en_GB", "fr_FR", "de_DE"],
    images: [{ url: SITE.image, width: 1408, height: 768, alt: "Cube Academy — corsi iSAQB® CPSA-F" }],
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description, images: [SITE.image] },
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  formatDetection: { telephone: false },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE.name,
      description: SITE.description,
      inLanguage: ["it", "en", "fr", "de"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": ["EducationalOrganization", "Organization"],
      "@id": `${SITE_URL}/#organization`,
      name: SITE.name,
      legalName: SITE.company,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}${SITE.logo}`,
      image: `${SITE_URL}${SITE.image}`,
      email: SITE.email,
      telephone: SITE.phone,
      vatID: `IT${SITE.vat}`,
      description: SITE.description,
      address: { "@type": "PostalAddress", streetAddress: SITE.street, postalCode: SITE.postalCode, addressLocality: SITE.city, addressCountry: "IT" },
      contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: SITE.email, telephone: SITE.phone, availableLanguage: ["it", "en", "fr", "de"] },
      parentOrganization: { "@type": "Organization", name: SITE.company, url: "https://cubeng.it" },
    },
  ],
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        {children}
      </body>
    </html>
  );
}
