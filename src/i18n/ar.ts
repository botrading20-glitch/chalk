import type { Catalog } from './catalog';
import base from './ar/base';
import screens from './ar/screens';
import settings from './ar/settings';

/** العربية. ترجمة آلية: انظر صفحة اللغة في الإعدادات. */
const ar: Catalog = { ...base, ...screens, ...settings };

export default ar;
