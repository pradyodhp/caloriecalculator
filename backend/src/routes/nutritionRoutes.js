const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');

router.get('/:item', (req, res) => nutritionController.getNutrition(req, res));

module.exports = router;
