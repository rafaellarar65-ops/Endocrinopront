import fs from "fs";
import path from "path";
import { BioimpedanceHtmlContextV6 } from "./bioimpedance.types";

const TEMPLATE_PATH = path.join(__dirname, "bioimpedance-report-v6.html");

export function renderBioimpedanceHtmlV6(ctx: BioimpedanceHtmlContextV6): string {
  let html = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  const replacements: Record<string, string | number> = {
    examDate: ctx.examDate, patientName: ctx.patientName, ageYears: ctx.ageYears, heightCm: ctx.heightCm,
    weightKg: ctx.weightKg.toFixed(1), imc: ctx.imc.toFixed(1), fatPercent: ctx.fatPercent.toFixed(1),
    fatKg: ctx.fatKg.toFixed(1), fatFreeMassKg: ctx.fatFreeMassKg.toFixed(1), totalBodyWaterKg: ctx.totalBodyWaterKg.toFixed(1),
    totalBodyWaterPercent: ctx.totalBodyWaterPercent.toFixed(1), skeletalMuscleMassKg: ctx.skeletalMuscleMassKg.toFixed(1),
    skeletalMusclePercent: ctx.skeletalMusclePercent.toFixed(1), proteinKg: ctx.proteinKg.toFixed(1),
    visceralFatLevel: ctx.visceralFatLevel.toFixed(0), targetWeightKg: ctx.targetWeightKg.toFixed(1),
    fatControlKg: ctx.fatControlKg.toFixed(1), muscleControl: ctx.muscleControl, radarPng: ctx.radarPng,
    evolutionWeightPng: ctx.evolutionWeightPng, evolutionFatPercentPng: ctx.evolutionFatPercentPng,
    evolutionFatKgPng: ctx.evolutionFatKgPng, evolutionMuscleKgPng: ctx.evolutionMuscleKgPng,
    segFatPng: ctx.segFatPng, segMusclePng: ctx.segMusclePng, fatBodymapSvg: ctx.fatBodymapSvg,
    muscleBodymapSvg: ctx.muscleBodymapSvg, interpretation: ctx.interpretation, plan: ctx.plan,
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }
  return html;
}
