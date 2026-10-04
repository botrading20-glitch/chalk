import { db, getKV, setKV } from '../db';
import type { BodyWeight, Exercise, Routine, Settings, Workout } from '../types';
import { cleanAll, cleanBodyWeight, cleanExercise, cleanRoutine, cleanSettings, cleanWorkout } from './validate';

interface Backup {
  app: 'chalk';
  version: 1;
  exportedAt: string;
  settings?: Partial<Settings>;
  exercises: Exercise[];
  workouts: Workout[];
  routines: Routine[];
  bodyweight?: BodyWeight[];
}

/** A backup file that has been read and checked, ready to restore. */
export interface ParsedBackup {
  exportedAt?: number;
  settings?: Partial<Settings>;
  exercises: Exercise[];
  workouts: Workout[];
  routines: Routine[];
  bodyweight: BodyWeight[];
  /** Records in the file too damaged to restore; they are left out. */
  skipped: number;
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
    bodyweight: await db.bodyweight.toArray(),
  };
  return JSON.stringify(backup);
}

/** Reads and checks a backup file without touching the database. */
export function parseBackup(text: string): ParsedBackup {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON. Pick a backup exported from Chalk.");
  }
  if (data?.app !== 'chalk' || !Array.isArray(data.workouts)) {
    throw new Error("This file isn't a Chalk backup. Pick a file exported from Settings → Back up data.");
  }
  const workouts = cleanAll(data.workouts, cleanWorkout);
  const routines = cleanAll(data.routines, cleanRoutine);
  const exercises = cleanAll(data.exercises, cleanExercise);
  const bodyweight = cleanAll(data.bodyweight, cleanBodyWeight);
  const exportedAt = typeof data.exportedAt === 'string' ? Date.parse(data.exportedAt) : NaN;
  const settings = cleanSettings(data.settings);
  return {
    exportedAt: Number.isNaN(exportedAt) ? undefined : exportedAt,
    settings: settings && Object.keys(settings).length ? settings : undefined,
    workouts: workouts.items,
    routines: routines.items,
    exercises: exercises.items,
    bodyweight: bodyweight.items,
    skipped: workouts.skipped + routines.skipped + exercises.skipped + bodyweight.skipped,
  };
}

/**
 * Writes a checked backup over the local data. Records with the same id are
 * replaced; nothing else is deleted, except a weigh-in on a day the backup also
 * has one for, so each day keeps a single weigh-in.
 */
export async function restoreBackup(b: ParsedBackup) {
  // Within the file, the latest weigh-in of a day wins.
  const byDay = new Map<number, BodyWeight>();
  for (const w of b.bodyweight) {
    const prev = byDay.get(w.date);
    if (!prev || w.updatedAt >= prev.updatedAt) byDay.set(w.date, w);
  }
  const weighIns = [...byDay.values()];

  await db.transaction('rw', db.exercises, db.workouts, db.routines, db.bodyweight, db.kv, async () => {
    await db.exercises.bulkPut(b.exercises);
    await db.workouts.bulkPut(b.workouts);
    await db.routines.bulkPut(b.routines);
    const keep = new Set(weighIns.map((w) => w.id));
    const sameDay = await db.bodyweight.where('date').anyOf([...byDay.keys()]).toArray();
    await db.bodyweight.bulkDelete(sameDay.filter((w) => !keep.has(w.id)).map((w) => w.id));
    await db.bodyweight.bulkPut(weighIns);
    if (b.settings) await setKV('settings', b.settings);
  });
}

export async function importBackup(text: string) {
  const parsed = parseBackup(text);
  await restoreBackup(parsed);
  return { workouts: parsed.workouts.length, routines: parsed.routines.length, exercises: parsed.exercises.length, skipped: parsed.skipped };
}

export async function wipeAllData() {
  await db.transaction('rw', db.workouts, db.routines, db.bodyweight, db.kv, db.exercises, async () => {
    await db.workouts.clear();
    await db.routines.clear();
    await db.bodyweight.clear();
    await db.exercises.where('source').equals('custom').delete();
    await db.kv.where('key').noneOf(['libraryVersion']).delete();
  });
}
