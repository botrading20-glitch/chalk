import type { Catalog } from './catalog';
import base from './id/base';
import screens from './id/screens';
import settings from './id/settings';
import training from './id/training';

/** Bahasa Indonesia. Terjemahan mesin: lihat halaman Bahasa di Pengaturan. */
const id: Catalog = { ...base, ...screens, ...settings, ...training };

export default id;
