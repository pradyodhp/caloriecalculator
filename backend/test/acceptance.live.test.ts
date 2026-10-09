// End-to-end acceptance flow against a real PostgreSQL. Skipped unless DATABASE_URL is set.
import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { FoodSearchService } from '../src/modules/food/searchService.js';
import { AuthService } from '../src/modules/auth/service.js';
import { PrismaAuthRepository } from '../src/modules/auth/prismaRepository.js';
import type { FoodProvider } from '../src/modules/food/types.js';

const live = !!process.env.DATABASE_URL;
const config = loadConfig({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);

// Test fixture provider: values are fake and labelled as such. Never shipped.
const fixture: FoodProvider = {
  sourceType: 'curated_indian', name: 'fixture',
  search: async (q) => /rice/i.test(q) ? [{
    description: 'Test rice (fixture)', sourceType: 'curated_indian', source: 'test fixture', sourceId: `FIX-${process.pid}`,
    retrievedAt: new Date().toISOString(), basis: 'per 100 g',
    nutrients: [{ key: 'energy', value: 130, unit: 'kcal' }, { key: 'protein', value: 2.5, unit: 'g' }],
  }] : [],
};

test('acceptance flow', { skip: !live }, async () => {
  const db = new PrismaClient();
  const app = createApp(config, { db, foodSearch: new FoodSearchService([fixture]), auth: new AuthService(new PrismaAuthRepository(db), config.jwtSecret) });
  const email = `acc-${Date.now()}@example.com`;
  const pw = 'correct-horse-battery';
  const reg = await request(app).post('/auth/register').send({ email, password: pw });
  const A = { authorization: `Bearer ${reg.body.accessToken}` };

  // profile, weight, goal, targets
  assert.strictEqual((await request(app).put('/v1/profile').set(A).send({ dateOfBirth: '1995-06-15', biologicalSex: 'male', heightCm: 175, activityLevel: 'light', timezone: 'Asia/Kolkata' })).status, 204);
  assert.strictEqual((await request(app).get('/v1/targets').set(A)).status, 400); // weight missing
  assert.strictEqual((await request(app).post('/v1/weight').set(A).send({ kg: 72 })).status, 201);
  assert.strictEqual((await request(app).put('/v1/goal').set(A).send({ type: 'lose_weight', pace: 'standard', startWeightKg: 72, targetWeightKg: 68 })).status, 204);
  const targets = await request(app).get('/v1/targets').set(A);
  assert.strictEqual(targets.status, 200);
  assert.match(targets.body.label, /Estimated/);
  assert.ok(targets.body.target.kcal > 1500 && targets.body.macros.proteinG > 0);

  // search -> foodId (provenance preserved)
  const s = await request(app).get('/foods/search?q=rice').set(A);
  assert.strictEqual(s.body.count, 1);
  const rice = s.body.results[0];
  assert.strictEqual(rice.sourceType, 'curated_indian');

  // custom food with "2 pieces" style servings
  const idli = await request(app).post('/v1/foods/custom').set(A).send({
    name: 'My idli (user-entered)', nutrients: [{ key: 'energy', value: 150, unit: 'kcal' }, { key: 'protein', value: 5, unit: 'g' }],
    servings: [{ label: '1 piece', gramWeight: 40, isDefault: true }],
  });
  assert.strictEqual(idli.status, 201);
  const date = '2026-03-10';
  const e1 = await request(app).post('/v1/diary/entries').set(A).send({ date, meal: 'breakfast', foodId: idli.body.foodId, quantity: 2 });
  assert.strictEqual(e1.status, 201);
  assert.strictEqual(e1.body.grams, 80);
  const e2 = await request(app).post('/v1/diary/entries').set(A).send({ date, meal: 'lunch', foodId: rice.foodId, servingLabel: '100 g', quantity: 1.5 });
  assert.strictEqual(e2.status, 201);
  // ambiguity: rice has no household servings and no default
  const amb = await request(app).post('/v1/diary/entries').set(A).send({ date, meal: 'lunch', foodId: rice.foodId, quantity: 1 });
  assert.strictEqual(amb.status, 400);
  await request(app).post('/v1/water').set(A).send({ date, amountMl: 500 });

  let d = await request(app).get(`/v1/diary?date=${date}`).set(A);
  const kcal = d.body.totals.nutrients.find((n: { key: string }) => n.key === 'energy').value;
  assert.strictEqual(kcal, 120 + 195); // 80 g idli @150 + 150 g rice @130
  assert.strictEqual(d.body.waterMl, 500);
  assert.strictEqual(d.body.totals.approximate, true); // user-entered serving is an estimate
  const remKcal = d.body.remaining.find((r: { key: string }) => r.key === 'energy');
  assert.strictEqual(remKcal.remaining, Math.round((targets.body.target.kcal - 315) * 100) / 100);

  // recipe from sourced ingredients, then log it
  const rec = await request(app).post('/v1/recipes').set(A).send({ name: 'Rice bowl', servings: 2, ingredients: [{ foodId: rice.foodId, grams: 300 }] });
  assert.strictEqual(rec.status, 201);
  assert.strictEqual(rec.body.servingGrams, 150);
  const e3 = await request(app).post('/v1/diary/entries').set(A).send({ date, meal: 'dinner', foodId: rec.body.foodId, quantity: 1 });
  assert.strictEqual(e3.status, 201);

  // edit and delete
  assert.strictEqual((await request(app).patch(`/v1/diary/entries/${e1.body.id}`).set(A).send({ quantity: 1 })).status, 204);
  d = await request(app).get(`/v1/diary?date=${date}`).set(A);
  assert.strictEqual(d.body.entries.find((e: { id: string }) => e.id === e1.body.id).grams, 40);
  assert.strictEqual((await request(app).delete(`/v1/diary/entries/${e2.body.id}`).set(A)).status, 204);
  d = await request(app).get(`/v1/diary?date=${date}`).set(A);
  assert.strictEqual(d.body.entries.length, 2);

  // progress, weekly analytics
  await request(app).post('/v1/weight').set(A).send({ date: '2026-03-12', kg: 71.5 });
  const wp = await request(app).get('/v1/progress/weight').set(A);
  assert.strictEqual(wp.body.count, 2);
  const wk = await request(app).get(`/v1/analytics/weekly?end=${date}`).set(A);
  assert.strictEqual(wk.status, 200);
  assert.strictEqual(wk.body.analytics.daysLogged, 1);
  assert.ok(wk.body.insights.length >= 1);

  // another user cannot see or touch any of it
  const regB = await request(app).post('/auth/register').send({ email: `b-${email}`, password: pw });
  const B = { authorization: `Bearer ${regB.body.accessToken}` };
  assert.strictEqual((await request(app).get(`/v1/diary?date=${date}`).set(B)).body.entries.length, 0);
  assert.strictEqual((await request(app).delete(`/v1/diary/entries/${e1.body.id}`).set(B)).status, 404);
  assert.strictEqual((await request(app).post('/v1/diary/entries').set(B).send({ date, meal: 'lunch', foodId: idli.body.foodId, quantity: 1 })).status, 404);
  assert.strictEqual((await request(app).get('/v1/diary')).status, 401);

  // logout, log back in, diary persists
  await request(app).post('/auth/logout').send({ refreshToken: reg.body.refreshToken });
  const login = await request(app).post('/auth/login').send({ email, password: pw });
  d = await request(app).get(`/v1/diary?date=${date}`).set({ authorization: `Bearer ${login.body.accessToken}` });
  assert.strictEqual(d.body.entries.length, 2);
  await db.$disconnect();
});
