import { z } from 'zod';
import { ValidationError } from '../shared/errors.js';

export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new ValidationError(`${i?.path.join('.') || 'input'}: ${i?.message ?? 'invalid'}`);
  }
  return r.data;
}

export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD').refine(
  (s) => !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s,
  'not a real calendar date',
);

export const asyncRoute = (fn: (req: import('express').Request, res: import('express').Response) => Promise<unknown>): import('express').RequestHandler =>
  (req, res, next) => { fn(req, res).catch(next); };
