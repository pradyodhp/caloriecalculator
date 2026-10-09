import axios from 'axios';
import NodeCache from 'node-cache';
import { ExternalProviderError } from '../../../shared/errors.js';
import type { FoodProvider, FoodRecord, NutrientValue } from '../types.js';

const URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

const NUTRIENT_MAP: Record<number, { key: string; unit: NutrientValue['unit'] }> = {
  1008: { key: 'energy', unit: 'kcal' },
  1003: { key: 'protein', unit: 'g' },
  1004: { key: 'fat', unit: 'g' },
  1005: { key: 'carbohydrate', unit: 'g' },
  1079: { key: 'fiber', unit: 'g' },
  2000: { key: 'sugars', unit: 'g' },
  1258: { key: 'saturatedFat', unit: 'g' },
  1093: { key: 'sodium', unit: 'mg' },
};

interface UsdaFood {
  fdcId: number;
  description: string;
  dataType?: string;
  foodNutrients?: { nutrientNumber?: string | number; value?: number }[];
}

export function extractNutrients(food: Pick<UsdaFood, 'foodNutrients'>): NutrientValue[] {
  const out: NutrientValue[] = [];
  for (const n of food.foodNutrients ?? []) {
    const meta = NUTRIENT_MAP[Number(n.nutrientNumber)];
    if (meta && typeof n.value === 'number') out.push({ key: meta.key, value: n.value, unit: meta.unit });
  }
  return out;
}

export class UsdaProvider implements FoodProvider {
  readonly sourceType = 'usda' as const;
  private cache = new NodeCache({ stdTTL: 3600 });

  constructor(private apiKey: string) {}

  async search(query: string): Promise<FoodRecord | null> {
    if (!this.apiKey) throw new ExternalProviderError('USDA_API_KEY is not configured');
    const key = query.toLowerCase().trim();
    const cached = this.cache.get<FoodRecord | null>(key);
    if (cached !== undefined) return cached;

    let foods: UsdaFood[];
    try {
      const res = await axios.get<{ foods?: UsdaFood[] }>(URL, {
        params: { query, api_key: this.apiKey, pageSize: 1 },
        timeout: 10000,
      });
      foods = res.data.foods ?? [];
    } catch {
      throw new ExternalProviderError();
    }
    const f = foods[0];
    const record: FoodRecord | null = f
      ? {
          description: f.description,
          sourceType: 'usda',
          source: 'USDA FoodData Central',
          sourceId: String(f.fdcId),
          dataType: f.dataType,
          retrievedAt: new Date().toISOString(),
          basis: 'per 100 g',
          nutrients: extractNutrients(f),
        }
      : null;
    this.cache.set(key, record);
    return record;
  }
}
