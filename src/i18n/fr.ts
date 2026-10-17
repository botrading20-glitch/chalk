import type { Catalog } from './catalog';
import base from './fr/base';
import screens from './fr/screens';
import settings from './fr/settings';
import training from './fr/training';

/** Français. Traduction automatique : voir la page Langue des réglages. */
const fr: Catalog = { ...base, ...screens, ...settings, ...training };

export default fr;
