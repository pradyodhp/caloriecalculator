import test from 'node:test';
import assert from 'node:assert';
import { convertMass, kcalToKj, kjToKcal, feetInchesToCm, cmToFeetInches } from '../src/core/units/convert.js';
import { scaleNutrients, sumNutrients } from '../src/core/units/nutrients.js';

const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test('mass conversions', () => {
  close(convertMass(1, 'kg', 'g'), 1000);
  close(convertMass(1, 'lb', 'kg'), 0.45359237);
  close(convertMass(500, 'mg', 'g'), 0.5);
});
test('energy conversions round-trip', () => {
  close(kcalToKj(100), 418.4);
  close(kjToKcal(kcalToKj(250)), 250);
});
test('height conversions', () => {
  close(feetInchesToCm(5, 10), 177.8);
  assert.deepStrictEqual(cmToFeetInches(177.8), { feet: 5, inches: 10 });
});
test('rejects NaN/Infinity', () => {
  assert.throws(() => convertMass(NaN, 'g', 'kg'));
  assert.throws(() => kcalToKj(Infinity));
  assert.throws(() => scaleNutrients([], -1));
});
test('scaling and summing keep units and never mix them', () => {
  const s = scaleNutrients([{ key: 'protein', value: 8, unit: 'g' }], 50);
  assert.deepStrictEqual(s, [{ key: 'protein', value: 4, unit: 'g' }]);
  const t = sumNutrients([s, s]);
  assert.strictEqual(t[0]!.value, 8);
  assert.throws(() => sumNutrients([[{ key: 'x', value: 1, unit: 'g' }], [{ key: 'x', value: 1, unit: 'mg' }]]));
});
