/** Eventi mostrati nella pagina #/eventi (ripresi dalla sezione Eventi del vecchio sito academy.cubeng.eu). */
export interface EventItem {
  id: string;
  title: string;
  when: Record<"it" | "en" | "fr" | "de", string>;
  place: string;
  text: Record<"it" | "en" | "fr" | "de", string>;
  img: string;
  href: string;
}

export const EVENTS: EventItem[] = [
  {
    id: "istf-2025",
    title: "Italian Software Testing Forum 2025",
    when: { it: "19–21 maggio 2025", en: "19–21 May 2025", fr: "19–21 mai 2025", de: "19.–21. Mai 2025" },
    place: "Milano",
    text: {
      it: "Cube Academy al Italian Software Testing Forum 2025: tre giorni a Milano dedicati alla qualità del software, con la presenza del nostro team.",
      en: "Cube Academy at the Italian Software Testing Forum 2025: three days in Milan devoted to software quality, with our team on site.",
      fr: "Cube Academy à l'Italian Software Testing Forum 2025 : trois jours à Milan consacrés à la qualité du logiciel, avec la présence de notre équipe.",
      de: "Cube Academy auf dem Italian Software Testing Forum 2025: drei Tage in Mailand rund um Softwarequalität, mit unserem Team vor Ort.",
    },
    img: "https://academy.cubeng.eu/wp-content/uploads/2025/03/IMG_20250521_101701-300x135.jpg",
    href: "https://academy.cubeng.eu/cube-academy-al-italian-software-testing-forum-2025-unoccasione-imperdibile-2/",
  },
  {
    id: "gathering-2024",
    title: "iSAQB® Software Architecture Gathering 2024",
    when: { it: "2024", en: "2024", fr: "2024", de: "2024" },
    place: "Berlino",
    text: {
      it: "La conferenza internazionale iSAQB® Software Architecture Gathering 2024 si è tenuta a Berlino.",
      en: "The international iSAQB® Software Architecture Gathering 2024 conference took place in Berlin.",
      fr: "La conférence internationale iSAQB® Software Architecture Gathering 2024 s'est tenue à Berlin.",
      de: "Die internationale Konferenz iSAQB® Software Architecture Gathering 2024 fand in Berlin statt.",
    },
    img: "https://academy.cubeng.eu/wp-content/uploads/2024/07/Berlino-300x129.jpg",
    href: "https://academy.cubeng.eu/berlino/",
  },
  {
    id: "presentazione-roma",
    title: "Evento di presentazione iSAQB a Roma",
    when: { it: "2024", en: "2024", fr: "2024", de: "2024" },
    place: "Roma",
    text: {
      it: "Evento di presentazione del board internazionale iSAQB per l'architettura software a Roma.",
      en: "Presentation event of the international iSAQB board for software architecture in Rome.",
      fr: "Événement de présentation du board international iSAQB pour l'architecture logicielle à Rome.",
      de: "Präsentationsveranstaltung des internationalen iSAQB-Boards für Softwarearchitektur in Rom.",
    },
    img: "https://academy.cubeng.eu/wp-content/uploads/2024/07/pexels-davifnr-2064827-300x200.jpg",
    href: "https://academy.cubeng.eu/berlin/",
  },
];
