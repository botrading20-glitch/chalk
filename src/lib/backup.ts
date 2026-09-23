import { db, getKV, setKV } from '../db';
import type { Exercise, Routine, Settings, Workout } from '../types';

interface Backup {
  app: 'chalk';
  version: 1;
  exportedAt: string;
  settings?: Partial<Settings>;
  exercises: Exercise[];
  workouts: Workout[];
  routines: Routine[];
}

export async function exportBackup() {
  const backup: Backup = {
    app: 'chalk',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await getKV<Partial<Settings>>('settings'),
    // Library exercises ship with the app; only the user's own are needed.
    exercises: await db.exercises.where('source').equals('custom').toArray(),
    workouts: await db.workouts.toArray(),
    routines: await db.routines.toArray(),
  };
  return JSON.stringify(backup);
}

export async function importBackup(text: string) {
  let data: Backup;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON. Pick a backup exported from Chalk.");
  }
  if (data?.app !== 'chalk' || !Array.isArray(data.workouts)) {
    throw new Error("This file isn't a Chalk backup. Pick a file exported from Settings → Back up data.");
  }
  await db.transaction('rw', db.exercises, db.workouts, db.routines, db.kv, async () => {
    await db.exercises.bulkPut(data.exercises ?? []);
    await db.workouts.bulkPut(data.workouts);
    await db.routines.bulkPut(data.routines ?? []);
    if (data.settings) await setKV('settings', data.settings);
  });
  return { workouts: data.workouts.length, routines: data.routines?.length ?? 0, exercises: data.exercises?.length ?? 0 };
}

export async function wipeAllData() {
  await db.transaction('rw', db.workouts, db.routines, db.kv, db.exercises, async () => {
    await db.workouts.clear();
    await db.routines.clear();
    await db.exercises.where('source').equals('custom').delete();
    await db.kv.where('key').noneOf(['libraryVersion']).delete();
  });
}
