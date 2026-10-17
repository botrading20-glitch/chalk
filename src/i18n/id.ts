import type { Catalog } from './catalog';
import base from './id/base';
import screens from './id/screens';
import settings from './id/settings';

/** Bahasa Indonesia. Terjemahan mesin: lihat halaman Bahasa di Pengaturan. */
const id: Catalog = { ...base, ...screens, ...settings };

export default id;
