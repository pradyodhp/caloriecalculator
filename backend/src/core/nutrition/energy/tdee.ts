export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/** Conventional activity multipliers applied to BMR. These are rough planning factors, not measurements. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function estimateTdee(bmr: number, level: ActivityLevel): number {
  if (!Number.isFinite(bmr) || bmr <= 0) throw new RangeError('bmr must be positive');
  return Math.round(bmr * ACTIVITY_FACTORS[level]);
}
