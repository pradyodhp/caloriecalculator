import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncRoute, parse } from '../../http/validate.js';
import { FoodStore } from './store.js';
import { compareFoods } from './compare.js';

const compareQuery = z.object({ a: z.string().uuid(), b: z.string().uuid(), grams: z.coerce.number().positive().max(10000).default(100) });
const idParam = z.string().uuid();

export function foodExtrasRouter(db: PrismaClient, foods: FoodStore): Router {
  const r = Router();

  r.get('/foods/compare', asyncRoute(async (req, res) => {
    const q = parse(compareQuery, req.query);
    const [a, b] = await Promise.all([foods.getVisible(q.a, req.userId!), foods.getVisible(q.b, req.userId!)]);
    res.json({
      grams: q.grams,
      a: { foodId: a.id, name: a.record.description, source: a.record.source },
      b: { foodId: b.id, name: b.record.description, source: b.record.source },
      rows: compareFoods(a.record.nutrients, b.record.nutrients, q.grams),
      note: 'Numbers for the same weight. Neither food is rated; what fits depends on your goals.',
    });
  }));

  r.get('/favorites', asyncRoute(async (req, res) => {
    const rows = await db.favoriteFood.findMany({ where: { userId: req.userId! }, include: { food: true }, orderBy: { createdAt: 'desc' }, take: 200 });
    res.json({ favorites: rows.filter((x) => !x.food.deletedAt).map((x) => ({ foodId: x.foodId, name: x.food.displayName, source: x.food.source })) });
  }));
  r.put('/favorites/:foodId', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const foodId = parse(idParam, req.params.foodId);
    await foods.getVisible(foodId, userId);
    await db.favoriteFood.upsert({ where: { userId_foodId: { userId, foodId } }, create: { userId, foodId }, update: {} });
    res.status(204).end();
  }));
  r.delete('/favorites/:foodId', asyncRoute(async (req, res) => {
    await db.favoriteFood.deleteMany({ where: { userId: req.userId!, foodId: parse(idParam, req.params.foodId) } });
    res.status(204).end();
  }));

  r.get('/recents', asyncRoute(async (req, res) => {
    const rows = await db.mealEntry.findMany({
      where: { deletedAt: null, meal: { userId: req.userId!, deletedAt: null } },
      orderBy: { createdAt: 'desc' }, take: 100, include: { food: true },
    });
    const seen = new Set<string>();
    const recents = [];
    for (const e of rows) {
      if (seen.has(e.foodId) || e.food.deletedAt) continue;
      seen.add(e.foodId);
      recents.push({ foodId: e.foodId, name: e.food.displayName, source: e.food.source });
      if (recents.length === 20) break;
    }
    res.json({ recents });
  }));

  return r;
}
