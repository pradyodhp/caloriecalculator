# Energy and macro target formulas

All code lives in `backend/src/core/nutrition/energy/`. Outputs are estimates and are labelled "Estimated daily energy target". They are not medical advice.

- **BMR**: Mifflin-St Jeor (Mifflin et al., Am J Clin Nutr 1990). Male: 10*kg + 6.25*cm - 5*age + 5. Female: same with -161. Valid input: age 18-120, weight 20-400 kg, height 100-250 cm; anything else throws.
- **TDEE**: BMR x activity factor (sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very active 1.9). Conventional planning factors.
- **Calorie target**: TDEE plus a goal adjustment. Lose: -250/-500/-750. Gain: +250/+400/+600. Build muscle: +150/+250/+400. Others: 0. A floor (1200 kcal female, 1500 male) stops implausibly low targets; the result reports when the floor was applied. The floor values are conservative defaults chosen for this app, not a clinical standard.
- **Macros**: protein g/kg by goal (1.2 to 1.8); fat 28% of calories at 9 kcal/g; carbs fill the rest at 4 kcal/g; fiber 14 g per 1000 kcal. These are general planning defaults chosen for this app.
- **Units**: conversions in `core/units`. 1 kcal = 4.184 kJ; 1 lb = 453.59237 g; 1 in = 2.54 cm.
