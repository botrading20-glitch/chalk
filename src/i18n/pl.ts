import type { Catalog } from './catalog';
import base from './pl/base';
import screens from './pl/screens';
import settings from './pl/settings';
import training from './pl/training';

/** Polski. Tłumaczenie maszynowe: zobacz stronę Język w Ustawieniach. */
const pl: Catalog = { ...base, ...screens, ...settings, ...training };

export default pl;
