// The languages Setward is translated into. Kept free of imports so settings
// validation and types can use it without pulling in the catalogs.

export const LOCALES = [
  { code: 'en', name: 'English', intl: 'en-GB', dir: 'ltr' },
  { code: 'fr', name: 'Français', intl: 'fr', dir: 'ltr' },
  { code: 'ar', name: 'العربية', intl: 'ar-u-nu-latn', dir: 'rtl' },
  { code: 'es', name: 'Español', intl: 'es', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', intl: 'de', dir: 'ltr' },
  { code: 'pt', name: 'Português (Brasil)', intl: 'pt-BR', dir: 'ltr' },
  { code: 'it', name: 'Italiano', intl: 'it', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', intl: 'tr', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', intl: 'nl', dir: 'ltr' },
  { code: 'pl', name: 'Polski', intl: 'pl', dir: 'ltr' },
  { code: 'id', name: 'Bahasa Indonesia', intl: 'id', dir: 'ltr' },
] as const;

export type Locale = (typeof LOCALES)[number]['code'];
export type LanguagePreference = Locale | 'auto';

export const LOCALE_CODES = LOCALES.map((l) => l.code) as Locale[];

export const isLocale = (v: unknown): v is Locale => LOCALE_CODES.includes(v as Locale);

/** The first of the phone's languages Setward speaks, else English. A regional variant counts as its language (pt-PT → pt). */
export function detectLocale(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): Locale {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return 'en';
}
