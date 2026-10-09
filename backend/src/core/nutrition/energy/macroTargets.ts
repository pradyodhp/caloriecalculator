import type { GoalType } from './calorieTarget.js';

export interface MacroTargets {
  proteinG: number;
  fatG: number;
  carbG: number;
  fiberG: number;
  kcalCheck: number;
}

// Energy density, kcal per gram (Atwater general factors).
const KCAL_PER_G = { protein: 4, carb: 4, fat: 9 } as const;

/** Protein grams per kg body weight by goal. Planning defaults for general use. */
const PROTEIN_G_PER_KG: Record<GoalType, number> = {
  lose_weight: 1.6, maintain_weight: 1.2, gain_weight: 1.4,
  build_muscle: 1.8, improve_protein: 1.6, improve_fiber: 1.2, balanced: 1.2,
};

/** Fat as a share of calories; carbs take the remainder. Fiber: 14 g per 1000 kcal. */
const FAT_SHARE = 0.28;

export function macroTargets(kcal: number, weightKg: number, goal: GoalType): MacroTargets {
  if (!Number.isFinite(kcal) || kcal <= 0) throw new RangeError('kcal must be positive');
  if (!Number.isFinite(weightKg) || weightKg <= 0) throw new RangeError('weightKg must be positive');
  const proteinG = Math.round(PROTEIN_G_PER_KG[goal] * weightKg);
  const fatG = Math.round((kcal * FAT_SHARE) / KCAL_PER_G.fat);
  const carbKcal = kcal - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat;
  const carbG = Math.max(0, Math.round(carbKcal / KCAL_PER_G.carb));
  const fiberG = Math.round((kcal / 1000) * 14);
  const kcalCheck = proteinG * 4 + fatG * 9 + carbG * 4;
  return { proteinG, fatG, carbG, fiberG, kcalCheck };
}
