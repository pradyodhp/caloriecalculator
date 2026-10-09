# Authentication

- Passwords: scrypt with a per-user random salt (Node crypto). Minimum 10 characters. Plaintext is never stored or logged.
- Access token: JWT (HS256), 15 minutes, subject = user id. Secret from `JWT_SECRET` (min 32 chars; required in production, config refuses to start without it).
- Refresh token: random opaque value, 30 days, stored only as a SHA-256 hash, rotated on every use. Reusing a rotated token revokes all of that user's refresh tokens.
- Endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `DELETE /auth/account` (soft delete, revokes tokens).
- Login returns the same error for a wrong password and an unknown email, and does comparable work for both.
- Registration failure for an existing email gives a generic message.
- Auth routes are rate limited (30 requests per 15 minutes per IP) on top of the global limit.
- `requireAuth` takes the user id only from the verified token. Never from the body or URL.
- Not built yet: password reset and email verification (needs an email sender, deliberately not faked), Google/Apple sign-in. The architecture leaves room: `AuthRepository` is the storage boundary.
- Storage: Prisma repository verified against real PostgreSQL; in-memory repository used for unit tests.
