import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Config } from './config/env.js';
import { errorHandler } from './http/errorHandler.js';
import { NotFoundError, ValidationError } from './shared/errors.js';
import type { FoodProvider } from './modules/food/types.js';

export function createApp(config: Config, deps: { foodProvider: FoodProvider }) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Legacy lookup, kept until unified food search (M9) replaces it.
  app.get('/nutrition/:item', async (req, res, next) => {
    try {
      const item = (req.params.item ?? '').trim();
      if (!item) throw new ValidationError('Food name is required');
      const food = await deps.foodProvider.search(item);
      if (!food) throw new NotFoundError('Food not found in USDA FoodData Central');
      res.json({ food });
    } catch (e) {
      next(e);
    }
  });

  app.use(errorHandler);
  return app;
}
