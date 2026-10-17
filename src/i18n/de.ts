import type { Catalog } from './catalog';
import base from './de/base';
import screens from './de/screens';
import settings from './de/settings';
import training from './de/training';

/** Deutsch. Maschinelle Übersetzung: siehe die Seite Sprache in den Einstellungen. */
const de: Catalog = { ...base, ...screens, ...settings, ...training };

export default de;
