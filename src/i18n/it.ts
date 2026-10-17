import type { Catalog } from './catalog';
import base from './it/base';
import screens from './it/screens';
import settings from './it/settings';

/** Italiano. Traduzione automatica: vedi la pagina Lingua nelle impostazioni. */
const it: Catalog = { ...base, ...screens, ...settings };

export default it;
