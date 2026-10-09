import { scaleNutrients, sumNutrients } from '../../core/units/nutrients.js';
import type { NutrientValue } from '../food/types.js';

export interface Ingredient { foodName: string; grams: number; per100g: NutrientValue[] }

export interface RecipeNutrition {
  totalGrams: number;
  total: NutrientValue[];
  perServing: NutrientValue[];
  per100g: NutrientValue[];
  /** Nutrients missing from at least one ingredient: totals for these are lower bounds, not complete. */
  incompleteNutrients: string[];
}

/**
 * Recipe nutrition from sourced ingredient values. Cooking changes (water loss, oil absorbed) are NOT modelled:
 * values describe the raw ingredients as entered. A nutrient absent from any ingredient is reported as incomplete.
 */
export function recipeNutrition(ingredients: Ingredient[], servings: number): RecipeNutrition {
  if (ingredients.length === 0) throw new RangeError('recipe needs at least one ingredient');
  if (!Number.isFinite(servings) || servings <= 0) throw new RangeError('servings must be positive');
  const totalGrams = ingredients.reduce((s, i) => {
    if (!Number.isFinite(i.grams) || i.grams <= 0) throw new RangeError(`invalid grams for ${i.foodName}`);
    return s + i.grams;
  }, 0);
  const total = sumNutrients(ingredients.map((i) => scaleNutrients(i.per100g, i.grams)));
  const keys = new Set(ingredients.flatMap((i) => i.per100g.map((n) => n.key)));
  const incompleteNutrients = [...keys].filter((k) => ingredients.some((i) => !i.per100g.some((n) => n.key === k)));
  const div = (list: NutrientValue[], by: number) => list.map((n) => ({ ...n, value: Math.round((n.value / by) * 100) / 100 }));
  return {
    totalGrams: Math.round(totalGrams * 100) / 100,
    total,
    perServing: div(total, servings),
    per100g: div(total.map((n) => ({ ...n, value: n.value * 100 })), totalGrams),
    incompleteNutrients: incompleteNutrients.sort(),
  };
}
