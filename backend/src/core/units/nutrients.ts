import type { NutrientValue } from '../../modules/food/types.js';

// Scale per-100g nutrient values to an actual gram amount. Never returns NaN/Infinity.
export function scaleNutrients(per100g: NutrientValue[], grams: number): NutrientValue[] {
  if (!Number.isFinite(grams) || grams < 0) throw new RangeError('grams must be a finite, non-negative number');
  return per100g.map((n) => ({ ...n, value: Math.round(((n.value * grams) / 100) * 100) / 100 }));
}

export function sumNutrients(lists: NutrientValue[][]): NutrientValue[] {
  const acc = new Map<string, NutrientValue>();
  for (const list of lists) {
    for (const n of list) {
      const cur = acc.get(n.key);
      if (cur && cur.unit !== n.unit) throw new Error(`unit mismatch for ${n.key}: ${cur.unit} vs ${n.unit}`);
      acc.set(n.key, { ...n, value: (cur?.value ?? 0) + n.value });
    }
  }
  return [...acc.values()].map((n) => ({ ...n, value: Math.round(n.value * 100) / 100 }));
}
