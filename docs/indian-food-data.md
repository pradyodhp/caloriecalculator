# Indian food data

**Source**: Indian Food Composition Tables 2017 (ICMR-National Institute of Nutrition), 542 key foods, values per 100 g edible portion, measured across six regions. Machine-readable copy: https://github.com/ifct2017/ifct2017 (AGPL-3.0-or-later).

**Not vendored.** The dataset is not committed here. The ifct2017 repository is AGPL-licensed, so copying it into this repo needs a deliberate licensing decision by the owner. Instead:

```
git clone https://github.com/ifct2017/ifct2017 /somewhere/ifct2017
cd backend && npm run data:import-ifct -- /somewhere/ifct2017
```

This writes `backend/data/ifct2017.generated.json` (git-ignored). The API loads it at start. Without it, curated Indian search returns nothing and the USDA provider still works.

**Mapping** (`src/modules/food/providers/ifctImport.ts`): energy kJ -> kcal (1 kcal = 4.184 kJ), protein, fat, carbohydrate (available, by difference), fiber, saturated fat, free sugars, sodium (stored in g in the source, converted to mg). Empty source cells stay missing, never zero. "Free sugars" is kept under its own name and is not merged with USDA "sugars".

**Limit to know**: IFCT covers mostly raw ingredients (rice, dals, vegetables, spices, meat, eggs). It does not contain prepared dishes such as idli or dosa. Dish-level data needs a different sourced dataset; none has been added, and no dish values are invented. Recipes (M13) will compute dishes from sourced ingredients.
