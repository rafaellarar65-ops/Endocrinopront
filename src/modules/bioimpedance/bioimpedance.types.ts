export interface RawBioimpedanceRow {
  /** Data/hora no XLS, ex: "Tempo de pesagem" */
  timestamp: Date;
  idade: number;
  alturaCm: number;
  pesoKg: number;
  gorduraKg: number;
  aguaKg: number;
  proteinaKg: number;
  massaMuscularKg: number;
  gorduraPercent: number;
}

export interface BioimpedanceHtmlContextV6 {
  // header / identificação
  examDate: string;      // dd/MM/yyyy
  patientName: string;
  ageYears: number;
  heightCm: number;

  // resumo corporal
  weightKg: number;
  imc: number;
  fatPercent: number;
  fatKg: number;
  fatFreeMassKg: number;
  totalBodyWaterKg: number;
  totalBodyWaterPercent: number;
  skeletalMuscleMassKg: number;
  skeletalMusclePercent: number;
  proteinKg: number;
  visceralFatLevel: number;
  targetWeightKg: number;
  fatControlKg: number;
  muscleControl: string;

  // imagens base64 (sem prefixo data:image, o HTML coloca)
  radarPng: string;
  evolutionWeightPng: string;
  evolutionFatPercentPng: string;
  evolutionFatKgPng: string;
  evolutionMuscleKgPng: string;
  segFatPng: string;
  segMusclePng: string;

  // bodymaps em SVG inteiro
  fatBodymapSvg: string;
  muscleBodymapSvg: string;

  // textos IA
  interpretation: string;
  plan: string;
}
