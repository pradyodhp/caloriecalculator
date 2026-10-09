import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  USDA_API_KEY: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const e = schema.parse(env);
  return {
    port: e.PORT,
    nodeEnv: e.NODE_ENV,
    usdaApiKey: e.USDA_API_KEY,
    corsOrigins: e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  };
}

export type Config = ReturnType<typeof loadConfig>;
