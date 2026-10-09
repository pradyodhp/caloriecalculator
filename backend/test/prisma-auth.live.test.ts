// Runs only when DATABASE_URL points at a migrated database. Skipped in plain `npm test`.
import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { PrismaAuthRepository } from '../src/modules/auth/prismaRepository.js';
import { AuthService } from '../src/modules/auth/service.js';

const live = !!process.env.DATABASE_URL;

test('auth service works against real PostgreSQL', { skip: !live }, async () => {
  const db = new PrismaClient();
  const auth = new AuthService(new PrismaAuthRepository(db), 'x'.repeat(40));
  const email = `live-${Date.now()}@example.com`;
  const reg = await auth.register(email, 'correct-horse-battery');
  assert.strictEqual(await auth.verifyAccess(reg.accessToken), reg.userId);
  const t2 = await auth.refresh(reg.refreshToken);
  await assert.rejects(() => auth.refresh(reg.refreshToken));
  await assert.rejects(() => auth.refresh(t2.refreshToken)); // family revoked after reuse
  await auth.login(email, 'correct-horse-battery');
  await auth.deleteAccount(reg.userId);
  await assert.rejects(() => auth.login(email, 'correct-horse-battery'));
  await db.$disconnect();
});
