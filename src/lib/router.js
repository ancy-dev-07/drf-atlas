import { useSyncExternalStore } from 'react';

/**
 * Minimal hash router.
 * URL shape:  #/<page-slug>?s=<section-id>
 * Hash routing keeps the built site working on any static host without
 * server-side rewrite rules.
 */
const hasWindow = typeof window !== 'undefined';

function parse() {
  if (!hasWindow) return { path: '', section: null };
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  return { path: path.replace(/\/$/, ''), section: params.get('s') };
}

let current = parse();
const listeners = new Set();

if (hasWindow) {
  window.addEventListener('hashchange', () => {
    current = parse();
    listeners.forEach((l) => l());
  });
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useRoute() {
  return useSyncExternalStore(subscribe, () => current);
}

export function hrefFor(path, section) {
  return `#/${path}${section ? `?s=${encodeURIComponent(section)}` : ''}`;
}

export function navigate(path, section) {
  window.location.hash = hrefFor(path, section).slice(1);
}

/** Update the section in the URL without triggering a scroll jump. */
export function replaceSection(path, section) {
  const url = hrefFor(path, section);
  if (window.location.hash !== url) {
    history.replaceState(null, '', url);
    current = { path, section };
  }
}
