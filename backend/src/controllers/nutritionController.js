const usdaService = require('../services/usdaService');

class NutritionController {
  // Legacy lookup, kept until the unified food search (M9) replaces it.
  async getNutrition(req, res, next) {
    try {
      const item = req.params.item.toLowerCase().trim();
      if (!item) return res.status(400).json({ error: 'Food name is required' });

      const result = await usdaService.searchFood(item);
      if (!result.found) {
        return res.status(404).json({ error: 'Food not found in USDA FoodData Central' });
      }
      const d = result.data;
      return res.json({
        food: {
          description: d.description,
          source: 'USDA FoodData Central',
          sourceType: 'usda',
          sourceId: d.sourceId,
          dataType: d.dataType,
          retrievedAt: d.retrievedAt,
          basis: 'per 100 g',
          nutrients: d.nutrients,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new NutritionController();
