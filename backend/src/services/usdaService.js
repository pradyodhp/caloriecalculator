const axios = require("axios");
const NodeCache = require("node-cache");

class UsdaService {
    constructor() {
        this.cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
        this.USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
        this.USDA_API_KEY = process.env.USDA_API_KEY || "XVA7kJgZhK3bw3o7fVWGd3SPHUVsfRBDd5v8YDcC";
    }

    // 🧪 EXTRACT NUTRIENTS FROM USDA
    extractNutrients(food) {
        const nutrients = { calories: 0, sugar: 0, saturatedFat: 0, protein: 0, fiber: 0, sodium: 0 };

        food.foodNutrients?.forEach((nutrient) => {
            const name = nutrient.nutrientName.toLowerCase();
            if (name.includes("energy") || name.includes("kcal")) nutrients.calories = nutrient.value || 0;
            else if (name.includes("sugar")) nutrients.sugar = nutrient.value || 0;
            else if (name.includes("saturated")) nutrients.saturatedFat = nutrient.value || 0;
            else if (name.includes("protein")) nutrients.protein = nutrient.value || 0;
            else if (name.includes("fiber")) nutrients.fiber = nutrient.value || 0;
            else if (name.includes("sodium")) nutrients.sodium = nutrient.value || 0;
        });

        return nutrients;
    }

    // 🍕 DEMO FOODS FALLBACK
    getDemoFood(foodName) {
        const demoFoods = {
            'pizza': {
                description: "Pizza, cheese, regular crust (USDA Estimate)",
                nutrients: { calories: 285, sugar: 3.6, saturatedFat: 4.5, protein: 12, fiber: 2.3, sodium: 640 },
                cookingMethod: "baked",
                foodType: "processed_grain"
            },
            'apple': {
                description: "Apple, raw, with skin (USDA Estimate)",
                nutrients: { calories: 52, sugar: 10, saturatedFat: 0, protein: 0.3, fiber: 2.4, sodium: 1 },
                cookingMethod: "raw",
                foodType: "fruit"
            },
            'banana': {
                description: "Banana, raw (USDA Estimate)",
                nutrients: { calories: 89, sugar: 12, saturatedFat: 0.1, protein: 1.1, fiber: 2.6, sodium: 1 },
                cookingMethod: "raw",
                foodType: "fruit"
            },
            'burger': {
                description: "Beef Burger (USDA Estimate)",
                nutrients: { calories: 354, sugar: 5, saturatedFat: 7, protein: 17, fiber: 2, sodium: 500 },
                cookingMethod: "grilled",
                foodType: "processed_meat"
            }
        };
        return demoFoods[foodName.toLowerCase()];
    }

    async searchFood(query) {
        const cacheKey = `usda_${query.toLowerCase().trim()}`;
        const cachedData = this.cache.get(cacheKey);

        if (cachedData) {
            console.log(`📦 Serving from cache: ${query}`);
            return cachedData;
        }

        try {
            console.log(`🔑 Using API Key: ${this.USDA_API_KEY.substring(0, 8)}...`);

            const response = await axios.get(this.USDA_API_URL, {
                params: {
                    query: query,
                    api_key: this.USDA_API_KEY,
                    pageSize: 1,
                },
                timeout: 10000
            });

            console.log(`📊 USDA API Response status: ${response.status}`);

            if (response.data.foods && response.data.foods.length > 0) {
                const food = response.data.foods[0];
                console.log(`✅ USDA Food found: ${food.description}`);
                const nutrients = this.extractNutrients(food);

                const result = {
                    found: true,
                    data: {
                        description: food.description,
                        nutrients: nutrients
                    }
                };

                this.cache.set(cacheKey, result);
                return result;
            }

            return { found: false };
        } catch (error) {
            console.error('❌ USDA API Error:', error.message);
            throw error;
        }
    }
}

module.exports = new UsdaService();
