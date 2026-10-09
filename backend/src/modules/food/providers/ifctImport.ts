import { parse } from 'csv-parse/sync';
import { kjToKcal } from '../../../core/units/convert.js';
import type { FoodRecord, NutrientValue } from '../types.js';

// IFCT 2017 column -> our nutrient. Source representations (ifct2017 `representations`):
// enerc is kJ, mass columns are g per 100 g, `na` is stored in g and converted to mg (x1000).
interface ColMap { col: string; key: string; unit: NutrientValue['unit']; scale?: number; kj?: boolean }
const COLUMNS: ColMap[] = [
  { col: 'enerc', key: 'energy', unit: 'kcal', kj: true },
  { col: 'protcnt', key: 'protein', unit: 'g' },
  { col: 'fatce', key: 'fat', unit: 'g' },
  { col: 'choavldf', key: 'carbohydrate', unit: 'g' },
  { col: 'fibtg', key: 'fiber', unit: 'g' },
  { col: 'fasat', key: 'saturatedFat', unit: 'g' },
  { col: 'fsugar', key: 'freeSugars', unit: 'g' },
  { col: 'na', key: 'sodium', unit: 'mg', scale: 1000 },
];

const round = (n: number) => Math.round(n * 1000) / 1000;

export const IFCT_SOURCE = 'Indian Food Composition Tables 2017 (ICMR-NIN), via ifct2017 dataset';

export function importIfctCompositions(csvText: string, retrievedAt: string): FoodRecord[] {
  const rows = parse(csvText, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const out: FoodRecord[] = [];
  for (const r of rows) {
    if (!r.code || !r.name) continue;
    const nutrients: NutrientValue[] = [];
    for (const c of COLUMNS) {
      const raw = r[c.col];
      if (raw === undefined || raw === '') continue; // missing stays missing, never zero
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      const value = c.kj ? kjToKcal(n) : n * (c.scale ?? 1);
      nutrients.push({ key: c.key, value: round(value), unit: c.unit });
    }
    out.push({
      description: r.name,
      sourceType: 'curated_indian',
      source: IFCT_SOURCE,
      sourceId: r.code,
      dataType: r.grup || undefined,
      retrievedAt,
      basis: 'per 100 g',
      nutrients,
    });
  }
  return out;
}
