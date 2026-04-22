const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require('path');
const fs = require('fs');
const axios = require("axios");
const NodeCache = require("node-cache");

// Load environment variables
const envPaths = [
    path.join(__dirname, '.env'),           // Same directory as server.js
    path.join(process.cwd(), '.env'),       // Current working directory
    path.join(__dirname, '..', '.env')      // Parent directory
];

let envLoaded = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        console.log(`✅ LOADED .env from: ${envPath}`);
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.log('❌ No .env file found in any location!');
}

// ==========================================
// DATA & CONSTANTS
// ==========================================

// MEDICAL-GRADED FOOD DATABASE
const MEDICAL_FOODS_DATABASE = {
    // LEAN PROTEINS (HIGHEST SCORE)
    "boiled eggs": {
        description: "Boiled Eggs (2 pieces) - Excellent Protein Source",
        nutrients: { calories: 155, sugar: 1.1, saturatedFat: 3.1, protein: 13, fiber: 0, sodium: 124 },
        cookingMethod: "boiled",
        foodType: "lean_protein"
    },
    "grilled chicken": {
        description: "Grilled Chicken Breast - Lean Protein",
        nutrients: { calories: 165, sugar: 0, saturatedFat: 1, protein: 31, fiber: 0, sodium: 74 },
        cookingMethod: "grilled",
        foodType: "lean_protein"
    },

    // HEALTHY INDIAN STAPLES (HIGH SCORE)
    "idli": {
        description: "Idli - Fermented Steamed Rice Cake",
        nutrients: { calories: 58, sugar: 0.2, saturatedFat: 0.1, protein: 2, fiber: 1, sodium: 5 },
        cookingMethod: "steamed",
        foodType: "fermented_healthy"
    },
    "dosa": {
        description: "Dosa - Fermented Lentil & Rice Crepe",
        nutrients: { calories: 120, sugar: 0.5, saturatedFat: 0.5, protein: 4, fiber: 2, sodium: 50 },
        cookingMethod: "griddle_cooked",
        foodType: "fermented_healthy"
    },
    "chapati": {
        description: "Chapati - Whole Wheat Flatbread",
        nutrients: { calories: 110, sugar: 0.5, saturatedFat: 0.3, protein: 3, fiber: 3, sodium: 55 },
        cookingMethod: "griddle_cooked",
        foodType: "whole_grain"
    },
    "dal": {
        description: "Dal - Lentil Soup (Minimal Oil)",
        nutrients: { calories: 120, sugar: 2, saturatedFat: 0.5, protein: 8, fiber: 5, sodium: 200 },
        cookingMethod: "boiled",
        foodType: "plant_protein"
    },
    "sambhar": {
        description: "Sambhar - Lentil & Vegetable Stew",
        nutrients: { calories: 100, sugar: 2, saturatedFat: 0.5, protein: 6, fiber: 4, sodium: 280 },
        cookingMethod: "boiled",
        foodType: "plant_protein"
    },

    // MODERATE FOODS
    "paneer": {
        description: "Paneer - Cottage Cheese (Grilled/Boiled)",
        nutrients: { calories: 250, sugar: 2, saturatedFat: 6, protein: 18, fiber: 0, sodium: 30 },
        cookingMethod: "grilled",
        foodType: "dairy_protein"
    },

    // UNHEALTHY BUT COMMON (LOW SCORE)
    "samosa": {
        description: "Samosa - Deep Fried Pastry",
        nutrients: { calories: 252, sugar: 2, saturatedFat: 5, protein: 6, fiber: 3, sodium: 422 },
        cookingMethod: "deep_fried",
        foodType: "fried_snack"
    },
    "puri": {
        description: "Puri - Deep Fried Bread",
        nutrients: { calories: 180, sugar: 1, saturatedFat: 7, protein: 3, fiber: 2, sodium: 150 },
        cookingMethod: "deep_fried",
        foodType: "fried_bread"
    },

    // DIABETES TRIGGERS (LOWEST SCORE)
    "gulab jamun": {
        description: "Gulab Jamun - Sugar Syrup Soaked Sweet",
        nutrients: { calories: 387, sugar: 45, saturatedFat: 10, protein: 4, fiber: 0, sodium: 15 },
        cookingMethod: "deep_fried_sweet",
        foodType: "sweet_dessert"
    },
    "jalebi": {
        description: "Jalebi - Deep Fried Sweet in Syrup",
        nutrients: { calories: 300, sugar: 35, saturatedFat: 8, protein: 3, fiber: 0, sodium: 20 },
        cookingMethod: "deep_fried_sweet",
        foodType: "sweet_dessert"
    }
};

// MEDICAL HEALTH SCALE
const MEDICAL_HEALTH_SCALE = {
    10: { label: "DOCTOR'S CHOICE", desc: "Excellent for diabetes & heart health" },
    9: { label: "SUPER HEALTHY", desc: "Ideal for daily consumption" },
    8: { label: "VERY HEALTHY", desc: "Great for metabolic health" },
    7: { label: "HEALTHY", desc: "Good choice with portion control" },
    6: { label: "MODERATE", desc: "Occasional consumption okay" },
    5: { label: "CAUTION", desc: "Limit to once per week" },
    4: { label: "UNHEALTHY", desc: "High risk for diabetes" },
    3: { label: "DANGEROUS", desc: "Very high diabetes risk" },
    2: { label: "AVOID", desc: "Severe health risk" },
    1: { label: "MEDICAL EMERGENCY", desc: "Extremely dangerous for diabetics" }
};

// ==========================================
// SERVICES
// ==========================================

class MedicalService {
    // 🩺 STRICTER MEDICAL SCORING ALGORITHM
    calculateMedicalHealthIndex(nutrients, cookingMethod = "unknown", foodType = "unknown") {
        let score = 5; // Start with neutral base (not 7)
        const medicalReasons = [];
        const doctorWarnings = [];
        const doctorRecommendations = [];

        // 🚫 MAJOR RED FLAGS - INSTANT PENALTIES
        let redFlags = 0;

        // 1. DEEP FRIED - AUTOMATIC MAJOR PENALTY
        if (cookingMethod.includes("deep_fried")) {
            score -= 4;
            redFlags++;
            medicalReasons.push("🚨 CRITICAL: Deep fried - toxic compounds formed");
            doctorWarnings.push("Deep frying creates advanced glycation end products (AGEs)");
        }

        // 2. EXTREME SUGAR - DIABETES RISK
        if (nutrients.sugar > 20) {
            score -= 3;
            redFlags++;
            medicalReasons.push("🚨 DANGEROUS: Very high sugar - immediate diabetes risk");
            doctorWarnings.push("Causes rapid blood sugar spikes and insulin resistance");
        } else if (nutrients.sugar > 10) {
            score -= 2;
            medicalReasons.push("⚠️ WARNING: High sugar content");
        }

        // 3. EXTREME SATURATED FAT - HEART DISEASE
        if (nutrients.saturatedFat > 8) {
            score -= 3;
            redFlags++;
            medicalReasons.push("🚨 DANGEROUS: Very high saturated fat - heart disease risk");
            doctorWarnings.push("Raises LDL cholesterol significantly");
        } else if (nutrients.saturatedFat > 5) {
            score -= 2;
            medicalReasons.push("⚠️ WARNING: High saturated fat");
        }

        // 4. EXTREME SODIUM - HYPERTENSION
        if (nutrients.sodium > 800) {
            score -= 2;
            medicalReasons.push("⚠️ WARNING: Very high sodium - hypertension risk");
        }

        // 💪 HEALTH PROMOTING FACTORS (More Conservative)

        // 5. PROTEIN - Conservative bonus
        if (nutrients.protein > 20 && redFlags === 0) {
            score += 2;
            medicalReasons.push("✅ EXCELLENT: Very high quality protein");
        } else if (nutrients.protein > 15 && redFlags === 0) {
            score += 1;
            medicalReasons.push("✅ GOOD: High protein content");
        } else if (nutrients.protein > 10) {
            score += 0.5; // Minor bonus only
            medicalReasons.push("ℹ️ MODERATE: Some protein");
        }

        // 6. FIBER - Good but not enough to overcome red flags
        if (nutrients.fiber > 5 && redFlags === 0) {
            score += 2;
            medicalReasons.push("✅ EXCELLENT: High fiber - gut health");
        } else if (nutrients.fiber > 3) {
            score += 1;
            medicalReasons.push("✅ GOOD: Good fiber content");
        }

        // 7. HEALTHY COOKING METHODS
        if (cookingMethod.includes("steamed") || cookingMethod.includes("boiled")) {
            score += 2;
            medicalReasons.push("✅ EXCELLENT: Healthy cooking method - preserves nutrients");
        }

        // 8. SUPERFOOD CATEGORIES (Only if no red flags)
        if (redFlags === 0) {
            if (foodType.includes("lean_protein")) {
                score += 2;
                medicalReasons.push("✅ EXCELLENT: Lean protein - ideal for metabolic health");
            }

            if (foodType.includes("fermented")) {
                score += 2;
                medicalReasons.push("✅ EXCELLENT: Fermented - probiotic benefits");
            }

            if (foodType.includes("whole_grain")) {
                score += 2;
                medicalReasons.push("✅ EXCELLENT: Whole grain - sustained energy release");
            }
        }

        // 🎯 SPECIAL CASES - MANUAL OVERRIDES

        // JUNK FOODS - NEVER above 6/10
        const isJunkFood = cookingMethod.includes("deep_fried") ||
            nutrients.sugar > 15 ||
            nutrients.saturatedFat > 8;

        if (isJunkFood) {
            score = Math.min(score, 6); // Cap at 6/10 max for junk
            medicalReasons.push("⚠️ CLASSIFIED: Processed/Junk Food Category");
        }

        // SUPERFOODS - Deserve high scores
        const isSuperFood = (foodType.includes("lean_protein") &&
            cookingMethod.includes("boiled") &&
            nutrients.saturatedFat < 4) ||
            (foodType.includes("fermented") &&
                nutrients.sugar < 5);

        if (isSuperFood) {
            score = Math.max(score, 8); // Minimum 8/10 for superfoods
            medicalReasons.push("🎯 CLASSIFIED: Superfood Category");
        }

        // FINAL SCORE ADJUSTMENT - Very strict
        let finalScore = Math.min(Math.max(Math.round(score), 1), 10);

        // 🚫 ANTI-INFLATION: Very few foods should get 9-10/10
        if (finalScore >= 9) {
            // Only allow 9-10/10 for truly exceptional foods
            const isExceptional = (nutrients.sugar < 3) &&
                (nutrients.saturatedFat < 3) &&
                (nutrients.sodium < 200) &&
                (nutrients.protein > 10 || nutrients.fiber > 5) &&
                !cookingMethod.includes("fried");

            if (!isExceptional) {
                finalScore = Math.min(finalScore, 8);
                medicalReasons.push("ℹ️ ADJUSTED: Does not meet exceptional food criteria");
            }
        }

        const rating = MEDICAL_HEALTH_SCALE[finalScore];

        return {
            score: finalScore,
            label: rating.label,
            description: rating.desc,
            breakdown: medicalReasons,
            doctorWarnings: doctorWarnings,
            doctorRecommendations: doctorRecommendations,
            medicalPriority: finalScore >= 8 ? "GREEN" : finalScore >= 5 ? "YELLOW" : "RED"
        };
    }

    // 🎯 FIND LOCAL FOOD
    findMedicalFood(foodName) {
        const searchTerm = foodName.toLowerCase().trim();

        // Direct match
        if (MEDICAL_FOODS_DATABASE[searchTerm]) {
            return {
                ...MEDICAL_FOODS_DATABASE[searchTerm],
                source: 'medical_database',
                originalName: searchTerm
            };
        }

        // Partial match
        for (const [key, food] of Object.entries(MEDICAL_FOODS_DATABASE)) {
            if (searchTerm.includes(key) || key.includes(searchTerm)) {
                return {
                    ...food,
                    source: 'medical_database',
                    originalName: key
                };
            }
        }

        return null;
    }

    // 🥗 MEDICAL ALTERNATIVES
    getMedicalAlternatives(currentFood, currentScore, foodType) {
        const alternatives = [];

        if (currentScore <= 4) {
            // HIGH RISK FOODS
            if (foodType.includes("deep_fried")) {
                alternatives.push(
                    "STEAMED IDLI - Zero oil, fermented benefits",
                    "GRILLED PANEER - High protein, low oil",
                    "BOILED EGG WHITES - Pure protein, diabetes safe",
                    "DAL SOUP - High fiber, plant protein"
                );
            } else if (foodType.includes("sweet")) {
                alternatives.push(
                    "FRESH FRUIT SALAD - Natural sweetness with fiber",
                    "PLAIN YOGURT WITH BERRIES - Protein + antioxidants",
                    "CUCUMBER MINT SALAD - Refreshing, zero sugar"
                );
            }
        } else if (currentScore <= 6) {
            alternatives.push(
                "Try reducing oil by 50% in preparation",
                "Add more vegetables to increase fiber",
                "Use whole grain alternatives",
                "Combine with protein to balance blood sugar"
            );
        } else {
            alternatives.push(
                "EXCELLENT CHOICE! Continue including in diet",
                "Consider portion control for weight management",
                "Pair with vegetables for added fiber",
                "This is doctor-recommended for diabetes prevention"
            );
        }

        return alternatives;
    }
}

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

// Instantiate Services
const medicalService = new MedicalService();
const usdaService = new UsdaService();

// ==========================================
// CONTROLLER
// ==========================================

class NutritionController {
    async getNutrition(req, res) {
        try {
            const item = req.params.item.toLowerCase().trim();
            console.log(`🩺 Medical analysis for: ${item}`);

            // 1. Check medical database first
            const medicalFood = medicalService.findMedicalFood(item);
            if (medicalFood) {
                console.log('✅ Found in medical database');
                const healthIndex = medicalService.calculateMedicalHealthIndex(
                    medicalFood.nutrients,
                    medicalFood.cookingMethod,
                    medicalFood.foodType
                );

                return res.json({
                    food: {
                        description: medicalFood.description,
                        source: "🏥 Medical Nutrition Database",
                        cookingMethod: medicalFood.cookingMethod,
                        foodType: medicalFood.foodType,
                        nutrients: formatNutrients(medicalFood.nutrients)
                    },
                    healthIndex: formatHealthIndex(healthIndex),
                    doctorAdvice: {
                        warnings: healthIndex.doctorWarnings,
                        recommendations: healthIndex.doctorRecommendations
                    },
                    alternatives: medicalService.getMedicalAlternatives(item, healthIndex.score, medicalFood.foodType),
                    medicalVerdict: getMedicalVerdict(healthIndex.score)
                });
            }

            // 2. Fallback to USDA API
            console.log('🔍 Not in medical database, trying USDA API...');

            try {
                const usdaResult = await usdaService.searchFood(item);

                if (usdaResult.found) {
                    const { description, nutrients } = usdaResult.data;
                    const healthIndex = medicalService.calculateMedicalHealthIndex(nutrients);

                    return res.json({
                        food: {
                            description: description,
                            source: "🇺🇸 USDA Database",
                            cookingMethod: "unknown",
                            foodType: "general",
                            nutrients: formatNutrients(nutrients)
                        },
                        healthIndex: formatHealthIndex(healthIndex),
                        doctorAdvice: {
                            warnings: healthIndex.doctorWarnings,
                            recommendations: healthIndex.doctorRecommendations
                        },
                        alternatives: medicalService.getMedicalAlternatives(item, healthIndex.score, "general"),
                        medicalVerdict: getMedicalVerdict(healthIndex.score)
                    });
                }

                console.log('❌ No foods found in USDA API, trying demo data...');
                // Fall through to demo data
            } catch (error) {
                console.error('❌ USDA API Error (Controller):', error.message);
                // Fall through to demo data
            }

            // 3. Try demo data as final fallback
            const demoFood = usdaService.getDemoFood(item);
            if (demoFood) {
                console.log('🔄 Using demo data as fallback');
                const healthIndex = medicalService.calculateMedicalHealthIndex(
                    demoFood.nutrients,
                    demoFood.cookingMethod,
                    demoFood.foodType
                );

                return res.json({
                    food: {
                        description: demoFood.description,
                        source: "🇺🇸 USDA Demo Data (Fallback)",
                        cookingMethod: demoFood.cookingMethod,
                        foodType: demoFood.foodType,
                        nutrients: formatNutrients(demoFood.nutrients)
                    },
                    healthIndex: formatHealthIndex(healthIndex),
                    doctorAdvice: {
                        warnings: healthIndex.doctorWarnings,
                        recommendations: healthIndex.doctorRecommendations
                    },
                    alternatives: medicalService.getMedicalAlternatives(item, healthIndex.score, demoFood.foodType),
                    medicalVerdict: getMedicalVerdict(healthIndex.score)
                });
            }

            // 4. Final fallback - Not Found
            res.status(404).json({
                message: "Food not found in medical or USDA database",
                suggestion: "Try common Indian foods: idli, chapati, dal, samosa, paneer"
            });

        } catch (error) {
            console.error('💥 Server Error:', error);
            res.status(500).json({
                error: "Medical server error",
                advice: "Please try common Indian food names"
            });
        }
    }
}

// Helper functions
function formatNutrients(nutrients) {
    return {
        calories: `${nutrients.calories} kcal`,
        sugar: `${nutrients.sugar}g ${nutrients.sugar > 10 ? '🚨' : nutrients.sugar > 5 ? '⚠️' : '✅'}`,
        saturatedFat: `${nutrients.saturatedFat}g ${nutrients.saturatedFat > 5 ? '🚨' : nutrients.saturatedFat > 3 ? '⚠️' : '✅'}`,
        protein: `${nutrients.protein}g ${nutrients.protein > 10 ? '✅' : 'ℹ️'}`,
        fiber: `${nutrients.fiber}g ${nutrients.fiber > 3 ? '✅' : 'ℹ️'}`,
        sodium: `${nutrients.sodium}mg ${nutrients.sodium > 500 ? '⚠️' : '✅'}`
    };
}

function formatHealthIndex(healthIndex) {
    return {
        score: `${healthIndex.score}/10`,
        rating: healthIndex.label,
        description: healthIndex.description,
        breakdown: healthIndex.breakdown,
        medicalPriority: healthIndex.medicalPriority
    };
}

function getMedicalVerdict(score) {
    return score >= 8 ? "🟢 DOCTOR APPROVED" :
        score >= 6 ? "🟡 DOCTOR CAUTION" : "🔴 DOCTOR WARNING";
}

const nutritionController = new NutritionController();

// ==========================================
// MIDDLEWARE
// ==========================================

const errorHandler = (err, req, res, next) => {
    console.error('💥 Unhandled Error:', err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
};

// ==========================================
// SERVER SETUP
// ==========================================

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors()); // Configure CORS as needed for production

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(express.json());

// Routes
const router = express.Router();
router.get('/:item', (req, res) => nutritionController.getNutrition(req, res));
app.use('/nutrition', router);

// Error Handling
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`🏥 Medical Nutrition API running on http://localhost:${PORT}`);
    console.log(`🎯 Designed for diabetes prevention in Indian population`);
    console.log(`🔒 Security headers and rate limiting enabled`);
});
