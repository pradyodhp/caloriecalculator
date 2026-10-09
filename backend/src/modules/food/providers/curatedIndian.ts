import { readFileSync, existsSync } from 'node:fs';
import type { FoodProvider, FoodRecord } from '../types.js';

/** Searches a locally generated IFCT 2017 dataset. Empty when the dataset has not been imported. */
export class CuratedIndianProvider implements FoodProvider {
  readonly sourceType = 'curated_indian' as const;
  readonly name = 'Curated Indian foods (IFCT 2017)';
  private foods: FoodRecord[];

  constructor(foods: FoodRecord[]) {
    this.foods = foods;
  }

  static fromFile(path: string): CuratedIndianProvider {
    if (!existsSync(path)) return new CuratedIndianProvider([]);
    return new CuratedIndianProvider(JSON.parse(readFileSync(path, 'utf8')) as FoodRecord[]);
  }

  get size() { return this.foods.length; }

  async search(query: string, limit: number): Promise<FoodRecord[]> {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return this.foods
      .filter((f) => {
        const d = f.description.toLowerCase();
        return words.every((w) => d.includes(w));
      })
      .slice(0, limit);
  }
}
