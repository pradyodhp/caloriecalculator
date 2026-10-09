export type BiologicalSex = 'male' | 'female';

export interface BmrInput {
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}

function check(n: number, what: string, min: number, max: number) {
  if (!Number.isFinite(n) || n < min || n > max) throw new RangeError(`${what} out of range (${min}-${max})`);
}

/**
 * Mifflin-St Jeor equation (Mifflin et al., Am J Clin Nutr 1990;51:241-247), kcal/day:
 *   male:   10*kg + 6.25*cm - 5*age + 5
 *   female: 10*kg + 6.25*cm - 5*age - 161
 * An ESTIMATE of resting energy expenditure for adults; individual values vary.
 */
export function mifflinStJeor(i: BmrInput): number {
  check(i.weightKg, 'weightKg', 20, 400);
  check(i.heightCm, 'heightCm', 100, 250);
  check(i.ageYears, 'ageYears', 18, 120);
  const base = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.ageYears;
  return Math.round(base + (i.sex === 'male' ? 5 : -161));
}
