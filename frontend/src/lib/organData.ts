// Fuente única de verdad para todos los datos de procedimientos quirúrgicos

export type OrganId = "kidney" | "liver" | "gastric" | "esophagectomy";

export type OrganVitals = {
  fc: string;   // Frecuencia cardíaca (bpm)
  spo2: string; // Saturación de oxígeno (%)
  temp: string; // Temperatura corporal (°C)
};

export type OrganData = {
  id: OrganId;
  label: string;
  slug: string; // Parámetro de la URL /simulation/:slug
  vitals: OrganVitals;
};

export type RunResult = {
  id: OrganId;
  fecha: string;       // ISO string
  duracion: number;    // elapsedSeconds
  puntaje: number;     // entero 65–99
  signosVitales: OrganVitals;
  cirujano: string;
};

export const ORGAN_DATA: Record<OrganId, OrganData> = {
  kidney: {
    id: "kidney",
    label: "Kidney Suturing",
    slug: "kidney-uturing",
    // Cirugía urológica — tensión moderada, sin compromiso pulmonar
    vitals: { fc: "76", spo2: "98", temp: "36.6" },
  },
  liver: {
    id: "liver",
    label: "Liver Resection",
    slug: "liver-resection",
    // Resección hepática — pérdida de sangre esperada, hipotermia leve
    vitals: { fc: "88", spo2: "96", temp: "35.9" },
  },
  gastric: {
    id: "gastric",
    label: "Gastric Bypass",
    slug: "gastric-bypass",
    // Paciente obeso en Trendelenburg, compresión diafragmática
    vitals: { fc: "82", spo2: "95", temp: "36.4" },
  },
  esophagectomy: {
    id: "esophagectomy",
    label: "Esophagectomy",
    slug: "esophagectomy",
    // Toracotomía + laparotomía, ventilación monopulmonar, hipotermia
    vitals: { fc: "92", spo2: "94", temp: "35.7" },
  },
};

/** Dado el slug de URL (ej: "kidney-uturing"), devuelve el OrganData correspondiente */
export function getOrganBySlug(slug: string): OrganData | undefined {
  return Object.values(ORGAN_DATA).find((o) => o.slug === slug);
}
