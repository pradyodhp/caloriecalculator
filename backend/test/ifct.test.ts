import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { importIfctCompositions } from '../src/modules/food/providers/ifctImport.js';
import { CuratedIndianProvider } from '../src/modules/food/providers/curatedIndian.js';

const recs = importIfctCompositions(readFileSync('test/fixtures/ifct-sample.csv', 'utf8'), 't');

test('import converts units and keeps provenance', () => {
  const a = recs[0]!;
  assert.strictEqual(a.sourceType, 'curated_indian');
  assert.strictEqual(a.sourceId, 'T001');
  assert.strictEqual(a.basis, 'per 100 g');
  assert.deepStrictEqual(a.nutrients.find((n) => n.key === 'energy'), { key: 'energy', value: 100, unit: 'kcal' });
  assert.deepStrictEqual(a.nutrients.find((n) => n.key === 'sodium'), { key: 'sodium', value: 2.7, unit: 'mg' });
});
test('missing values stay missing, not zero', () => {
  assert.ok(!recs[0]!.nutrients.some((n) => n.key === 'freeSugars'));
  assert.strictEqual(recs[1]!.nutrients.length, 0);
});
test('provider searches by words and is empty without data', async () => {
  const p = new CuratedIndianProvider(recs);
  assert.strictEqual((await p.search('food a', 5)).length, 1);
  assert.strictEqual((await CuratedIndianProvider.fromFile('/nonexistent').search('rice', 5)).length, 0);
});
