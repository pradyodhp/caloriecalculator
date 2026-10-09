import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Drift guard: every router route must be listed in docs/openapi.yaml.
const root = process.cwd(); // npm test runs from backend/
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(dir, d.name)) : d.name.endsWith('.ts') ? [join(dir, d.name)] : []));
}
const mounts: Record<string, string> = { auth: '/auth', user: '/v1', diary: '/v1', progress: '/v1', recipe: '/v1', food: '/v1' };
test('every route is documented in openapi.yaml', () => {
  const spec = readFileSync(join(root, '..', 'docs', 'openapi.yaml'), 'utf8');
  const missing: string[] = [];
  for (const f of files(join(root, 'src', 'modules'))) {
    const mod = f.split('modules/')[1]!.split('/')[0]!;
    const prefix = mounts[mod];
    if (!prefix) continue;
    for (const m of readFileSync(f, 'utf8').matchAll(/\br\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)) {
      const path = prefix + m[2]!.replace(/:(\w+)/g, '{$1}');
      const start = spec.indexOf(`\n  ${path}:\n`);
      const block = start < 0 ? undefined : spec.slice(start + 1).split(/\n  \//)[0];
      if (!block || !new RegExp(`\\n\\s+${m[1]}:`).test('\n' + block)) missing.push(`${m[1]} ${path}`);
    }
  }
  assert.deepEqual(missing, []);
});
