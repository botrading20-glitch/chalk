import Dexie, { type EntityTable } from 'dexie';
import type { BodyWeight, Exercise, Routine, Settings, Workout } from './types';

interface KV {
  key: string;
  value: unknown;
}

export const db = new Dexie('chalk') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  workouts: EntityTable<Workout, 'id'>;
  routines: EntityTable<Routine, 'id'>;
  bodyweight: EntityTable<BodyWeight, 'id'>;
  kv: EntityTable<KV, 'key'>;
};

db.version(1).stores({
  exercises: 'id, name, source, primaryMuscle, equipment',
  workouts: 'id, startTime, *exerciseIds',
  routines: 'id, order',
  kv: 'key',
});

db.version(2).stores({
  bodyweight: 'id, date',
});

/** Bump when src/data/exercises.json changes so existing installs pick it up. */
const LIBRARY_VERSION = 2;

export const DEFAULT_SETTINGS: Settings = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  defaultRest: 90,
  theme: 'dark',
  timerSound: true,
  timerLockScreen: true,
  timerVibrate: true,
  keepAwake: true,
};

export async function getKV<T>(key: string): Promise<T | undefined> {
  return (await db.kv.get(key))?.value as T | undefined;
}

export function setKV(key: string, value: unknown) {
  return db.kv.put({ key, value });
}

export async function ensureLibrary() {
  if ((await getKV<number>('libraryVersion')) === LIBRARY_VERSION) return;
  const { default: library } = await import('./data/exercises.json');
  const rows = (library as Omit<Exercise, 'source'>[]).map((x) => ({ ...x, source: 'library' as const }));
  await db.transaction('rw', db.exercises, db.kv, async () => {
    await db.exercises.bulkPut(rows);
    await setKV('libraryVersion', LIBRARY_VERSION);
  });
}

export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // Not supported: data still lives in IndexedDB, just without the eviction guarantee.
  }
}
