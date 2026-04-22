const medicalService = require('../services/medicalService');
const usdaService = require('../services/usdaService');

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

// Helper functions to format response (keep logic consistent with original)
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

module.exports = new NutritionController();
