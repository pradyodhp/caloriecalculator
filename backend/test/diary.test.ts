import test from 'node:test';
import assert from 'node:assert';
import { toLocalDate, lastNDates, isValidTimeZone } from '../src/modules/diary/localDate.js';
import { dayTotals, remainingAgainstTargets, type DiaryEntry } from '../src/modules/diary/totals.js';
import { recipeNutrition } from '../src/modules/recipe/recipe.js';

test('local date respects timezone at midnight edges', () => {
  const t = new Date('2026-03-10T19:00:00Z'); // 00:30 next day in India (UTC+5:30)
  assert.strictEqual(toLocalDate(t, 'Asia/Kolkata'), '2026-03-11');
  assert.strictEqual(toLocalDate(t, 'UTC'), '2026-03-10');
  assert.strictEqual(toLocalDate(t, 'America/Los_Angeles'), '2026-03-10');
  assert.strictEqual(toLocalDate(new Date('2026-03-11T06:29:59Z'), 'Asia/Kolkata'), '2026-03-11');
  assert.strictEqual(toLocalDate(new Date('2026-03-11T18:29:59Z'), 'Asia/Kolkata'), '2026-03-11');
  assert.strictEqual(toLocalDate(new Date('2026-03-11T18:30:00Z'), 'Asia/Kolkata'), '2026-03-12');
});
test('DST day is handled by calendar date', () => {
  // US DST starts 2026-03-08; 03:30 UTC on Mar 9 is still Mar 8 evening in New York (EDT, UTC-4 is 23:30 Mar 8)
  assert.strictEqual(toLocalDate(new Date('2026-03-09T03:30:00Z'), 'America/New_York'), '2026-03-08');
});
test('timezone validation and date ranges', () => {
  assert.ok(isValidTimeZone('Asia/Kolkata'));
  assert.ok(!isValidTimeZone('Mars/Olympus'));
  assert.deepStrictEqual(lastNDates('2026-03-02', 3), ['2026-02-28', '2026-03-01', '2026-03-02']);
  assert.strictEqual(lastNDates('2026-01-01', 7)[0], '2025-12-26');
});

const serving = { label: '100 g', gramWeight: 100, sourceNote: 'mass unit', isEstimate: false };
const est = { label: '1 piece', gramWeight: 50, sourceNote: 'user-entered', isEstimate: true };
const entry = (id: string, meal: 'breakfast' | 'lunch', kcal: number, s = serving, q = 1): DiaryEntry =>
  ({ id, meal, foodName: id, per100g: [{ key: 'energy', value: kcal, unit: 'kcal' }, { key: 'protein', value: 10, unit: 'g' }], serving: s, quantity: q });

test('day totals sum per meal, flag estimates', () => {
  const t = dayTotals([entry('a', 'breakfast', 100), entry('b', 'lunch', 200, est, 2)]);
  assert.strictEqual(t.nutrients.find((n) => n.key === 'energy')!.value, 300);
  assert.strictEqual(t.byMeal.breakfast.find((n) => n.key === 'energy')!.value, 100);
  assert.strictEqual(t.byMeal.snack.length, 0);
  assert.strictEqual(t.approximate, true);
  assert.strictEqual(dayTotals([entry('a', 'breakfast', 100)]).approximate, false);
});
test('empty day is valid', () => {
  const t = dayTotals([]);
  assert.strictEqual(t.entryCount, 0);
  assert.strictEqual(t.nutrients.length, 0);
});
test('remaining can go negative and is never clamped or NaN', () => {
  const t = dayTotals([entry('a', 'breakfast', 300)]);
  const r = remainingAgainstTargets(t, { energy: { value: 250, unit: 'kcal' }, fiber: { value: 28, unit: 'g' } });
  assert.strictEqual(r[0]!.remaining, -50);
  assert.strictEqual(r[1]!.consumed, 0);
  assert.strictEqual(r[1]!.remaining, 28);
});

const I = (name: string, grams: number, kcal: number, extra: { key: string; value: number; unit: 'g' }[] = []) =>
  ({ foodName: name, grams, per100g: [{ key: 'energy', value: kcal, unit: 'kcal' as const }, ...extra] });
test('recipe totals, per serving and per 100 g', () => {
  const r = recipeNutrition([I('a', 200, 100), I('b', 100, 50)], 2);
  assert.strictEqual(r.total[0]!.value, 250);
  assert.strictEqual(r.perServing[0]!.value, 125);
  assert.strictEqual(r.totalGrams, 300);
  assert.strictEqual(r.per100g[0]!.value, 83.33);
});
test('recipe flags nutrients missing from some ingredients', () => {
  const r = recipeNutrition([I('a', 100, 100, [{ key: 'fiber', value: 2, unit: 'g' }]), I('b', 100, 50)], 1);
  assert.deepStrictEqual(r.incompleteNutrients, ['fiber']);
});
test('recipe rejects bad input', () => {
  assert.throws(() => recipeNutrition([], 1));
  assert.throws(() => recipeNutrition([I('a', 0, 1)], 1));
  assert.throws(() => recipeNutrition([I('a', 10, 1)], 0));
});
