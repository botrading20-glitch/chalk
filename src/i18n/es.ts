import type { Catalog } from './catalog';
import base from './es/base';
import screens from './es/screens';
import settings from './es/settings';
import training from './es/training';

/** Español. Traducción automática: consulta la página Idioma en Ajustes. */
const es: Catalog = { ...base, ...screens, ...settings, ...training };

export default es;
