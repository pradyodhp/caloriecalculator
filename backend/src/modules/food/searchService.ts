import type { FoodProvider, FoodRecord } from './types.js';

export interface SearchResult {
  results: FoodRecord[];
  // Providers that failed. A failure never hides results from the others, and is never silent.
  providerErrors: { provider: string; message: string }[];
}

/** Lower is better. Exact name, then word-prefix, then substring, then provider order. */
export function rankScore(description: string, query: string): number {
  const d = description.toLowerCase();
  const q = query.toLowerCase().trim();
  if (d === q) return 0;
  if (d.startsWith(q)) return 1;
  if (d.split(/[\s,]+/).some((w) => w.startsWith(q))) return 2;
  if (d.includes(q)) return 3;
  return 4;
}

export class FoodSearchService {
  constructor(private providers: FoodProvider[]) {}

  async search(query: string, limit = 10): Promise<SearchResult> {
    const settled = await Promise.allSettled(this.providers.map((p) => p.search(query, limit)));
    const providerErrors: SearchResult['providerErrors'] = [];
    const all: { rec: FoodRecord; order: number }[] = [];
    let order = 0;
    settled.forEach((s, i) => {
      if (s.status === 'fulfilled') s.value.forEach((rec) => all.push({ rec, order: order++ }));
      else providerErrors.push({ provider: this.providers[i]!.name, message: s.reason?.message ?? 'failed' });
    });
    all.sort((a, b) => rankScore(a.rec.description, query) - rankScore(b.rec.description, query) || a.order - b.order);
    return { results: all.slice(0, limit).map((x) => x.rec), providerErrors };
  }
}
