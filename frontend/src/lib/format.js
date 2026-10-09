// Pure helpers, unit tested. Colour rule: blue = on track, red = over target, neutral otherwise.
export function pct(consumed, target) {
  if (!Number.isFinite(consumed) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, (consumed / target) * 100);
}

export function budgetState(consumed, target) {
  const p = pct(consumed, target);
  if (p > 110) return 'over';
  if (p >= 85) return 'on-track';
  return 'under';
}

export function nutrient(list, key) {
  const n = (list || []).find((x) => x.key === key);
  return n ? n.value : 0;
}

export const NUTRIENT_LABELS = {
  energy: 'Energy', protein: 'Protein', fat: 'Fat', carbohydrate: 'Carbohydrate', fiber: 'Fiber',
  sugars: 'Sugars', freeSugars: 'Free sugars', saturatedFat: 'Saturated fat', sodium: 'Sodium',
};

export function fmt(n, digits = 0) {
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : '-';
}

export const SOURCE_LABELS = {
  usda: 'USDA FoodData Central',
  curated_indian: 'IFCT 2017 (ICMR-NIN)',
  user: 'User-entered (unverified)',
  community: 'Community (unverified)',
  demo: 'Demonstration data',
};
