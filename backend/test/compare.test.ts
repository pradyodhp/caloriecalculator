import test from 'node:test';
import assert from 'node:assert';
import { compareFoods } from '../src/modules/food/compare.js';

test('compare scales to the same grams, keeps missing as null, gives no verdict', () => {
  const a = [{ key: 'energy', value: 100, unit: 'kcal' as const }, { key: 'fiber', value: 2, unit: 'g' as const }];
  const b = [{ key: 'energy', value: 150, unit: 'kcal' as const }];
  const rows = compareFoods(a, b, 200);
  assert.deepStrictEqual(rows.find((r) => r.key === 'energy'), { key: 'energy', unit: 'kcal', a: 200, b: 300, diff: 100 });
  assert.deepStrictEqual(rows.find((r) => r.key === 'fiber'), { key: 'fiber', unit: 'g', a: 4, b: null, diff: null });
  assert.throws(() => compareFoods(a, [{ key: 'energy', value: 1, unit: 'g' as const }], 100));
});
