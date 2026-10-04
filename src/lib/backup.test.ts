import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, getKV, setKV } from '../db';
import type { Exercise, Routine, Workout } from '../types';
import { exportBackup, importBackup, wipeAllData } from './backup';

const T0 = new Date(2026, 8, 24, 21, 30).getTime();

const custom: Exercise = {
  id: 'cus-1',
  name: 'Seated Dip (Machine)',
  type: 'weight_reps',
  equipment: 'machine',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  instructions: [],
  images: [],
  source: 'custom',
};

const workout: Workout = {
  id: 'w1',
  title: 'Arms day',
  startTime: T0,
  endTime: T0 + 3_600_000,
  exerciseIds: ['cus-1'],
  exercises: [{ id: 'we1', exerciseId: 'cus-1', sets: [{ id: 's1', type: 'normal', weight: 60, reps: 10, completed: true }] }],
};

const routine: Routine = {
  id: 'r1',
  title: 'Arms day',
  folder: 'Split',
  order: 1,
  createdAt: T0,
  updatedAt: T0,
  exercises: [{ id: 'we1', exerciseId: 'cus-1', sets: [{ id: 's1', type: 'normal', completed: false }] }],
};

describe('backup', () => {
  beforeEach(async () => {
    await wipeAllData();
    await db.exercises.clear();
  });

  it('round-trips everything the user made', async () => {
    await db.exercises.bulkPut([custom, { ...custom, id: 'lib-x', name: 'Library one', source: 'library' }]);
    await db.workouts.put(workout);
    await db.routines.put(routine);
    await db.bodyweight.put({ id: 'b1', date: new Date(2026, 8, 24).getTime(), weight: 80, updatedAt: T0 });
    await setKV('settings', { weightUnit: 'lbs' });

    const text = await exportBackup();
    expect(JSON.parse(text).exercises).toHaveLength(1);

    await wipeAllData();
    expect(await db.workouts.count()).toBe(0);
    expect(await getKV('settings')).toBeUndefined();

    expect(await importBackup(text)).toEqual({ workouts: 1, routines: 1, exercises: 1 });
    expect(await db.workouts.get('w1')).toEqual(workout);
    expect(await db.routines.get('r1')).toEqual(routine);
    expect(await db.bodyweight.count()).toBe(1);
    expect(await getKV('settings')).toEqual({ weightUnit: 'lbs' });
  });

  it('restores backups from before body-weight tracking existed', async () => {
    const old = { app: 'chalk', version: 1, exportedAt: '2026-09-23T10:00:00Z', exercises: [custom], workouts: [workout], routines: [] };
    await importBackup(JSON.stringify(old));
    expect(await db.workouts.count()).toBe(1);
  });

  it('rejects files that aren’t Chalk backups without writing anything', async () => {
    await expect(importBackup('{oops')).rejects.toThrow(/valid JSON/);
    await expect(importBackup(JSON.stringify({ app: 'hevy', workouts: [] }))).rejects.toThrow(/isn't a Chalk backup/);
    expect(await db.workouts.count()).toBe(0);
  });

  it('keeps the exercise library and per-device keys out of a wipe', async () => {
    await db.exercises.bulkPut([custom, { ...custom, id: 'lib-x', source: 'library' }]);
    await setKV('libraryVersion', 2);
    await setKV('active', { id: 'a' });
    await wipeAllData();
    expect((await db.exercises.toArray()).map((e) => e.id)).toEqual(['lib-x']);
    expect(await getKV('libraryVersion')).toBe(2);
    expect(await getKV('active')).toBeUndefined();
  });
});
