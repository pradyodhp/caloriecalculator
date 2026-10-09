import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { AuthenticationError, ValidationError } from '../../shared/errors.js';
import type { AuthService } from './service.js';

declare module 'express-serve-static-core' {
  interface Request { userId?: string }
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10, 'Password must be at least 10 characters').max(200),
});
const refreshBody = z.object({ refreshToken: z.string().min(10).max(200) });

export function requireAuth(auth: AuthService): RequestHandler {
  return async (req, _res, next) => {
    try {
      const h = req.header('authorization') ?? '';
      if (!h.startsWith('Bearer ')) throw new AuthenticationError();
      // userId always comes from the verified token, never from the request body or URL.
      req.userId = await auth.verifyAccess(h.slice(7));
      next();
    } catch (e) {
      next(e);
    }
  };
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new ValidationError(r.error.issues[0]?.message ?? 'Invalid input');
  return r.data;
}

export function authRouter(auth: AuthService): Router {
  const r = Router();
  r.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));

  r.post('/register', async (req, res, next) => {
    try {
      const { email, password } = parse(credentials, req.body);
      const out = await auth.register(email, password);
      res.status(201).json(out);
    } catch (e) { next(e); }
  });
  r.post('/login', async (req, res, next) => {
    try {
      const { email, password } = parse(credentials, req.body);
      res.json(await auth.login(email, password));
    } catch (e) { next(e); }
  });
  r.post('/refresh', async (req, res, next) => {
    try { res.json(await auth.refresh(parse(refreshBody, req.body).refreshToken)); } catch (e) { next(e); }
  });
  r.post('/logout', async (req, res, next) => {
    try { await auth.logout(parse(refreshBody, req.body).refreshToken); res.status(204).end(); } catch (e) { next(e); }
  });
  r.get('/me', requireAuth(auth), (req, res) => res.json({ userId: req.userId }));
  r.delete('/account', requireAuth(auth), async (req, res, next) => {
    try { await auth.deleteAccount(req.userId!); res.status(204).end(); } catch (e) { next(e); }
  });
  return r;
}
