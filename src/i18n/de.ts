import type { Catalog } from './catalog';
import base from './de/base';
import screens from './de/screens';
import settings from './de/settings';

/** Deutsch. Maschinelle Übersetzung: siehe die Seite Sprache in den Einstellungen. */
const de: Catalog = { ...base, ...screens, ...settings };

export default de;
