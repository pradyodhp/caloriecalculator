import type { BiologicalSex } from './bmr.js';

export type GoalType =
  | 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'build_muscle'
  | 'improve_protein' | 'improve_fiber' | 'balanced';
export type Aggressiveness = 'gentle' | 'standard' | 'ambitious';

/** Daily energy adjustment (kcal) relative to estimated TDEE, by goal and pace. */
const ADJUSTMENT: Partial<Record<GoalType, Record<Aggressiveness, number>>> = {
  lose_weight: { gentle: -250, standard: -500, ambitious: -750 },
  gain_weight: { gentle: 250, standard: 400, ambitious: 600 },
  build_muscle: { gentle: 150, standard: 250, ambitious: 400 },
};

/** Floors are a conservative guard against implausibly low targets, not a medical threshold. */
export const MIN_TARGET_KCAL: Record<BiologicalSex, number> = { female: 1200, male: 1500 };

export interface CalorieTarget {
  kcal: number;
  adjustment: number;
  floorApplied: boolean;
}

export function calorieTarget(tdee: number, goal: GoalType, pace: Aggressiveness, sex: BiologicalSex): CalorieTarget {
  if (!Number.isFinite(tdee) || tdee <= 0) throw new RangeError('tdee must be positive');
  const adjustment = ADJUSTMENT[goal]?.[pace] ?? 0;
  const raw = tdee + adjustment;
  const floor = MIN_TARGET_KCAL[sex];
  const floorApplied = raw < floor;
  return { kcal: Math.round(floorApplied ? floor : raw), adjustment, floorApplied };
}
