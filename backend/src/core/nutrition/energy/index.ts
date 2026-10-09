import { mifflinStJeor, type BmrInput } from './bmr.js';
import { estimateTdee, type ActivityLevel } from './tdee.js';
import { calorieTarget, type Aggressiveness, type GoalType } from './calorieTarget.js';
import { macroTargets } from './macroTargets.js';

export * from './bmr.js';
export * from './tdee.js';
export * from './calorieTarget.js';
export * from './macroTargets.js';

export function estimateTargets(p: BmrInput & { activity: ActivityLevel; goal: GoalType; pace: Aggressiveness }) {
  const bmr = mifflinStJeor(p);
  const tdee = estimateTdee(bmr, p.activity);
  const target = calorieTarget(tdee, p.goal, p.pace, p.sex);
  const macros = macroTargets(target.kcal, p.weightKg, p.goal);
  return { label: 'Estimated daily energy target', bmr, tdee, target, macros };
}
