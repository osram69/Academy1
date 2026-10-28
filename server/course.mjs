/** Tipi di corso gestibili dal backend (campo `livello` della tabella corsi). */
export const LEVELS = ["Foundation", "Advanced", "Workshop"];

export const normLevel = (v) => LEVELS.find((l) => l.toLowerCase() === String(v ?? "").trim().toLowerCase()) || "Foundation";

/** Sigla usata nelle causali di pagamento e nelle email: CPSA-F, CPSA-A oppure Workshop. */
export const courseCode = (course) => {
  const l = normLevel(course?.livello);
  return l === "Foundation" ? "CPSA-F" : l === "Advanced" ? "CPSA-A" : "Workshop";
};
