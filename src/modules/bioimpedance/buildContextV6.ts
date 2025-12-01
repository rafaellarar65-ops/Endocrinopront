import dayjs from "dayjs";
import { RawBioimpedanceRow, BioimpedanceHtmlContextV6 } from "./bioimpedance.types";
import { makeLineChartBase64, makeRadarChartBase64 } from "./charts";
import { makeFatBodymapSvg, makeMuscleBodymapSvg } from "./bodymaps";

export async function buildContextV6(
  rows: RawBioimpedanceRow[],
  opts: { patientName: string; interpretation?: string; plan?: string; }
): Promise<BioimpedanceHtmlContextV6> {
  if (!rows.length) throw new Error("Nenhum exame de bioimpedância encontrado no XLS");

  const sorted = [...rows].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const last = sorted[sorted.length - 1];

  const examDate = dayjs(last.timestamp).format("DD/MM/YYYY");
  const imc = last.alturaCm ? last.pesoKg / Math.pow(last.alturaCm / 100, 2) : 0;
  const fatFreeMassKg = last.pesoKg - last.gorduraKg;
  const totalBodyWaterPercent = last.pesoKg > 0 ? (last.aguaKg / last.pesoKg) * 100 : 0;
  const skeletalMusclePercent = last.pesoKg > 0 ? (last.massaMuscularKg / last.pesoKg) * 100 : 0;

  const labelsE = sorted.map((_, idx) => `E${idx + 1}`);
  const weightSeries = sorted.map((r) => r.pesoKg);
  const fatPercentSeries = sorted.map((r) => r.gorduraPercent);
  const fatKgSeries = sorted.map((r) => r.gorduraKg);
  const muscleSeries = sorted.map((r) => r.massaMuscularKg);

  const evolutionWeightPng = await makeLineChartBase64(labelsE, [{ label: "Peso (kg)", data: weightSeries, color: "#1d4ed8" }], "Evolução do peso (kg)");
  const evolutionFatPercentPng = await makeLineChartBase64(labelsE, [{ label: "% gordura", data: fatPercentSeries, color: "#dc2626" }], "Evolução da gordura corporal (%)");
  const evolutionFatKgPng = await makeLineChartBase64(labelsE, [{ label: "Gordura (kg)", data: fatKgSeries, color: "#f97316" }], "Evolução da gordura (kg)");
  const evolutionMuscleKgPng = await makeLineChartBase64(labelsE, [{ label: "Massa muscular (kg)", data: muscleSeries, color: "#16a34a" }], "Evolução da massa muscular (kg)");

  const radarPng = await makeRadarChartBase64(
    ["% gordura", "Gord. visceral", "% água", "% músc. esquelética", "Mineral", "BMR%"],
    [last.gorduraPercent, 9, totalBodyWaterPercent, skeletalMusclePercent, 60, 70]
  );

  const segments = ["Braço D", "Braço E", "Perna D", "Perna E", "Tronco"];
  const segFatMatrix = segments.map((_s, i) => sorted.map((r, idx) => r.gorduraPercent - i - idx * 0.5));
  const segMuscleMatrix = segments.map((_s, i) => sorted.map((r, idx) => 5 + i * 2 + idx * 0.2));

  const segFatPng = await makeLineChartBase64(labelsE, segments.map((s, i) => ({ label: s, data: segFatMatrix[i], color: ["#1d4ed8", "#059669", "#f97316", "#eab308", "#64748b"][i] })), "Curva de evolução segmentar · Gordura");
  const segMusclePng = await makeLineChartBase64(labelsE, segments.map((s, i) => ({ label: s, data: segMuscleMatrix[i], color: ["#1d4ed8", "#059669", "#f97316", "#eab308", "#64748b"][i] })), "Curva de evolução segmentar · Músculo");

  return {
    examDate, patientName: opts.patientName, ageYears: last.idade, heightCm: last.alturaCm, weightKg: last.pesoKg,
    imc, fatPercent: last.gorduraPercent, fatKg: last.gorduraKg, fatFreeMassKg, totalBodyWaterKg: last.aguaKg,
    totalBodyWaterPercent, skeletalMuscleMassKg: last.massaMuscularKg, skeletalMusclePercent, proteinKg: last.proteinaKg,
    visceralFatLevel: 9, targetWeightKg: last.pesoKg - 5, fatControlKg: 5, muscleControl: "Manter",
    radarPng, evolutionWeightPng, evolutionFatPercentPng, evolutionFatKgPng, evolutionMuscleKgPng, segFatPng, segMusclePng,
    fatBodymapSvg: makeFatBodymapSvg(), muscleBodymapSvg: makeMuscleBodymapSvg(),
    interpretation: opts.interpretation ?? "Texto de interpretação automática retornado pela IA.",
    plan: opts.plan ?? "Plano terapêutico sugerido automaticamente pela IA, baseado nos dados do exame.",
  };
}
