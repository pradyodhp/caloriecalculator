import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { asyncRoute, localDateSchema, parse } from '../../http/validate.js';
import { weightProgress } from './weight.js';
import { weeklyAnalytics, type DaySummary } from './weekly.js';
import { weeklyInsights } from '../insights/rules.js';
import { lastNDates } from '../diary/localDate.js';
import { loadDay, userToday } from '../diary/routes.js';
import { computeTargets } from '../user/routes.js';

export function progressRouter(db: PrismaClient): Router {
  const r = Router();

  r.get('/progress/weight', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const rows = await db.weightEntry.findMany({ where: { userId }, orderBy: { localDate: 'asc' }, take: 1000 });
    const goal = await db.goal.findFirst({ where: { userId, active: true }, orderBy: { createdAt: 'desc' } });
    const points = rows.map((w) => ({ date: w.localDate.toISOString().slice(0, 10), kg: Number(w.weightKg) }));
    const g = goal?.startValue && goal.targetValue ? { startKg: Number(goal.startValue), targetKg: Number(goal.targetValue) } : undefined;
    res.json(weightProgress(points, g));
  }));

  async function weekly(userId: string, end: string) {
    const dates = lastNDates(end, 7);
    const summaries: DaySummary[] = [];
    for (const date of dates) {
      const { totals } = await loadDay(db, userId, date);
      const v = (k: string) => totals.nutrients.find((n) => n.key === k)?.value ?? 0;
      summaries.push({ date, logged: totals.entryCount > 0, kcal: v('energy'), proteinG: v('protein'), fiberG: v('fiber') });
    }
    return summaries;
  }

  r.get('/analytics/weekly', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const end = req.query.end ? parse(localDateSchema, req.query.end) : await userToday(db, userId);
    const days = await weekly(userId, end);
    const t = await computeTargets(db, userId);
    if (!t.ok) {
      res.json({ end, days, analytics: null, insights: [], targetsMissing: t.missing });
      return;
    }
    const analytics = weeklyAnalytics(days, { kcal: t.target.kcal, proteinG: t.macros.proteinG });
    const insights = weeklyInsights(analytics, { kcal: t.target.kcal, proteinG: t.macros.proteinG, fiberG: t.macros.fiberG });
    res.json({ end, days, analytics, insights, targetsMissing: [] });
  }));

  return r;
}
