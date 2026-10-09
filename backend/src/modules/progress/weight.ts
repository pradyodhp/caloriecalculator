export interface WeightPoint { date: string; kg: number } // date = user-local YYYY-MM-DD

export interface WeightProgress {
  count: number;
  latestKg: number | null;
  changeKg: number | null; // latest minus first, null with fewer than 2 points
  trend: { date: string; kg: number }[]; // trailing 7-entry mean, damps day-to-day water noise
  goal?: { startKg: number; targetKg: number; percentComplete: number };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function weightProgress(points: WeightPoint[], goal?: { startKg: number; targetKg: number }): WeightProgress {
  for (const p of points) if (!Number.isFinite(p.kg) || p.kg <= 0) throw new RangeError('invalid weight');
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const trend = sorted.map((p, i) => {
    const win = sorted.slice(Math.max(0, i - 6), i + 1);
    return { date: p.date, kg: r2(win.reduce((s, x) => s + x.kg, 0) / win.length) };
  });
  const latest = sorted.at(-1)?.kg ?? null;
  const out: WeightProgress = {
    count: sorted.length,
    latestKg: latest,
    changeKg: sorted.length >= 2 ? r2(latest! - sorted[0]!.kg) : null,
    trend,
  };
  if (goal && latest !== null && goal.startKg !== goal.targetKg) {
    const pct = ((goal.startKg - latest) / (goal.startKg - goal.targetKg)) * 100;
    out.goal = { ...goal, percentComplete: r2(Math.min(100, Math.max(0, pct))) };
  }
  return out;
}
