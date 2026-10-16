import { afterEach, describe, expect, it } from 'vitest';
import type { Catalog } from './catalog';
import { count, injectCatalog, intlLocale, listJoin, resolveLanguage, t } from './index';
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

  it('joins lists in the current language', () => {
    expect(listJoin(['a', 'b', 'c'])).toBe('a, b and c');
  });
});
