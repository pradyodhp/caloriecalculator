import express from 'express';
import { z } from 'zod';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Config } from './config/env.js';
import { errorHandler } from './http/errorHandler.js';
import { ExternalProviderError, NotFoundError, ValidationError } from './shared/errors.js';
import type { FoodSearchService } from './modules/food/searchService.js';

export function createApp(config: Config, deps: { foodSearch: FoodSearchService }) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const query = z.object({
    q: z.string().trim().min(1).max(100),
    limit: z.coerce.number().int().min(1).max(25).default(10),
  });

  app.get('/foods/search', async (req, res, next) => {
    try {
      const parsed = query.safeParse(req.query);
      if (!parsed.success) throw new ValidationError('q is required (1-100 chars); limit is 1-25');
      const { results, providerErrors } = await deps.foodSearch.search(parsed.data.q, parsed.data.limit);
      if (results.length === 0 && providerErrors.length > 0) throw new ExternalProviderError();
      res.json({ query: parsed.data.q, count: results.length, results, providerErrors });
    } catch (e) {
      next(e);
    }
  });

  // Legacy single-food lookup, kept for the current frontend until M16.
  app.get('/nutrition/:item', async (req, res, next) => {
    try {
      const item = (req.params.item ?? '').trim();
      if (!item) throw new ValidationError('Food name is required');
      const { results, providerErrors } = await deps.foodSearch.search(item, 1);
      const food = results[0];
      if (!food) {
        if (providerErrors.length) throw new ExternalProviderError();
        throw new NotFoundError('Food not found');
      }
      res.json({ food });
    } catch (e) {
      next(e);
    }
  });

  app.use(errorHandler);
  return app;
}
