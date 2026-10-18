import { useLiveQuery } from 'dexie-react-hooks';
import { getKV, setKV } from '../db';

// Per-device state that isn't a setting: it is never synced or backed up, and
// "Erase all data" clears it with the rest of kv. Same idea as the collapsed
// folders and the dismissed install banner, with one prefix and one hook.

export interface Prefs {
  /** The first-run welcome has been shown (or skipped). */
  welcomeSeen: boolean;
  /** Epoch ms of the last backup file this device saved. */
  lastBackupAt: number;
  /** Don't remind about a backup before this time. */
  backupSnoozedUntil: number;
  /** The app version whose "What's new" was last shown. */
  lastSeenVersion: string;
  /** The month ("yyyy-mm") whose report Home offered and was opened or dismissed. */
  reportSeenMonth: string;
}

export const PREF_DEFAULTS: Prefs = { welcomeSeen: false, lastBackupAt: 0, backupSnoozedUntil: 0, lastSeenVersion: '', reportSeenMonth: '' };

const storageKey = (key: keyof Prefs) => `pref:${key}`;

export async function getPref<K extends keyof Prefs>(key: K): Promise<Prefs[K]> {
  return (await getKV<Prefs[K]>(storageKey(key))) ?? PREF_DEFAULTS[key];
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  return setKV(storageKey(key), value);
}

/** undefined while reading, then the stored value or the default. */
export function usePref<K extends keyof Prefs>(key: K): Prefs[K] | undefined {
  return useLiveQuery(() => getPref(key), [key]);
}
