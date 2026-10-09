// Usage: npm run data:import-ifct -- /path/to/ifct2017
// Reads compositions/index.csv from a local clone of https://github.com/ifct2017/ifct2017
// and writes data/ifct2017.generated.json (git-ignored). The dataset is not vendored in this repo.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { importIfctCompositions } from '../src/modules/food/providers/ifctImport.js';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: npm run data:import-ifct -- /path/to/ifct2017');
  process.exit(1);
}
const csv = readFileSync(join(dir, 'compositions', 'index.csv'), 'utf8');
const foods = importIfctCompositions(csv, new Date().toISOString());
mkdirSync('data', { recursive: true });
writeFileSync('data/ifct2017.generated.json', JSON.stringify(foods));
console.log(`Imported ${foods.length} foods to data/ifct2017.generated.json`);
