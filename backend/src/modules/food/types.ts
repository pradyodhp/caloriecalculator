export type SourceType = 'usda' | 'curated_indian' | 'user' | 'community' | 'demo';

export interface NutrientValue {
  key: string;
  value: number;
  unit: 'kcal' | 'g' | 'mg' | 'ug';
}

export interface FoodRecord {
  description: string;
  sourceType: SourceType;
  source: string;
  sourceId: string;
  dataType?: string;
  retrievedAt: string;
  basis: 'per 100 g';
  nutrients: NutrientValue[];
}

export interface FoodProvider {
  readonly sourceType: SourceType;
  readonly name: string;
  search(query: string, limit: number): Promise<FoodRecord[]>;
}
