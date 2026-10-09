import { scaleNutrients } from '../../core/units/nutrients.js';
import type { NutrientValue } from './types.js';

export interface CompareRow { key: string; unit: string; a: number | null; b: number | null; diff: number | null }

/**
 * Side-by-side nutrients for the same gram amount. Reports numbers only: no "better" or "healthier" verdict.
 * A nutrient missing on one side stays null, never zero.
 */
export function compareFoods(a: NutrientValue[], b: NutrientValue[], grams: number): CompareRow[] {
  const sa = scaleNutrients(a, grams);
  const sb = scaleNutrients(b, grams);
  const keys = [...new Set([...sa, ...sb].map((n) => n.key))].sort();
  return keys.map((key) => {
    const x = sa.find((n) => n.key === key);
    const y = sb.find((n) => n.key === key);
    if (x && y && x.unit !== y.unit) throw new Error(`unit mismatch for ${key}`);
    const av = x?.value ?? null;
    const bv = y?.value ?? null;
    return { key, unit: (x ?? y)!.unit, a: av, b: bv, diff: av !== null && bv !== null ? Math.round((bv - av) * 100) / 100 : null };
  });
}
