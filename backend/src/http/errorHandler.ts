import type { ErrorRequestHandler } from 'express';
import { AppError } from '../shared/errors.js';
import { logger } from '../shared/logger.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  logger.error('unhandled_error', { path: req.path, message: String(err?.message ?? err) });
  res.status(500).json({ error: { code: 'internal_error', message: 'Internal Server Error' } });
};
