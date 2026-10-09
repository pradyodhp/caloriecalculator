import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncRoute, parse } from '../../http/validate.js';
import { NotFoundError } from '../../shared/errors.js';
import { FoodStore } from '../food/store.js';
import { recipeNutrition } from './recipe.js';
import type { NutrientValue } from '../food/types.js';

const createRecipe = z.object({
  name: z.string().trim().min(1).max(120),
  servings: z.number().positive().max(100),
  ingredients: z.array(z.object({ foodId: z.string().uuid(), grams: z.number().positive().max(100000) })).min(1).max(60),
});
const createCustom = z.object({
  name: z.string().trim().min(1).max(120),
  nutrients: z.array(z.object({
    key: z.enum(['energy', 'protein', 'fat', 'carbohydrate', 'fiber', 'sugars', 'saturatedFat', 'sodium', 'freeSugars']),
    value: z.number().min(0).max(100000),
    unit: z.enum(['kcal', 'g', 'mg', 'ug']),
  })).min(1).max(30),
  servings: z.array(z.object({ label: z.string().trim().min(1).max(80), gramWeight: z.number().positive().max(10000), isDefault: z.boolean().optional() })).max(10).default([]),
});

export function recipeRouter(db: PrismaClient, foods: FoodStore): Router {
  const r = Router();

  r.post('/foods/custom', asyncRoute(async (req, res) => {
    const b = parse(createCustom, req.body);
    const f = await foods.createCustom(req.userId!, { name: b.name, nutrients: b.nutrients as NutrientValue[], servings: b.servings });
    res.status(201).json({ foodId: f.id, food: f.record, servings: f.servings });
  }));
  r.get('/foods/custom', asyncRoute(async (req, res) => {
    const list = await foods.listCustom(req.userId!);
    res.json({ foods: list.map((f) => ({ foodId: f.id, food: f.record, servings: f.servings })) });
  }));
  r.delete('/foods/custom/:id', asyncRoute(async (req, res) => {
    await foods.deleteCustom(req.userId!, String(req.params.id));
    res.status(204).end();
  }));

  r.post('/recipes', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const b = parse(createRecipe, req.body);
    const ingredients = [];
    for (const i of b.ingredients) {
      const f = await foods.getVisible(i.foodId, userId);
      ingredients.push({ foodId: f.id, foodName: f.record.description, grams: i.grams, per100g: f.record.nutrients });
    }
    const n = recipeNutrition(ingredients, b.servings);
    // The derived food only carries nutrients known for every ingredient, so it never undercounts silently.
    const complete = n.per100g.filter((x) => !n.incompleteNutrients.includes(x.key));
    const servingGrams = Math.round((n.totalGrams / b.servings) * 100) / 100;
    const food = await foods.createCustom(userId, {
      name: b.name,
      source: 'Recipe computed from ingredient data (raw ingredient weights; cooking changes not modelled)',
      nutrients: complete,
      servings: [{ label: '1 serving', gramWeight: servingGrams, isDefault: true }],
    });
    const recipe = await db.recipe.create({
      data: { userId, name: b.name, servings: b.servings, ingredients: { create: ingredients.map((i) => ({ foodId: i.foodId, grams: i.grams })) } },
    });
    res.status(201).json({ recipeId: recipe.id, foodId: food.id, perServing: n.perServing.filter((x) => !n.incompleteNutrients.includes(x.key)), servingGrams, omittedIncompleteNutrients: n.incompleteNutrients });
  }));

  r.get('/recipes', asyncRoute(async (req, res) => {
    const rows = await db.recipe.findMany({ where: { userId: req.userId!, deletedAt: null }, include: { ingredients: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ recipes: rows.map((x) => ({ id: x.id, name: x.name, servings: Number(x.servings), ingredientCount: x.ingredients.length })) });
  }));
  r.delete('/recipes/:id', asyncRoute(async (req, res) => {
    const u = await db.recipe.updateMany({ where: { id: String(req.params.id), userId: req.userId!, deletedAt: null }, data: { deletedAt: new Date() } });
    if (u.count === 0) throw new NotFoundError('Recipe not found');
    res.status(204).end();
  }));

  return r;
}
