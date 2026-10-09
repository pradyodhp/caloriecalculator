# NutriTrack

Personal Nutrition Intelligence & Food Tracking Platform (work in progress).

NutriTrack is being rebuilt from an early calorie-calculator prototype into a food-tracking platform with transparent nutrition data, Indian food support, personalized targets, meal tracking and explainable insights. See `docs/roadmap.md` for the milestone plan and `IMPLEMENTATION_STATUS.md` for what works today.

## AI credit

This rebuild is being engineered with AI assistance (Instinct, an AI agent), working under the owner's direction and specification. Commits carry a `Co-authored-by` trailer. The nutrition engine is deterministic; no LLM generates or alters nutrition values.

## Data honesty

Every food value shows its source, basis (e.g. per 100 g) and unit. NutriTrack gives general nutrition information, not medical advice.

## Run

```
cd backend && cp .env.example .env   # add a free USDA key
npm install && npm test && npm start
cd ../frontend && npm install && npm start
```

Get a free USDA FoodData Central key at https://fdc.nal.usda.gov/api-key-signup.html.
