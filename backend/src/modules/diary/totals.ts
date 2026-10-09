import { sumNutrients } from '../../core/units/nutrients.js';
import { portionNutrients, type Serving } from '../serving/serving.js';
import type { NutrientValue } from '../food/types.js';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DiaryEntry {
  id: string;
  meal: MealType;
  foodName: string;
  per100g: NutrientValue[];
  serving: Serving;
  quantity: number;
}

export interface DayTotals {
  nutrients: NutrientValue[];
  byMeal: Record<MealType, NutrientValue[]>;
  /** True if any contributing serving is an estimate. */
  approximate: boolean;
  entryCount: number;
}

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function dayTotals(entries: DiaryEntry[]): DayTotals {
  const perEntry = entries.map((e) => ({ e, p: portionNutrients(e.per100g, e.serving, e.quantity) }));
  const byMeal = Object.fromEntries(
    MEALS.map((m) => [m, sumNutrients(perEntry.filter((x) => x.e.meal === m).map((x) => x.p.nutrients))]),
  ) as Record<MealType, NutrientValue[]>;
  return {
    nutrients: sumNutrients(perEntry.map((x) => x.p.nutrients)),
    byMeal,
    approximate: perEntry.some((x) => x.p.approximate),
    entryCount: entries.length,
  };
}

export interface Remaining {
  key: string;
  unit: string;
  target: number;
  consumed: number;
  remaining: number; // negative means over target; shown as such, never clamped
}

export function remainingAgainstTargets(totals: DayTotals, targets: Record<string, { value: number; unit: string }>): Remaining[] {
  return Object.entries(targets).map(([key, t]) => {
    const consumed = totals.nutrients.find((n) => n.key === key)?.value ?? 0;
    return { key, unit: t.unit, target: t.value, consumed, remaining: Math.round((t.value - consumed) * 100) / 100 };
  });
}
