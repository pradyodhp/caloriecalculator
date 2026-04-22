const { MEDICAL_FOODS_DATABASE, MEDICAL_HEALTH_SCALE } = require('../data/constants');

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

module.exports = new MedicalService();
