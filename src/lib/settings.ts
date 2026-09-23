import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_SETTINGS, db, getKV, setKV } from '../db';
import type { Settings } from '../types';
import { requestSync } from './sync';

export function useSettings(): Settings {
  const stored = useLiveQuery(() => getKV<Partial<Settings>>('settings'), []);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function updateSettings(patch: Partial<Settings>) {
  await db.transaction('rw', db.kv, async () => {
    const current = (await getKV<Partial<Settings>>('settings')) ?? {};
    await setKV('settings', { ...current, ...patch });
  });
  requestSync();
}
