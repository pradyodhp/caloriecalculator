import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  USDA_API_KEY: z.string().default(''),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('test-only-secret-not-for-use-0123456789abcdef'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const e = schema.parse(env);
  if (e.NODE_ENV === 'production' && !env.JWT_SECRET) throw new Error('JWT_SECRET is required in production');
  return {
    port: e.PORT,
    nodeEnv: e.NODE_ENV,
    usdaApiKey: e.USDA_API_KEY,
    jwtSecret: e.JWT_SECRET,
    corsOrigins: e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  };
}

export type Config = ReturnType<typeof loadConfig>;
