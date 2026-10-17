import type { Catalog } from './catalog';
import base from './fr/base';
import screens from './fr/screens';
import settings from './fr/settings';

/** Français. Traduction automatique : voir la page Langue des réglages. */
const fr: Catalog = { ...base, ...screens, ...settings };

export default fr;
