import type { Catalog } from './catalog';
import base from './tr/base';
import screens from './tr/screens';
import settings from './tr/settings';
import training from './tr/training';

/** Türkçe. Makine çevirisi: Ayarlar’daki Dil sayfasına bak. */
const tr: Catalog = { ...base, ...screens, ...settings, ...training };

export default tr;
