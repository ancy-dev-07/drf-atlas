/**
 * The real project source, snapshotted by `npm run sync-source`.
 * Every code sample in the documentation that says "from <file>" is
 * extracted from these strings, not retyped by hand.
 */
import settingsPy from '../source/config__settings.py.txt?raw';
import rootUrlsPy from '../source/config__urls.py.txt?raw';
import modelsPy from '../source/products__models.py.txt?raw';
import serializersPy from '../source/products__serializers.py.txt?raw';
import viewsPy from '../source/products__views.py.txt?raw';
import appUrlsPy from '../source/products__urls.py.txt?raw';
import adminPy from '../source/products__admin.py.txt?raw';
import appsPy from '../source/products__apps.py.txt?raw';
import migrationPy from '../source/products__migrations__0001_initial.py.txt?raw';

const norm = (s) => s.replace(/\r\n/g, '\n');

export const SRC = {
  settings: norm(settingsPy),
  rootUrls: norm(rootUrlsPy),
  models: norm(modelsPy),
  serializers: norm(serializersPy),
  views: norm(viewsPy),
  appUrls: norm(appUrlsPy),
  admin: norm(adminPy),
  apps: norm(appsPy),
  migration: norm(migrationPy),
};

function trimBlank(lines) {
  let a = 0;
  let b = lines.length;
  while (a < b && !lines[a].trim()) a++;
  while (b > a && !lines[b - 1].trim()) b--;
  return lines.slice(a, b);
}

/**
 * Extract a top-level `def name` or `class Name` (the active, uncommented one)
 * together with its decorators.
 */
export function pyBlock(src, header) {
  const lines = src.split('\n');
  const start = lines.findIndex((l) => l.startsWith(header + '(') || l.startsWith(header + ':'));
  if (start === -1) return `# ${header} not found in source`;
  let top = start;
  while (top > 0 && lines[top - 1].startsWith('@')) top--;
  let end = start + 1;
  while (end < lines.length) {
    const l = lines[end];
    if (l.trim() && !/^\s/.test(l)) break;
    end++;
  }
  return trimBlank(lines.slice(top, end)).join('\n');
}

/** Lines from the first match of `startRe` until the brackets opened on it close. */
export function bracketBlock(src, startRe) {
  const lines = src.split('\n');
  const start = lines.findIndex((l) => startRe.test(l));
  if (start === -1) return '# block not found in source';
  let depth = 0;
  let seen = false;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if ('([{'.includes(ch)) { depth++; seen = true; }
      if (')]}'.includes(ch)) depth--;
    }
    if (seen && depth <= 0) return lines.slice(start, i + 1).join('\n');
  }
  return lines.slice(start).join('\n');
}

/** Lines from the first match of `startRe` up to (not including) `endRe`, or file end. */
export function between(src, startRe, endRe) {
  const lines = src.split('\n');
  const start = lines.findIndex((l) => startRe.test(l));
  if (start === -1) return '# block not found in source';
  let end = lines.length;
  if (endRe) {
    const rel = lines.slice(start + 1).findIndex((l) => endRe.test(l));
    if (rel !== -1) end = start + 1 + rel;
  }
  return trimBlank(lines.slice(start, end)).join('\n');
}

/** Whole file with surrounding blank lines removed. */
export function whole(src) {
  return trimBlank(src.split('\n')).join('\n');
}

// Frequently used excerpts
export const CODE = {
  model: whole(SRC.models),
  registerSerializer: pyBlock(SRC.serializers, 'class RegisterSerializer'),
  productSerializer: pyBlock(SRC.serializers, 'class ProductSerializer'),
  register: pyBlock(SRC.views, 'def register'),
  createProduct: pyBlock(SRC.views, 'def create_product'),
  logout: pyBlock(SRC.views, 'def logout'),
  getProducts: pyBlock(SRC.views, 'def get_products'),
  getProduct: pyBlock(SRC.views, 'def get_product'),
  updateProduct: pyBlock(SRC.views, 'def update_product'),
  deleteProduct: pyBlock(SRC.views, 'def delete_product'),
  viewImports: between(SRC.views, /^from django\.contrib\.auth\.models/, /^@api_view/),
  appUrls: whole(SRC.appUrls),
  rootUrls: between(SRC.rootUrls, /^from django\.contrib import admin/),
  installedApps: bracketBlock(SRC.settings, /^INSTALLED_APPS/),
  databases: bracketBlock(SRC.settings, /^DATABASES/),
  passwordValidators: bracketBlock(SRC.settings, /^AUTH_PASSWORD_VALIDATORS/),
  restAndJwt: between(SRC.settings, /^from datetime import timedelta/, /^MEDIA_URL/),
  media: between(SRC.settings, /^MEDIA_URL/),
  admin: whole(SRC.admin),
  migration: whole(SRC.migration),
};
