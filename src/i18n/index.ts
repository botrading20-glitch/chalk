import { useSyncExternalStore } from 'react';
import type { Catalog, Key } from './catalog';
import { en } from './en';
import { detectLocale, isLocale, LOCALES, type LanguagePreference, type Locale } from './locales';
import type { Message, Vars } from './message';

// Small translation layer: no dependency, English bundled, the other languages
// loaded on demand (and precached by the service worker, so they work offline).

type Loader = () => Promise<{ default: Catalog }>;

/** One chunk per language, loaded when it is chosen; a language without a loader falls back to English. */
export const LOADERS: Partial<Record<Locale, Loader>> = {
  fr: () => import('./fr'),
  ar: () => import('./ar'),
  es: () => import('./es'),
  de: () => import('./de'),
  pt: () => import('./pt'),
  it: () => import('./it'),
  tr: () => import('./tr'),
  nl: () => import('./nl'),
  pl: () => import('./pl'),
  id: () => import('./id'),
};

let locale: Locale = 'en';
let catalog: Partial<Catalog> = en;
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const currentLocale = () => locale;

/** True while the interface reads right to left (Arabic). */
export const isRtl = () => LOCALES.find((l) => l.code === locale)!.dir === 'rtl';

/** The BCP 47 tag for Intl.*: English uses en-GB (day first, 24 h) as the app always has; Arabic keeps Western digits. */
export const intlLocale = () => LOCALES.find((l) => l.code === locale)!.intl;

export function useLocale() {
  return useSyncExternalStore(subscribe, currentLocale);
}

const rules = new Map<string, Intl.PluralRules>();
function pluralForm(n: number) {
  const tag = intlLocale();
  let r = rules.get(tag);
  if (!r) rules.set(tag, (r = new Intl.PluralRules(tag)));
  return r.select(n);
}

const numbers = new Map<string, Intl.NumberFormat>();
function formatNumber(n: number) {
  const tag = intlLocale();
  let f = numbers.get(tag);
  if (!f) numbers.set(tag, (f = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 })));
  return f.format(n);
}

function pick(message: Message, vars?: Vars) {
  if (typeof message === 'string') return message;
  const n = vars?.n;
  return (typeof n === 'number' && message[pluralForm(n)]) || message.other;
}

function fill(text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const v = vars[name];
    return v === undefined ? whole : typeof v === 'number' ? formatNumber(v) : v;
  });
}

/** The text for `key` in the current language, with {placeholders} filled in. */
export function t(key: Key, vars?: Vars): string {
  return fill(pick(catalog[key] ?? en[key], vars), vars);
}

/** The raw template, for rich text (tags and element placeholders are resolved by tRich). */
export function template(key: Key, vars?: Vars): string {
  return pick(catalog[key] ?? en[key], vars);
}

/** "3 workouts": `noun` names a `count.<noun>` message. */
export function count(noun: string, n: number) {
  return t(`count.${noun}` as Key, { n });
}

/** "a, b and c" in the current language. */
export function listJoin(items: string[]) {
  return new Intl.ListFormat(intlLocale(), { style: 'long', type: 'conjunction' }).format(items);
}

function applyDocument(next: Locale) {
  if (typeof document === 'undefined') return;
  const info = LOCALES.find((l) => l.code === next)!;
  document.documentElement.lang = next;
  document.documentElement.dir = info.dir;
}

/** Loads the language's messages, then switches every subscribed component to it. */
export async function setLocale(next: Locale) {
  if (next === locale && catalog !== en) return;
  let loaded: Partial<Catalog> = en;
  const load = LOADERS[next];
  if (next !== 'en' && load) {
    try {
      loaded = (await load()).default;
    } catch {
      // Offline with the chunk not cached yet: stay in the current language rather than break the app.
      return;
    }
  }
  locale = next;
  catalog = loaded;
  applyDocument(next);
  listeners.forEach((l) => l());
}

export const resolveLanguage = (pref: LanguagePreference): Locale => (pref === 'auto' ? detectLocale() : isLocale(pref) ? pref : 'en');

/** Test hook: use `messages` as the catalog for `next` without loading a chunk. */
export function injectCatalog(next: Locale, messages: Partial<Catalog>) {
  locale = next;
  catalog = messages;
}
