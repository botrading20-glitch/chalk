import type { Catalog } from './catalog';
import base from './ar/base';
import screens from './ar/screens';
import settings from './ar/settings';
import training from './ar/training';

/** العربية. ترجمة آلية: انظر صفحة اللغة في الإعدادات. */
const ar: Catalog = { ...base, ...screens, ...settings, ...training };

export default ar;
