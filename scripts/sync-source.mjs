// Copies the real Django source files into src/source so the documentation
// always quotes the actual implementation. Run: npm run sync-source
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const backend = resolve(here, '../../backend');
const out = resolve(here, '../src/source');

const files = [
  'config/settings.py',
  'config/urls.py',
  'products/models.py',
  'products/serializers.py',
  'products/views.py',
  'products/urls.py',
  'products/admin.py',
  'products/apps.py',
  'products/migrations/0001_initial.py',
];

mkdirSync(out, { recursive: true });
for (const f of files) {
  const src = resolve(backend, f);
  if (!existsSync(src)) { console.warn('missing', src); continue; }
  const dest = resolve(out, f.replace(/\//g, '__') + '.txt');
  copyFileSync(src, dest);
  console.log('synced', f);
}
