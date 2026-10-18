import type { Catalog } from './catalog';
import base from './pt/base';
import screens from './pt/screens';
import settings from './pt/settings';
import training from './pt/training';

/** Português (Brasil). Tradução automática: veja a página Idioma nas Configurações. */
const pt: Catalog = { ...base, ...screens, ...settings, ...training };

export default pt;
