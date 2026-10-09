import test from 'node:test';
import assert from 'node:assert';
import { mifflinStJeor, estimateTdee, calorieTarget, macroTargets, estimateTargets } from '../src/core/nutrition/energy/index.js';

test('Mifflin-St Jeor known values', () => {
  // 10*70 + 6.25*175 - 5*30 + 5 = 1648.75
  assert.strictEqual(mifflinStJeor({ sex: 'male', weightKg: 70, heightCm: 175, ageYears: 30 }), 1649);
  // 10*60 + 6.25*165 - 5*25 - 161 = 1345.25
  assert.strictEqual(mifflinStJeor({ sex: 'female', weightKg: 60, heightCm: 165, ageYears: 25 }), 1345);
});
test('invalid input is rejected, never NaN', () => {
  assert.throws(() => mifflinStJeor({ sex: 'male', weightKg: NaN, heightCm: 175, ageYears: 30 }));
  assert.throws(() => mifflinStJeor({ sex: 'male', weightKg: 70, heightCm: 175, ageYears: 5 }));
});
test('TDEE uses documented factors', () => {
  assert.strictEqual(estimateTdee(1649, 'sedentary'), 1979);
  assert.strictEqual(estimateTdee(1649, 'moderate'), 2556);
});
test('calorie target adjusts by goal and applies floor', () => {
  assert.deepStrictEqual(calorieTarget(2500, 'lose_weight', 'standard', 'male'), { kcal: 2000, adjustment: -500, floorApplied: false });
  assert.deepStrictEqual(calorieTarget(1500, 'lose_weight', 'ambitious', 'female'), { kcal: 1200, adjustment: -750, floorApplied: true });
  assert.strictEqual(calorieTarget(2200, 'balanced', 'standard', 'male').kcal, 2200);
});
test('macros are consistent with calories and non-negative', () => {
  const m = macroTargets(2000, 70, 'build_muscle');
  assert.strictEqual(m.proteinG, 126);
  assert.ok(Math.abs(m.kcalCheck - 2000) <= 10);
  assert.ok(m.carbG >= 0 && m.fiberG === 28);
});
test('end to end estimate is labelled as an estimate', () => {
  const r = estimateTargets({ sex: 'female', weightKg: 60, heightCm: 165, ageYears: 25, activity: 'light', goal: 'maintain_weight', pace: 'standard' });
  assert.match(r.label, /Estimated/);
  assert.ok(Number.isFinite(r.target.kcal));
});
