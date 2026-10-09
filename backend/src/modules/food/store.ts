import type { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../shared/errors.js';
import type { FoodRecord, NutrientValue, SourceType } from './types.js';
import type { Serving } from '../serving/serving.js';

export interface StoredFood {
  id: string;
  record: FoodRecord;
  servings: Serving[];
}

const toNutrients = (rows: { nutrient: string; amount: Prisma.Decimal; unit: string }[]): NutrientValue[] =>
  rows.map((n) => ({ key: n.nutrient, value: Number(n.amount), unit: n.unit as NutrientValue['unit'] }));

type DbFood = Prisma.FoodGetPayload<{ include: { nutrients: true; servings: true } }>;

function toStored(f: DbFood): StoredFood {
  return {
    id: f.id,
    record: {
      description: f.displayName,
      sourceType: f.sourceType as SourceType,
      source: f.source,
      sourceId: f.sourceId ?? f.id,
      dataType: f.foodType ?? undefined,
      retrievedAt: (f.retrievedAt ?? f.createdAt).toISOString(),
      basis: 'per 100 g',
      nutrients: toNutrients(f.nutrients),
    },
    servings: f.servings.map((s) => ({
      label: s.label,
      gramWeight: Number(s.gramWeight),
      isDefault: s.isDefault,
      sourceNote: s.sourceNote ?? 'unspecified',
      isEstimate: s.isEstimate,
    })),
  };
}

const include = { nutrients: true, servings: true } as const;

export class FoodStore {
  constructor(private db: PrismaClient) {}

  /** Cache a provider result so diary entries can reference it. Authoritative values come from the provider, never the client. */
  async upsertFromRecord(r: FoodRecord): Promise<StoredFood> {
    const existing = await this.db.food.findUnique({
      where: { sourceType_sourceId: { sourceType: r.sourceType, sourceId: r.sourceId } },
      include,
    });
    if (existing) return toStored(existing);
    const created = await this.db.food.create({
      data: {
        canonicalName: r.description.toLowerCase(),
        displayName: r.description,
        foodType: r.dataType,
        sourceType: r.sourceType,
        source: r.source,
        sourceId: r.sourceId,
        verificationStatus: r.sourceType === 'demo' ? 'demonstration' : 'verified_source',
        retrievedAt: new Date(r.retrievedAt),
        nutrients: { create: r.nutrients.map((n) => ({ nutrient: n.key, amount: n.value, unit: n.unit })) },
      },
      include,
    });
    return toStored(created);
  }

  /** A food is visible if it is shared (no owner) or owned by this user. */
  async getVisible(id: string, userId: string): Promise<StoredFood> {
    const f = await this.db.food.findFirst({
      where: { id, deletedAt: null, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
      include,
    });
    if (!f) throw new NotFoundError('Food not found');
    return toStored(f);
  }

  async createCustom(
    userId: string,
    input: { name: string; nutrients: NutrientValue[]; servings: { label: string; gramWeight: number; isDefault?: boolean }[]; source?: string },
  ): Promise<StoredFood> {
    const created = await this.db.food.create({
      data: {
        canonicalName: input.name.toLowerCase(),
        displayName: input.name,
        sourceType: 'user',
        source: input.source ?? 'User-entered',
        verificationStatus: 'unverified',
        ownerUserId: userId,
        nutrients: { create: input.nutrients.map((n) => ({ nutrient: n.key, amount: n.value, unit: n.unit })) },
        servings: {
          create: input.servings.map((s) => ({
            label: s.label,
            gramWeight: s.gramWeight,
            isDefault: s.isDefault ?? false,
            sourceNote: 'user-entered',
            isEstimate: true,
          })),
        },
      },
      include,
    });
    return toStored(created);
  }

  async listCustom(userId: string): Promise<StoredFood[]> {
    const rows = await this.db.food.findMany({ where: { ownerUserId: userId, deletedAt: null }, include, orderBy: { createdAt: 'desc' }, take: 200 });
    return rows.map(toStored);
  }

  async deleteCustom(userId: string, id: string): Promise<void> {
    const r = await this.db.food.updateMany({ where: { id, ownerUserId: userId, deletedAt: null }, data: { deletedAt: new Date() } });
    if (r.count === 0) throw new NotFoundError('Food not found');
  }
}
