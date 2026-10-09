const axios = require('axios');
const NodeCache = require('node-cache');
const config = require('../config/env');

const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

// USDA nutrient numbers -> our keys. Values from the search endpoint are per 100 g.
const NUTRIENT_MAP = {
  1008: { key: 'energy', unit: 'kcal' },
  1003: { key: 'protein', unit: 'g' },
  1004: { key: 'fat', unit: 'g' },
  1005: { key: 'carbohydrate', unit: 'g' },
  1079: { key: 'fiber', unit: 'g' },
  2000: { key: 'sugars', unit: 'g' },
  1258: { key: 'saturatedFat', unit: 'g' },
  1093: { key: 'sodium', unit: 'mg' },
};

class ProviderError extends Error {}

class UsdaService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 });
  }

  extractNutrients(food) {
    const out = [];
    for (const n of food.foodNutrients || []) {
      const meta = NUTRIENT_MAP[Number(n.nutrientNumber)];
      if (meta && typeof n.value === 'number') {
        out.push({ key: meta.key, value: n.value, unit: meta.unit });
      }
    }
    return out;
  }

  async searchFood(query) {
    if (!config.usdaApiKey) throw new ProviderError('USDA_API_KEY is not configured');
    const cacheKey = `usda_${query.toLowerCase().trim()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const response = await axios.get(USDA_API_URL, {
      params: { query, api_key: config.usdaApiKey, pageSize: 1 },
      timeout: 10000,
    });
    const food = (response.data.foods || [])[0];
    if (!food) return { found: false };

    const result = {
      found: true,
      data: {
        description: food.description,
        sourceId: String(food.fdcId),
        dataType: food.dataType,
        retrievedAt: new Date().toISOString(),
        nutrients: this.extractNutrients(food),
      },
    };
    this.cache.set(cacheKey, result);
    return result;
  }
}

module.exports = new UsdaService();
module.exports.ProviderError = ProviderError;
