import { SignJWT, jwtVerify } from 'jose';
import { AuthenticationError, ValidationError } from '../../shared/errors.js';
import { hashPassword, newOpaqueToken, sha256, verifyPassword } from './password.js';
import type { AuthRepository } from './repository.js';

const ACCESS_TTL_S = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// A fixed hash so login time does not reveal whether an email exists.
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '00'.repeat(64);

export interface Tokens { accessToken: string; refreshToken: string; expiresInSeconds: number }

export class AuthService {
  private key: Uint8Array;
  constructor(private repo: AuthRepository, secret: string, private now: () => Date = () => new Date()) {
    this.key = new TextEncoder().encode(secret);
  }

  private async issue(userId: string): Promise<Tokens> {
    const accessToken = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt(Math.floor(this.now().getTime() / 1000))
      .setExpirationTime(Math.floor(this.now().getTime() / 1000) + ACCESS_TTL_S)
      .sign(this.key);
    const refreshToken = newOpaqueToken();
    await this.repo.saveRefresh({
      tokenHash: sha256(refreshToken),
      userId,
      expiresAt: new Date(this.now().getTime() + REFRESH_TTL_MS),
    });
    return { accessToken, refreshToken, expiresInSeconds: ACCESS_TTL_S };
  }

  async register(email: string, password: string): Promise<{ userId: string } & Tokens> {
    const existing = await this.repo.findUserByEmail(email);
    if (existing) throw new ValidationError('Could not register with these details');
    const user = await this.repo.createUser(email, await hashPassword(password));
    return { userId: user.id, ...(await this.issue(user.id)) };
  }

  async login(email: string, password: string): Promise<Tokens> {
    const user = await this.repo.findUserByEmail(email);
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || user.deletedAt || !ok) throw new AuthenticationError('Invalid email or password');
    return this.issue(user.id);
  }

  /** Rotates: the presented refresh token is revoked and a new pair is issued. Reuse revokes everything. */
  async refresh(refreshToken: string): Promise<Tokens> {
    const hash = sha256(refreshToken);
    const rec = await this.repo.findRefresh(hash);
    if (!rec) throw new AuthenticationError('Invalid refresh token');
    if (rec.revokedAt) {
      await this.repo.revokeAllRefresh(rec.userId); // reuse of a rotated token: assume theft
      throw new AuthenticationError('Invalid refresh token');
    }
    if (rec.expiresAt <= this.now()) throw new AuthenticationError('Refresh token expired');
    const user = await this.repo.findUserById(rec.userId);
    if (!user || user.deletedAt) throw new AuthenticationError('Invalid refresh token');
    await this.repo.revokeRefresh(hash);
    return this.issue(rec.userId);
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = sha256(refreshToken);
    if (await this.repo.findRefresh(hash)) await this.repo.revokeRefresh(hash);
  }

  async verifyAccess(token: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ['HS256'] });
      if (!payload.sub) throw new Error('no sub');
      const user = await this.repo.findUserById(payload.sub);
      if (!user || user.deletedAt) throw new Error('gone');
      return payload.sub;
    } catch {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.repo.revokeAllRefresh(userId);
    await this.repo.softDeleteUser(userId);
  }
}
