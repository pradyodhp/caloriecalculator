import test from 'node:test';
import assert from 'node:assert';
import { pickServing, portionNutrients, availableServings, ServingAmbiguityError, type Serving } from '../src/modules/serving/serving.js';

const piece: Serving = { label: '1 piece', gramWeight: 40, sourceNote: 'test fixture', isEstimate: true, isDefault: true };
const cup: Serving = { label: '1 cup', gramWeight: 200, sourceNote: 'test fixture', isEstimate: true };
const per100 = [{ key: 'energy', value: 100, unit: 'kcal' as const }];

test('single default serving is used when none named', () => {
  assert.strictEqual(pickServing([piece, cup]).label, '1 piece');
});
test('no default and several servings is ambiguous, never guessed', () => {
  assert.throws(() => pickServing([{ ...piece, isDefault: false }, cup]), ServingAmbiguityError);
  assert.throws(() => pickServing([], undefined), ServingAmbiguityError);
});
test('named lookup is case-insensitive; unknown name lists the options', () => {
  assert.strictEqual(pickServing([piece], '1 PIECE').gramWeight, 40);
  try { pickServing([piece], 'katori'); assert.fail(); } catch (e) { assert.ok((e as ServingAmbiguityError).options.includes('100 g')); }
});
test('mass servings are always available and exact', () => {
  const s = pickServing([], '100 g');
  assert.strictEqual(s.isEstimate, false);
  assert.ok(availableServings([]).length >= 3);
});
test('portion scales nutrients and flags estimates', () => {
  const r = portionNutrients(per100, piece, 2);
  assert.strictEqual(r.grams, 80);
  assert.strictEqual(r.nutrients[0]!.value, 80);
  assert.strictEqual(r.approximate, true);
  assert.strictEqual(portionNutrients(per100, pickServing([], '100 g'), 1).approximate, false);
});
test('bad quantities rejected', () => {
  for (const q of [0, -1, NaN, Infinity, 5000]) assert.throws(() => portionNutrients(per100, piece, q));
});
