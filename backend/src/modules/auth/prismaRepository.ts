import type { PrismaClient } from '@prisma/client';
import type { AuthRepository, RefreshRecord, UserRecord } from './repository.js';

// Not yet exercised against a live PostgreSQL in this build (see docs/data-model.md).
export class PrismaAuthRepository implements AuthRepository {
  constructor(private db: PrismaClient) {}
  findUserByEmail(email: string): Promise<UserRecord | null> {
    return this.db.user.findUnique({ where: { email } });
  }
  findUserById(id: string): Promise<UserRecord | null> {
    return this.db.user.findUnique({ where: { id } });
  }
  createUser(email: string, passwordHash: string): Promise<UserRecord> {
    return this.db.user.create({ data: { email, passwordHash } });
  }
  async softDeleteUser(id: string) {
    await this.db.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  async saveRefresh(r: Omit<RefreshRecord, 'revokedAt'>) {
    await this.db.refreshToken.create({ data: r });
  }
  findRefresh(tokenHash: string): Promise<RefreshRecord | null> {
    return this.db.refreshToken.findUnique({ where: { tokenHash } });
  }
  async revokeRefresh(tokenHash: string) {
    await this.db.refreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } });
  }
  async revokeAllRefresh(userId: string) {
    await this.db.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
