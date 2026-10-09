import type { WeeklyAnalytics } from '../progress/weekly.js';

export interface Insight {
  ruleId: string;
  message: string;
  /** The numbers the message is based on, so every insight is explainable. */
  evidence: Record<string, number | string | null>;
}

/**
 * Deterministic, rule-based insights about the user's own logged data versus the user's own targets.
 * No medical claims, no food is called safe or dangerous. Estimates are described as estimates.
 */
export function weeklyInsights(w: WeeklyAnalytics, targets: { kcal: number; proteinG: number; fiberG: number }): Insight[] {
  const out: Insight[] = [];
  if (w.daysLogged < 3) {
    out.push({
      ruleId: 'low_logging',
      message: `You logged ${w.daysLogged} of the last ${w.days} days. Insights get more reliable with at least 3 logged days.`,
      evidence: { daysLogged: w.daysLogged, days: w.days },
    });
    return out;
  }
  if (w.avgProteinG !== null && w.avgProteinG < targets.proteinG * 0.85) {
    out.push({
      ruleId: 'protein_below_target',
      message: `Your average protein on logged days was ${w.avgProteinG} g, below your ${targets.proteinG} g target.`,
      evidence: { avgProteinG: w.avgProteinG, targetProteinG: targets.proteinG, daysHit: w.proteinTargetHitDays },
    });
  }
  if (w.avgFiberG !== null && w.avgFiberG < targets.fiberG * 0.7) {
    out.push({
      ruleId: 'fiber_below_target',
      message: `Your average fiber on logged days was ${w.avgFiberG} g, below your ${targets.fiberG} g target.`,
      evidence: { avgFiberG: w.avgFiberG, targetFiberG: targets.fiberG },
    });
  }
  if (w.avgKcal !== null && w.avgKcal > targets.kcal * 1.1) {
    out.push({
      ruleId: 'energy_above_target',
      message: `Your average intake on logged days was ${w.avgKcal} kcal, above your estimated target of ${targets.kcal} kcal.`,
      evidence: { avgKcal: w.avgKcal, targetKcal: targets.kcal },
    });
  } else if (w.avgKcal !== null && w.avgKcal < targets.kcal * 0.8) {
    out.push({
      ruleId: 'energy_below_target',
      message: `Your average intake on logged days was ${w.avgKcal} kcal, well below your estimated target of ${targets.kcal} kcal. Unlogged meals can cause this.`,
      evidence: { avgKcal: w.avgKcal, targetKcal: targets.kcal },
    });
  }
  if (out.length === 0) {
    out.push({
      ruleId: 'on_track',
      message: 'Your logged averages are close to your targets this week.',
      evidence: { avgKcal: w.avgKcal, avgProteinG: w.avgProteinG, daysLogged: w.daysLogged },
    });
  }
  return out;
}
