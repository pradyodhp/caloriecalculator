import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { AuthService } from '../src/modules/auth/service.js';
import { InMemoryAuthRepository } from '../src/modules/auth/repository.js';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { extractNutrients, UsdaProvider } from '../src/modules/food/providers/usda.js';
import { FoodSearchService, rankScore } from '../src/modules/food/searchService.js';
import type { FoodProvider } from '../src/modules/food/types.js';

const config = loadConfig({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
const rec = (description: string, sourceType: 'usda' | 'curated_indian' = 'usda') => ({
  description, sourceType, source: 'test', sourceId: description, retrievedAt: 't', basis: 'per 100 g' as const, nutrients: [],
});
const mk = (name: string, items: string[], fail = false): FoodProvider => ({
  sourceType: 'usda',
  name,
  search: async () => { if (fail) throw new Error('down'); return items.map((i) => rec(i)); },
});
const appWith = (...ps: FoodProvider[]) => createApp(config, { foodSearch: new FoodSearchService(ps), auth: new AuthService(new InMemoryAuthRepository(), config.jwtSecret) });
const stub = mk('stub', ['X']);

test('extractNutrients maps USDA numbers to unit-labelled values', () => {
  const out = extractNutrients({ foodNutrients: [{ nutrientNumber: '1008', value: 238 }, { nutrientNumber: '9999', value: 1 }] });
  assert.deepStrictEqual(out, [{ key: 'energy', value: 238, unit: 'kcal' }]);
});

test('health endpoint', async () => {
  const res = await request(appWith(stub)).get('/health');
  assert.strictEqual(res.status, 200);
});

test('lookup returns provenance and no medical language', async () => {
  const res = await request(appWith(stub)).get('/nutrition/x');
  assert.strictEqual(res.body.food.sourceType, 'usda');
  assert.strictEqual(res.body.food.basis, 'per 100 g');
  assert.ok(!/doctor|medical|diabet/i.test(JSON.stringify(res.body)));
});

test('unknown food gives structured 404', async () => {
  const res = await request(appWith(mk('e', []))).get('/nutrition/zzz');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'not_found');
});

test('missing API key fails with 503, never a default key', async () => {
  const res = await request(appWith(new UsdaProvider(''))).get('/nutrition/rice');
  assert.strictEqual(res.status, 503);
});

test('config rejects invalid values', () => {
  assert.throws(() => loadConfig({ PORT: 'abc' } as NodeJS.ProcessEnv));
});

test('search ranks exact, prefix, then substring', async () => {
  const res = await request(appWith(mk('p', ['Rice pudding', 'Brown rice', 'rice']))).get('/foods/search?q=rice');
  assert.deepStrictEqual(res.body.results.map((r: { description: string }) => r.description), ['rice', 'Rice pudding', 'Brown rice']);
  assert.ok(rankScore('idli', 'idli') < rankScore('idli sambar', 'idli'));
});
test('one provider failing does not hide the other and is reported', async () => {
  const res = await request(appWith(mk('bad', [], true), mk('good', ['idli']))).get('/foods/search?q=idli');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.count, 1);
  assert.strictEqual(res.body.providerErrors[0].provider, 'bad');
});
test('all providers failing gives 503', async () => {
  const res = await request(appWith(mk('bad', [], true))).get('/foods/search?q=idli');
  assert.strictEqual(res.status, 503);
});
test('search validates input', async () => {
  const a = await request(appWith(stub)).get('/foods/search');
  const b = await request(appWith(stub)).get('/foods/search?q=x&limit=500');
  assert.strictEqual(a.status, 400);
  assert.strictEqual(b.status, 400);
});
