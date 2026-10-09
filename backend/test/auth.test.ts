import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { FoodSearchService } from '../src/modules/food/searchService.js';
import { AuthService } from '../src/modules/auth/service.js';
import { InMemoryAuthRepository } from '../src/modules/auth/repository.js';
import { hashPassword, verifyPassword } from '../src/modules/auth/password.js';

const config = loadConfig({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
function setup() {
  const repo = new InMemoryAuthRepository();
  const app = createApp(config, { foodSearch: new FoodSearchService([]), auth: new AuthService(repo, config.jwtSecret) });
  return { repo, app };
}
const creds = { email: 'A@Example.com', password: 'correct-horse-battery' };

test('password hashing is salted and verifies', async () => {
  const a = await hashPassword('hunter2hunter2');
  const b = await hashPassword('hunter2hunter2');
  assert.notStrictEqual(a, b);
  assert.ok(await verifyPassword('hunter2hunter2', a));
  assert.ok(!(await verifyPassword('wrong-password', a)));
  assert.ok(!a.includes('hunter2'));
});

test('register, me, login, no plaintext stored', async () => {
  const { app, repo } = setup();
  const reg = await request(app).post('/auth/register').send(creds);
  assert.strictEqual(reg.status, 201);
  const me = await request(app).get('/auth/me').set('authorization', `Bearer ${reg.body.accessToken}`);
  assert.strictEqual(me.body.userId, reg.body.userId);
  const login = await request(app).post('/auth/login').send({ ...creds, email: 'a@example.com' });
  assert.strictEqual(login.status, 200);
  assert.ok(![...repo.users.values()].some((u) => u.passwordHash.includes(creds.password)));
});

test('duplicate registration and weak passwords are rejected', async () => {
  const { app } = setup();
  await request(app).post('/auth/register').send(creds);
  assert.strictEqual((await request(app).post('/auth/register').send(creds)).status, 400);
  assert.strictEqual((await request(app).post('/auth/register').send({ email: 'b@example.com', password: 'short' })).status, 400);
});

test('wrong password and unknown user give the same 401', async () => {
  const { app } = setup();
  await request(app).post('/auth/register').send(creds);
  const a = await request(app).post('/auth/login').send({ ...creds, password: 'incorrect-password' });
  const b = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'incorrect-password' });
  assert.strictEqual(a.status, 401);
  assert.deepStrictEqual(a.body, b.body);
});

test('protected route needs a valid token', async () => {
  const { app } = setup();
  assert.strictEqual((await request(app).get('/auth/me')).status, 401);
  assert.strictEqual((await request(app).get('/auth/me').set('authorization', 'Bearer garbage')).status, 401);
});

test('refresh rotates; reusing an old refresh token revokes the family', async () => {
  const { app } = setup();
  const reg = await request(app).post('/auth/register').send(creds);
  const r1 = await request(app).post('/auth/refresh').send({ refreshToken: reg.body.refreshToken });
  assert.strictEqual(r1.status, 200);
  const reuse = await request(app).post('/auth/refresh').send({ refreshToken: reg.body.refreshToken });
  assert.strictEqual(reuse.status, 401);
  const after = await request(app).post('/auth/refresh').send({ refreshToken: r1.body.refreshToken });
  assert.strictEqual(after.status, 401);
});

test('logout revokes the refresh token', async () => {
  const { app } = setup();
  const reg = await request(app).post('/auth/register').send(creds);
  assert.strictEqual((await request(app).post('/auth/logout').send({ refreshToken: reg.body.refreshToken })).status, 204);
  assert.strictEqual((await request(app).post('/auth/refresh').send({ refreshToken: reg.body.refreshToken })).status, 401);
});

test('account deletion blocks login and old tokens', async () => {
  const { app } = setup();
  const reg = await request(app).post('/auth/register').send(creds);
  const del = await request(app).delete('/auth/account').set('authorization', `Bearer ${reg.body.accessToken}`);
  assert.strictEqual(del.status, 204);
  assert.strictEqual((await request(app).post('/auth/login').send(creds)).status, 401);
  assert.strictEqual((await request(app).get('/auth/me').set('authorization', `Bearer ${reg.body.accessToken}`)).status, 401);
});

test('production config refuses to start without JWT_SECRET', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'production' } as NodeJS.ProcessEnv));
});
