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

module.exports = {
    MEDICAL_FOODS_DATABASE,
    MEDICAL_HEALTH_SCALE
};
