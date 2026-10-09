export interface DaySummary {
  date: string;
  logged: boolean; // false when the user logged nothing that day
  kcal: number;
  proteinG: number;
  fiberG: number;
}

export interface WeeklyAnalytics {
  days: number;
  daysLogged: number;
  /** Averages are over logged days only, so an unlogged day is not counted as zero intake. */
  avgKcal: number | null;
  avgProteinG: number | null;
  avgFiberG: number | null;
  proteinTargetHitDays: number;
  calorieWithinRangeDays: number;
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export function weeklyAnalytics(days: DaySummary[], targets: { kcal: number; proteinG: number }, kcalTolerancePct = 10): WeeklyAnalytics {
  if (!(targets.kcal > 0) || !(targets.proteinG > 0)) throw new RangeError('targets must be positive');
  const logged = days.filter((d) => d.logged);
  const tol = targets.kcal * (kcalTolerancePct / 100);
  return {
    days: days.length,
    daysLogged: logged.length,
    avgKcal: avg(logged.map((d) => d.kcal)),
    avgProteinG: avg(logged.map((d) => d.proteinG)),
    avgFiberG: avg(logged.map((d) => d.fiberG)),
    proteinTargetHitDays: logged.filter((d) => d.proteinG >= targets.proteinG).length,
    calorieWithinRangeDays: logged.filter((d) => Math.abs(d.kcal - targets.kcal) <= tol).length,
  };
}
