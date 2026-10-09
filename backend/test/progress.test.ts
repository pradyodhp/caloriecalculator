import test from 'node:test';
import assert from 'node:assert';
import { weightProgress } from '../src/modules/progress/weight.js';
import { weeklyAnalytics, type DaySummary } from '../src/modules/progress/weekly.js';
import { weeklyInsights } from '../src/modules/insights/rules.js';

test('weight progress: change, trend, goal percent', () => {
  const p = weightProgress([{ date: '2026-03-03', kg: 79 }, { date: '2026-03-01', kg: 80 }, { date: '2026-03-02', kg: 79.5 }], { startKg: 80, targetKg: 75 });
  assert.strictEqual(p.changeKg, -1);
  assert.strictEqual(p.latestKg, 79);
  assert.deepStrictEqual(p.trend.map((t) => t.date), ['2026-03-01', '2026-03-02', '2026-03-03']);
  assert.strictEqual(p.trend[2]!.kg, 79.5);
  assert.strictEqual(p.goal!.percentComplete, 20);
});
test('weight progress handles empty/single and bad input', () => {
  assert.deepStrictEqual(weightProgress([]).latestKg, null);
  assert.strictEqual(weightProgress([{ date: '2026-03-01', kg: 70 }]).changeKg, null);
  assert.throws(() => weightProgress([{ date: 'x', kg: NaN }]));
  assert.strictEqual(weightProgress([{ date: 'a', kg: 90 }], { startKg: 80, targetKg: 75 }).goal!.percentComplete, 0);
});

const day = (date: string, logged: boolean, kcal: number, p: number, f: number): DaySummary => ({ date, logged, kcal, proteinG: p, fiberG: f });
const week = [day('1', true, 2000, 100, 20), day('2', true, 2200, 120, 25), day('3', false, 0, 0, 0), day('4', true, 1900, 90, 18)];
test('weekly analytics average logged days only', () => {
  const w = weeklyAnalytics(week, { kcal: 2000, proteinG: 100 });
  assert.strictEqual(w.daysLogged, 3);
  assert.strictEqual(w.avgKcal, 2033.3);
  assert.strictEqual(w.proteinTargetHitDays, 2);
  assert.strictEqual(w.calorieWithinRangeDays, 3);
  const none = weeklyAnalytics([day('1', false, 0, 0, 0)], { kcal: 2000, proteinG: 100 });
  assert.strictEqual(none.avgKcal, null);
});
test('insights: too little data says so and nothing else', () => {
  const w = weeklyAnalytics([day('1', true, 100, 1, 1)], { kcal: 2000, proteinG: 100 });
  const i = weeklyInsights(w, { kcal: 2000, proteinG: 100, fiberG: 28 });
  assert.deepStrictEqual(i.map((x) => x.ruleId), ['low_logging']);
});
test('insights cite evidence and avoid medical language', () => {
  const days = [day('1', true, 1500, 60, 10), day('2', true, 1600, 70, 12), day('3', true, 1550, 65, 11)];
  const w = weeklyAnalytics(days, { kcal: 2000, proteinG: 100 });
  const ins = weeklyInsights(w, { kcal: 2000, proteinG: 100, fiberG: 28 });
  const ids = ins.map((x) => x.ruleId);
  assert.ok(ids.includes('protein_below_target') && ids.includes('fiber_below_target') && ids.includes('energy_below_target'));
  for (const i of ins) {
    assert.ok(Object.keys(i.evidence).length > 0);
    assert.ok(!/doctor|medical|diabet|dangerous|safe|disease|risk/i.test(i.message));
  }
});
test('on track when close to targets', () => {
  const w = weeklyAnalytics([day('1', true, 2000, 100, 28), day('2', true, 2050, 105, 30), day('3', true, 1950, 98, 27)], { kcal: 2000, proteinG: 100 });
  assert.deepStrictEqual(weeklyInsights(w, { kcal: 2000, proteinG: 100, fiberG: 28 }).map((x) => x.ruleId), ['on_track']);
});
