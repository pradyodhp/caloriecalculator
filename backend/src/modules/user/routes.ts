import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncRoute, parse } from '../../http/validate.js';
import { ValidationError } from '../../shared/errors.js';
import { isValidTimeZone } from '../diary/localDate.js';
import { estimateTargets } from '../../core/nutrition/energy/index.js';
import type { ActivityLevel, Aggressiveness, GoalType } from '../../core/nutrition/energy/index.js';

const profileSchema = z.object({
  name: z.string().trim().max(100).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  biologicalSex: z.enum(['male', 'female']).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  country: z.string().trim().max(60).optional(),
  timezone: z.string().refine(isValidTimeZone, 'unknown IANA timezone').default('UTC'),
  dietaryPreferences: z.array(z.string().max(40)).max(20).default([]),
  dietaryRestrictions: z.array(z.string().max(40)).max(20).default([]),
  allergies: z.array(z.string().max(40)).max(30).default([]),
  cuisinePreferences: z.array(z.string().max(40)).max(20).default([]),
  weightUnit: z.enum(['kg', 'lb']).default('kg'),
  heightUnit: z.enum(['cm', 'ft-in']).default('cm'),
  energyUnit: z.enum(['kcal', 'kJ']).default('kcal'),
});

const goalSchema = z.object({
  type: z.enum(['lose_weight', 'maintain_weight', 'gain_weight', 'build_muscle', 'improve_protein', 'improve_fiber', 'balanced']),
  pace: z.enum(['gentle', 'standard', 'ambitious']).default('standard'),
  startWeightKg: z.number().min(20).max(400).optional(),
  targetWeightKg: z.number().min(20).max(400).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export function ageOn(dob: Date, now: Date): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

/** Current estimated targets for a user, or the list of what is missing. */
export async function computeTargets(db: PrismaClient, userId: string, now = new Date()) {
  const [profile, goal, weight] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.goal.findFirst({ where: { userId, active: true }, orderBy: { createdAt: 'desc' } }),
    db.weightEntry.findFirst({ where: { userId }, orderBy: { localDate: 'desc' } }),
  ]);
  const missing: string[] = [];
  if (!profile?.dateOfBirth) missing.push('dateOfBirth');
  if (!profile?.biologicalSex) missing.push('biologicalSex');
  if (!profile?.heightCm) missing.push('heightCm');
  if (!profile?.activityLevel) missing.push('activityLevel');
  if (!weight) missing.push('a weight entry');
  if (missing.length || !profile || !weight) return { ok: false as const, missing };
  const age = ageOn(profile.dateOfBirth!, now);
  const est = estimateTargets({
    sex: profile.biologicalSex as 'male' | 'female',
    weightKg: Number(weight.weightKg),
    heightCm: Number(profile.heightCm),
    ageYears: age,
    activity: profile.activityLevel as ActivityLevel,
    goal: (goal?.type ?? 'balanced') as GoalType,
    pace: (goal?.pace ?? 'standard') as Aggressiveness,
  });
  return {
    ok: true as const,
    ...est,
    inputs: { ageYears: age, weightKg: Number(weight.weightKg), goal: goal?.type ?? 'balanced', pace: goal?.pace ?? 'standard' },
    note: 'Estimates from standard formulas (see docs/energy-formulas.md). Individual needs vary.',
  };
}

export function userRouter(db: PrismaClient): Router {
  const r = Router();

  r.get('/profile', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const [p, pref] = await Promise.all([db.profile.findUnique({ where: { userId } }), db.userPreference.findUnique({ where: { userId } })]);
    res.json({ profile: p ? { ...p, heightCm: p.heightCm === null ? null : Number(p.heightCm) } : null, preferences: pref });
  }));

  r.put('/profile', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const b = parse(profileSchema, req.body);
    const data = {
      name: b.name ?? null,
      dateOfBirth: b.dateOfBirth ? new Date(b.dateOfBirth + 'T00:00:00Z') : null,
      biologicalSex: b.biologicalSex ?? null,
      heightCm: b.heightCm ?? null,
      activityLevel: b.activityLevel ?? null,
      country: b.country ?? null,
      timezone: b.timezone,
      dietaryPreferences: b.dietaryPreferences,
      dietaryRestrictions: b.dietaryRestrictions,
      allergies: b.allergies,
      cuisinePreferences: b.cuisinePreferences,
    };
    if (data.dateOfBirth && ageOn(data.dateOfBirth, new Date()) < 18) throw new ValidationError('dateOfBirth: targets are only estimated for adults (18+)');
    await db.profile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    await db.userPreference.upsert({
      where: { userId },
      create: { userId, weightUnit: b.weightUnit, heightUnit: b.heightUnit, energyUnit: b.energyUnit },
      update: { weightUnit: b.weightUnit, heightUnit: b.heightUnit, energyUnit: b.energyUnit },
    });
    res.status(204).end();
  }));

  r.get('/goal', asyncRoute(async (req, res) => {
    const g = await db.goal.findFirst({ where: { userId: req.userId!, active: true }, orderBy: { createdAt: 'desc' } });
    res.json({ goal: g && { id: g.id, type: g.type, pace: g.pace, startWeightKg: g.startValue && Number(g.startValue), targetWeightKg: g.targetValue && Number(g.targetValue), targetDate: g.targetDate?.toISOString().slice(0, 10) ?? null } });
  }));

  r.put('/goal', asyncRoute(async (req, res) => {
    const userId = req.userId!;
    const b = parse(goalSchema, req.body);
    await db.$transaction([
      db.goal.updateMany({ where: { userId, active: true }, data: { active: false } }),
      db.goal.create({
        data: {
          userId, type: b.type, pace: b.pace,
          startValue: b.startWeightKg, targetValue: b.targetWeightKg,
          targetDate: b.targetDate ? new Date(b.targetDate + 'T00:00:00Z') : null,
        },
      }),
    ]);
    res.status(204).end();
  }));

  r.get('/targets', asyncRoute(async (req, res) => {
    const t = await computeTargets(db, req.userId!);
    if (!t.ok) throw new ValidationError(`Cannot estimate targets yet. Missing: ${t.missing.join(', ')}`);
    res.json(t);
  }));

  return r;
}
