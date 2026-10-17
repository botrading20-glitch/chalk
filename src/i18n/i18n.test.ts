import { afterEach, describe, expect, it } from 'vitest';
import type { Catalog } from './catalog';
import { en } from './en';
import { fmtVolume, fmtWeight, plain } from '../lib/format';
import { recordFormat } from '../lib/recordFormat';
import { fmtSet } from '../lib/sets';
import type { WorkoutSet } from '../types';
import { count, injectCatalog, intlLocale, isRtl, listJoin, LOADERS, resolveLanguage, t } from './index';
import type { Message } from './message';
import { detectLocale, LOCALES } from './locales';

afterEach(() => injectCatalog('en', {} as Catalog));

describe('t', () => {
  it('fills placeholders and picks the plural form for n', () => {
    expect(t('count.workout', { n: 1 })).toBe('1 workout');
    expect(t('count.workout', { n: 3 })).toBe('3 workouts');
    expect(t('count.workout', { n: 1234 })).toBe('1,234 workouts');
    expect(count('set', 0)).toBe('0 sets');
    expect(t('time.minutesSeconds', { m: 1, s: 30 })).toBe('1min 30s');
  });

  it('falls back to English for a key a language lacks, and uses the language plural rules', () => {
    injectCatalog('pl', { 'count.workout': { one: '{n} trening', few: '{n} treningi', many: '{n} treningów', other: '{n} treningu' } } as unknown as Catalog);
    expect(intlLocale()).toBe('pl');
    expect(t('count.workout', { n: 1 })).toBe('1 trening');
    expect(t('count.workout', { n: 3 })).toBe('3 treningi');
    expect(t('count.workout', { n: 5 })).toBe('5 treningów');
    expect(t('count.set', { n: 2 })).toBe('2 sets');
  });

  it('keeps Arabic digits Western and picks the six-way plural', () => {
    injectCatalog('ar', { 'count.set': { zero: 'صفر {n}', one: 'واحدة', two: 'اثنتان', few: '{n} مجموعات', many: '{n} مجموعة', other: '{n} مجموعة' } } as unknown as Catalog);
    expect(intlLocale()).toContain('nu-latn');
    expect(t('count.set', { n: 0 })).toBe('صفر 0');
    expect(t('count.set', { n: 2 })).toBe('اثنتان');
    expect(t('count.set', { n: 7 })).toBe('7 مجموعات');
  });
});

describe('numbers inside right-to-left text', () => {
  const kg = { weightUnit: 'kg', distanceUnit: 'km' } as const;
  const set = (extra: Partial<WorkoutSet>): WorkoutSet => ({ id: 's', type: 'normal', completed: true, ...extra });

  it('keeps weights, distances and set summaries in reading order in Arabic only', () => {
    expect(fmtWeight(100, 'kg')).toBe('100 kg');
    injectCatalog('ar', {} as Catalog);
    expect(isRtl()).toBe(true);
    expect(fmtWeight(100, 'kg')).toBe('⁦100 kg⁩');
    expect(fmtVolume(1234.4, 'kg')).toBe('⁦1,234 kg⁩');
    expect(fmtSet(set({ weight: 66, reps: 15 }), 'weight_reps', kg)).toBe('⁦66 kg × 15⁩');
    expect(fmtSet(set({ distance: 2, duration: 343 }), 'distance_duration', kg)).toBe('⁦2 km · 5:43⁩');
    expect(recordFormat('weight', 72.5, kg)).toBe('⁦72.5 kg⁩');
  });

  it('does not isolate translated text, and plain() takes the marks back out', () => {
    injectCatalog('ar', { 'count.rep': '{n} تكرارًا' } as unknown as Catalog);
    expect(fmtSet(set({ reps: 12 }), 'bodyweight_reps', kg)).toBe('12 تكرارًا');
    expect(plain(fmtSet(set({ weight: 66, reps: 15 }), 'weight_reps', kg))).toBe('66 kg × 15');
  });
});

describe('languages', () => {
  it('detects the first supported phone language, counting regional variants', () => {
    expect(detectLocale(['xx-YY', 'pt-PT', 'fr'])).toBe('pt');
    expect(detectLocale(['ar-TN'])).toBe('ar');
    expect(detectLocale(['ja'])).toBe('en');
    expect(detectLocale([])).toBe('en');
  });

  it('resolves a preference, treating an unknown code as English', () => {
    expect(resolveLanguage('de')).toBe('de');
    expect(resolveLanguage('klingon' as never)).toBe('en');
  });

  it('lists each language once, with Arabic the only right-to-left one', () => {
    expect(new Set(LOCALES.map((l) => l.code)).size).toBe(LOCALES.length);
    expect(LOCALES.filter((l) => l.dir === 'rtl').map((l) => l.code)).toEqual(['ar']);
  });

  it('has a translation for every language except English', () => {
    const missing = LOCALES.filter((l) => l.code !== 'en' && !LOADERS[l.code]).map((l) => l.code);
    expect(missing).toEqual([]);
    expect(LOCALES.filter((l) => l.code !== 'en')).toHaveLength(10);
  });

  it('joins lists in the current language', () => {
    expect(listJoin(['a', 'b', 'c'])).toBe('a, b and c');
  });
});

// Every translation must cover the same messages as the English catalog, with the same
// placeholders and markup, and every plural form its language needs.

const placeholders = (text: string) => new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
const tags = (text: string) => [...text.matchAll(/<(\w+)>/g)].map((m) => m[1]).sort().join(',');
const forms = (m: Message): string[] => (typeof m === 'string' ? [m] : Object.values(m).filter((v): v is string => typeof v === 'string'));
const union = (texts: string[]) => new Set(texts.flatMap((x) => [...placeholders(x)]));

describe.each(LOCALES.filter((l) => l.code !== 'en' && LOADERS[l.code]))('the $name catalog', (locale) => {
  const load = async () => (await LOADERS[locale.code]!()).default as Record<string, Message>;

  it('has every English key and no others', async () => {
    const catalog = await load();
    expect(Object.keys(en).filter((k) => !(k in catalog))).toEqual([]);
    expect(Object.keys(catalog).filter((k) => !(k in en))).toEqual([]);
  });

  it('keeps the placeholders and markup of every message', async () => {
    const catalog = await load();
    const problems: string[] = [];
    for (const [key, source] of Object.entries(en) as [string, Message][]) {
      const translated = catalog[key];
      if (translated === undefined) continue;
      const want = union(forms(source));
      for (const text of forms(translated)) {
        for (const name of placeholders(text)) if (!want.has(name)) problems.push(`${key}: unknown {${name}}`);
      }
      for (const name of want) if (!forms(translated).some((x) => placeholders(x).has(name))) problems.push(`${key}: missing {${name}}`);
      if (typeof source === 'string' && typeof translated === 'string' && tags(source) !== tags(translated)) problems.push(`${key}: markup differs`);
      if (typeof source === 'string' && typeof translated !== 'string') problems.push(`${key}: should be plain text`);
    }
    expect(problems).toEqual([]);
  });

  it('has the plural forms the language needs', async () => {
    const catalog = await load();
    const rules = new Intl.PluralRules(locale.intl);
    const needed = new Set<string>(['other']);
    for (let n = 0; n <= 1000; n++) needed.add(rules.select(n));
    const problems: string[] = [];
    for (const [key, source] of Object.entries(en) as [string, Message][]) {
      if (typeof source === 'string') continue;
      const translated = catalog[key];
      if (typeof translated === 'string') {
        if (needed.size > 1) problems.push(`${key}: needs forms ${[...needed].join(', ')}`);
        continue;
      }
      for (const form of needed) if (!translated[form as keyof typeof translated]) problems.push(`${key}: missing ${form}`);
    }
    expect(problems).toEqual([]);
  });
});
