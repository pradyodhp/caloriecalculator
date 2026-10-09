import { convertMass } from '../../core/units/convert.js';
import { scaleNutrients } from '../../core/units/nutrients.js';
import type { NutrientValue } from '../food/types.js';

export interface Serving {
  label: string; // e.g. "1 piece", "1 katori (user-measured)"
  gramWeight: number;
  isDefault?: boolean;
  /** Where the gram weight came from. Required for anything that is not a plain mass unit. */
  sourceNote: string;
  /** True when the gram weight is an approximation (household measures usually are). */
  isEstimate: boolean;
}

/** Plain mass servings are exact definitions, available for every food. */
export const MASS_SERVINGS: Serving[] = [
  { label: '100 g', gramWeight: 100, sourceNote: 'mass unit', isEstimate: false },
  { label: '1 g', gramWeight: 1, sourceNote: 'mass unit', isEstimate: false },
  { label: '1 oz', gramWeight: convertMass(1, 'oz', 'g'), sourceNote: 'mass unit', isEstimate: false },
];

export class ServingAmbiguityError extends Error {
  constructor(public readonly options: string[]) {
    super(`Serving is ambiguous; choose one of: ${options.join(', ')}`);
    this.name = 'ServingAmbiguityError';
  }
}

export function availableServings(foodServings: Serving[]): Serving[] {
  const seen = new Set<string>();
  return [...foodServings, ...MASS_SERVINGS].filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true)));
}

/** Pick a serving. With no label, a single default is used; otherwise the caller must choose. */
export function pickServing(foodServings: Serving[], label?: string): Serving {
  const all = availableServings(foodServings);
  if (label) {
    const found = all.find((s) => s.label.toLowerCase() === label.toLowerCase());
    if (!found) throw new ServingAmbiguityError(all.map((s) => s.label));
    return found;
  }
  const defaults = foodServings.filter((s) => s.isDefault);
  if (defaults.length === 1) return defaults[0]!;
  if (foodServings.length === 1) return foodServings[0]!;
  throw new ServingAmbiguityError(all.map((s) => s.label));
}

export interface PortionResult {
  serving: Serving;
  quantity: number;
  grams: number;
  nutrients: NutrientValue[];
  /** True when the gram weight is an estimate, so totals are approximate. */
  approximate: boolean;
}

export function portionNutrients(per100g: NutrientValue[], serving: Serving, quantity: number): PortionResult {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1000) throw new RangeError('quantity must be between 0 and 1000');
  const grams = Math.round(serving.gramWeight * quantity * 100) / 100;
  return { serving, quantity, grams, nutrients: scaleNutrients(per100g, grams), approximate: serving.isEstimate };
}
