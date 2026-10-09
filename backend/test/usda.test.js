const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const usda = require('../src/services/usdaService');
const app = require('../src/app');

test('extractNutrients maps USDA numbers to unit-labelled values', () => {
  const out = usda.extractNutrients({
    foodNutrients: [
      { nutrientNumber: '1008', value: 238 },
      { nutrientNumber: '1003', value: 6.8 },
      { nutrientNumber: '9999', value: 1 },
    ],
  });
  assert.deepStrictEqual(out, [
    { key: 'energy', value: 238, unit: 'kcal' },
    { key: 'protein', value: 6.8, unit: 'g' },
  ]);
});

test('health endpoint responds', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
});

test('lookup returns provenance, never medical claims', async () => {
  usda.searchFood = async () => ({
    found: true,
    data: { description: 'X', sourceId: '1', dataType: 'Foundation', retrievedAt: 't', nutrients: [] },
  });
  const res = await request(app).get('/nutrition/x');
  assert.strictEqual(res.body.food.sourceType, 'usda');
  assert.strictEqual(res.body.food.basis, 'per 100 g');
  assert.ok(!JSON.stringify(res.body).match(/doctor|medical|diabet/i));
});

test('without API key the service fails clearly, not with a default key', async () => {
  delete require.cache[require.resolve('../src/services/usdaService')];
  const fresh = require('../src/services/usdaService');
  await assert.rejects(() => fresh.searchFood('rice'), /not configured/);
});
