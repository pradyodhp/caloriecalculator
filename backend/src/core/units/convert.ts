// Pure unit conversions. Constants are exact definitions or standard conversion factors.
export const KJ_PER_KCAL = 4.184; // thermochemical calorie, exact
export const G_PER_OZ = 28.349523125; // exact
export const G_PER_LB = 453.59237; // exact
export const CM_PER_IN = 2.54; // exact

export type MassUnit = 'g' | 'mg' | 'ug' | 'kg' | 'oz' | 'lb';
const MASS_TO_G: Record<MassUnit, number> = {
  g: 1, mg: 0.001, ug: 0.000001, kg: 1000, oz: G_PER_OZ, lb: G_PER_LB,
};

function finite(n: number, what: string): number {
  if (!Number.isFinite(n)) throw new RangeError(`${what} must be a finite number`);
  return n;
}

export function convertMass(value: number, from: MassUnit, to: MassUnit): number {
  finite(value, 'mass');
  return (value * MASS_TO_G[from]) / MASS_TO_G[to];
}

export const kcalToKj = (kcal: number) => finite(kcal, 'energy') * KJ_PER_KCAL;
export const kjToKcal = (kj: number) => finite(kj, 'energy') / KJ_PER_KCAL;

export const inchesToCm = (i: number) => finite(i, 'length') * CM_PER_IN;
export const cmToInches = (c: number) => finite(c, 'length') / CM_PER_IN;

export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(finite(feet, 'feet') * 12 + finite(inches, 'inches'));
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const total = Math.round(cmToInches(cm) * 10) / 10;
  let feet = Math.floor(total / 12);
  let inches = Math.round((total - feet * 12) * 10) / 10;
  if (inches >= 12) { feet += 1; inches = 0; }
  return { feet, inches };
}
