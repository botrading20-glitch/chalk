import type { Catalog } from './catalog';
import base from './pl/base';
import screens from './pl/screens';
import settings from './pl/settings';

/** Polski. Tłumaczenie maszynowe: zobacz stronę Język w Ustawieniach. */
const pl: Catalog = { ...base, ...screens, ...settings };

export default pl;
