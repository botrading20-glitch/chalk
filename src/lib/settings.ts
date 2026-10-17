import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_SETTINGS, db, getKV, setKV } from '../db';
import { resolveLanguage, setLocale } from '../i18n';
import type { Settings } from '../types';
import { setCalcContext } from './context';
import { setSoundConfig } from './sounds';
import { requestSync } from './sync';

/** Last settings read, so components mounted later (sheets, forms) start from them instead of the defaults. */
let cached: Partial<Settings> | undefined;

/** Puts the settings that plain functions depend on (language, time format, week start, 1RM formula) into effect. */
export function applySettings(s: Settings) {
  setCalcContext({ timeFormat: s.timeFormat, weekStart: s.weekStart, oneRmFormula: s.oneRmFormula });
  setSoundConfig({ sound: s.restSound, volume: s.soundVolume });
  return setLocale(resolveLanguage(s.language));
}

/** At startup, before the first render: reads the stored settings and applies them, so nothing flashes in the wrong language. */
export async function loadSettings() {
  cached = await getKV<Partial<Settings>>('settings');
  await applySettings({ ...DEFAULT_SETTINGS, ...cached });
}

export function useSettings(): Settings {
  const stored = useLiveQuery(
    async () => {
      cached = await getKV<Partial<Settings>>('settings');
      void applySettings({ ...DEFAULT_SETTINGS, ...cached });
      return cached;
    },
    [],
    cached,
  );
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function updateSettings(patch: Partial<Settings>) {
  await db.transaction('rw', db.kv, async () => {
    const current = (await getKV<Partial<Settings>>('settings')) ?? {};
    await setKV('settings', { ...current, ...patch });
  });
  requestSync();
}
