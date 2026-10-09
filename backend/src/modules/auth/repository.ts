export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  deletedAt: Date | null;
}
export interface RefreshRecord {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Storage boundary for auth. In-memory for tests; Prisma implementation for real use. */
export interface AuthRepository {
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  createUser(email: string, passwordHash: string): Promise<UserRecord>;
  softDeleteUser(id: string): Promise<void>;
  saveRefresh(r: Omit<RefreshRecord, 'revokedAt'>): Promise<void>;
  findRefresh(tokenHash: string): Promise<RefreshRecord | null>;
  revokeRefresh(tokenHash: string): Promise<void>;
  revokeAllRefresh(userId: string): Promise<void>;
}

export class InMemoryAuthRepository implements AuthRepository {
  users = new Map<string, UserRecord>();
  refresh = new Map<string, RefreshRecord>();
  async findUserByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  async findUserById(id: string) { return this.users.get(id) ?? null; }
  async createUser(email: string, passwordHash: string) {
    const u = { id: crypto.randomUUID(), email, passwordHash, deletedAt: null };
    this.users.set(u.id, u);
    return u;
  }
  async softDeleteUser(id: string) {
    const u = this.users.get(id);
    if (u) u.deletedAt = new Date();
  }
  async saveRefresh(r: Omit<RefreshRecord, 'revokedAt'>) { this.refresh.set(r.tokenHash, { ...r, revokedAt: null }); }
  async findRefresh(h: string) { return this.refresh.get(h) ?? null; }
  async revokeRefresh(h: string) {
    const r = this.refresh.get(h);
    if (r) r.revokedAt = new Date();
  }
  async revokeAllRefresh(userId: string) {
    for (const r of this.refresh.values()) if (r.userId === userId) r.revokedAt = new Date();
  }
}
