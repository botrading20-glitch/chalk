import type { Catalog } from './catalog';
import base from './nl/base';
import screens from './nl/screens';
import settings from './nl/settings';
import training from './nl/training';

/** Nederlands. Machinevertaling: zie de pagina Taal in Instellingen. */
const nl: Catalog = { ...base, ...screens, ...settings, ...training };

export default nl;
