import type { Catalog } from './catalog';
import base from './nl/base';
import screens from './nl/screens';
import settings from './nl/settings';

/** Nederlands. Machinevertaling: zie de pagina Taal in Instellingen. */
const nl: Catalog = { ...base, ...screens, ...settings };

export default nl;
