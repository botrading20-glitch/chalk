import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_SETTINGS, db, getKV, setKV } from '../db';
import type { Settings } from '../types';
import { requestSync } from './sync';

/** Last settings read, so components mounted later (sheets, forms) start from them instead of the defaults. */
let cached: Partial<Settings> | undefined;

export function useSettings(): Settings {
  const stored = useLiveQuery(async () => (cached = await getKV<Partial<Settings>>('settings')), [], cached);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function updateSettings(patch: Partial<Settings>) {
  await db.transaction('rw', db.kv, async () => {
    const current = (await getKV<Partial<Settings>>('settings')) ?? {};
    await setKV('settings', { ...current, ...patch });
  });
  requestSync();
}
