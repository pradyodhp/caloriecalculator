import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncRoute, localDateSchema, parse } from '../../http/validate.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { scaleNutrients, sumNutrients } from '../../core/units/nutrients.js';
import { FoodStore } from '../food/store.js';
import { availableServings, pickServing, ServingAmbiguityError } from '../serving/serving.js';
import { remainingAgainstTargets, type DayTotals, type MealType } from './totals.js';
import { toLocalDate } from './localDate.js';
import { computeTargets } from '../user/routes.js';
import type { NutrientValue } from '../food/types.js';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const addEntry = z.object({
  date: localDateSchema.optional(),
  meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodId: z.string().uuid(),
  servingLabel: z.string().max(80).optional(),
  quantity: z.number().positive().max(1000),
});
const patchEntry = z.object({
  meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  servingLabel: z.string().max(80).optional(),
  quantity: z.number().positive().max(1000).optional(),
});

export async function userToday(db: PrismaClient, userId: string): Promise<string> {
  const p = await db.profile.findUnique({ where: { userId }, select: { timezone: true } });
  return toLocalDate(new Date(), p?.timezone ?? 'UTC');
}
const day = (s: string) => new Date(s + 'T00:00:00Z');

/** Entries for a user's local day with nutrients computed from stored per-100g values. */
export async function loadDay(db: PrismaClient, userId: string, date: string) {
  const meals = await db.meal.findMany({
    where: { userId, localDate: day(date), deletedAt: null },
    include: { entries: { where: { deletedAt: null }, include: { food: { include: { nutrients: true } }, serving: true }, orderBy: { createdAt: 'asc' } } },
  });
  const entries = meals.flatMap((m) => m.entries.map((e) => {
    const per100g: NutrientValue[] = e.food.nutrients.map((n) => ({ key: n.nutrient, value: Number(n.amount), unit: n.unit as NutrientValue['unit'] }));
    const grams = Number(e.gramsTotal);
    return {
      id: e.id, meal: m.mealType as MealType, foodId: e.foodId, foodName: e.food.displayName,
      source: e.food.source, sourceType: e.food.sourceType,
      serving: e.serving?.label ?? '100 g', quantity: Number(e.quantity), grams,
      approximate: e.serving?.isEstimate ?? false,
      nutrients: scaleNutrients(per100g, grams),
    };
  }));
  const byMeal = Object.fromEntries(MEALS.map((m) => [m, sumNutrients(entries.filter((e) => e.meal === m).map((e) => e.nutrients))])) as DayTotals['byMeal'];
  const totals: DayTotals = { nutrients: sumNutrients(entries.map((e) => e.nutrients)), byMeal, approximate: entries.some((e) => e.approximate), entryCount: entries.length };
  return { entries, totals };
}

export function diaryRouter(db: PrismaClient, foods: FoodStore): Router {
  const r = Router();

  r.get('/diary', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const date = req.query.date ? parse(localDateSchema, req.query.date) : await userToday(db, userId);
    const { entries, totals } = await loadDay(db, userId, date);
    const water = await db.waterEntry.aggregate({ where: { userId, localDate: day(date) }, _sum: { amountMl: true } });
    const t = await computeTargets(db, userId);
    let remaining = null;
    if (t.ok) {
      remaining = remainingAgainstTargets(totals, {
        energy: { value: t.target.kcal, unit: 'kcal' },
        protein: { value: t.macros.proteinG, unit: 'g' },
        carbohydrate: { value: t.macros.carbG, unit: 'g' },
        fat: { value: t.macros.fatG, unit: 'g' },
        fiber: { value: t.macros.fiberG, unit: 'g' },
      });
    }
    res.json({ date, entries, totals, waterMl: water._sum.amountMl ?? 0, targets: t.ok ? { label: t.label, kcal: t.target.kcal, ...t.macros } : null, remaining, targetsMissing: t.ok ? [] : t.missing });
  }));

  r.post('/diary/entries', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const b = parse(addEntry, req.body);
    const food = await foods.getVisible(b.foodId, userId);
    const date = b.date ?? (await userToday(db, userId));
    let serving;
    try { serving = pickServing(food.servings, b.servingLabel); } catch (e) {
      if (e instanceof ServingAmbiguityError) throw new ValidationError(`${e.message}`);
      throw e;
    }
    const dbServing = await db.serving.findUnique({ where: { foodId_label: { foodId: food.id, label: serving.label } } });
    const grams = Math.round(serving.gramWeight * b.quantity * 100) / 100;
    const existing = await db.meal.findFirst({ where: { userId, localDate: day(date), mealType: b.meal, deletedAt: null } });
    const meal = existing ?? (await db.meal.create({ data: { userId, localDate: day(date), mealType: b.meal } }));
    const entry = await db.mealEntry.create({ data: { mealId: meal.id, foodId: food.id, servingId: dbServing?.id ?? null, quantity: b.quantity, gramsTotal: grams } });
    res.status(201).json({ id: entry.id, date, grams, servingOptions: availableServings(food.servings).map((s) => s.label) });
  }));

  async function ownedEntry(userId: string, id: string) {
    const e = await db.mealEntry.findFirst({ where: { id, deletedAt: null, meal: { userId, deletedAt: null } }, include: { meal: true } });
    if (!e) throw new NotFoundError('Entry not found');
    return e;
  }

  r.patch('/diary/entries/:id', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const b = parse(patchEntry, req.body);
    const e = await ownedEntry(userId, String(req.params.id));
    const food = await foods.getVisible(e.foodId, userId);
    let servingId = e.servingId;
    let gramWeight: number;
    const label = b.servingLabel ?? (e.servingId ? (await db.serving.findUnique({ where: { id: e.servingId } }))?.label : '100 g');
    const serving = pickServing(food.servings, label);
    gramWeight = serving.gramWeight;
    const dbServing = await db.serving.findUnique({ where: { foodId_label: { foodId: food.id, label: serving.label } } });
    servingId = dbServing?.id ?? null;
    const quantity = b.quantity ?? Number(e.quantity);
    let mealId = e.mealId;
    if (b.meal && b.meal !== e.meal.mealType) {
      const existing = await db.meal.findFirst({ where: { userId, localDate: e.meal.localDate, mealType: b.meal, deletedAt: null } });
      mealId = (existing ?? (await db.meal.create({ data: { userId, localDate: e.meal.localDate, mealType: b.meal } }))).id;
    }
    await db.mealEntry.update({ where: { id: e.id }, data: { quantity, servingId, mealId, gramsTotal: Math.round(gramWeight * quantity * 100) / 100 } });
    res.status(204).end();
  }));

  r.delete('/diary/entries/:id', asyncRoute(async (req, res) => {
    const e = await ownedEntry(req.userId!, String(req.params.id));
    await db.mealEntry.update({ where: { id: e.id }, data: { deletedAt: new Date() } });
    res.status(204).end();
  }));

  r.post('/water', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const b = parse(z.object({ date: localDateSchema.optional(), amountMl: z.number().int().min(1).max(5000) }), req.body);
    const date = b.date ?? (await userToday(db, userId));
    await db.waterEntry.create({ data: { userId, localDate: day(date), amountMl: b.amountMl } });
    res.status(201).json({ date });
  }));

  r.post('/weight', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const b = parse(z.object({ date: localDateSchema.optional(), kg: z.number().min(20).max(400) }), req.body);
    const date = b.date ?? (await userToday(db, userId));
    await db.weightEntry.upsert({
      where: { userId_localDate: { userId, localDate: day(date) } },
      create: { userId, localDate: day(date), weightKg: b.kg },
      update: { weightKg: b.kg },
    });
    res.status(201).json({ date });
  }));

  return r;
}
