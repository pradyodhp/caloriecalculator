import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { extractNutrients, UsdaProvider } from '../src/modules/food/providers/usda.js';
import type { FoodProvider } from '../src/modules/food/types.js';

const config = loadConfig({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
const stub: FoodProvider = {
  sourceType: 'usda',
  search: async (q) =>
    q === 'none'
      ? null
      : { description: 'X', sourceType: 'usda', source: 'USDA FoodData Central', sourceId: '1', retrievedAt: 't', basis: 'per 100 g', nutrients: [] },
};

test('extractNutrients maps USDA numbers to unit-labelled values', () => {
  const out = extractNutrients({ foodNutrients: [{ nutrientNumber: '1008', value: 238 }, { nutrientNumber: '9999', value: 1 }] });
  assert.deepStrictEqual(out, [{ key: 'energy', value: 238, unit: 'kcal' }]);
});

test('health endpoint', async () => {
  const res = await request(createApp(config, { foodProvider: stub })).get('/health');
  assert.strictEqual(res.status, 200);
});

test('lookup returns provenance and no medical language', async () => {
  const res = await request(createApp(config, { foodProvider: stub })).get('/nutrition/x');
  assert.strictEqual(res.body.food.sourceType, 'usda');
  assert.strictEqual(res.body.food.basis, 'per 100 g');
  assert.ok(!/doctor|medical|diabet/i.test(JSON.stringify(res.body)));
});

test('unknown food gives structured 404', async () => {
  const res = await request(createApp(config, { foodProvider: stub })).get('/nutrition/none');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'not_found');
});

test('missing API key fails with 503, never a default key', async () => {
  const res = await request(createApp(config, { foodProvider: new UsdaProvider('') })).get('/nutrition/rice');
  assert.strictEqual(res.status, 503);
});

test('config rejects invalid values', () => {
  assert.throws(() => loadConfig({ PORT: 'abc' } as NodeJS.ProcessEnv));
});
