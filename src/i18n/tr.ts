import type { Catalog } from './catalog';
import base from './tr/base';
import screens from './tr/screens';
import settings from './tr/settings';

/** Türkçe. Makine çevirisi: Ayarlar’daki Dil sayfasına bak. */
const tr: Catalog = { ...base, ...screens, ...settings };

export default tr;
