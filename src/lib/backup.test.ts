import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, getKV, setKV } from '../db';
import type { Exercise, Routine, Workout } from '../types';
import { exportBackup, importBackup, parseBackup, wipeAllData } from './backup';

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

    expect(await importBackup(text)).toEqual({ workouts: 1, routines: 1, exercises: 1, skipped: 0 });
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

  it('leaves out damaged records and repairs what it safely can', () => {
    const file = {
      app: 'chalk',
      version: 1,
      exportedAt: '2026-10-04T18:00:00.000Z',
      workouts: [
        { ...workout, exercises: null },
        { ...workout, id: 'no-times', startTime: 'yesterday' },
        { ...workout, id: 'bad-set', exercises: [{ ...workout.exercises[0], sets: [{ id: 's9', type: 'normal', weight: '60', completed: true }] }] },
        {
          ...workout,
          id: 'repairable',
          title: 42,
          exerciseIds: ['stale'],
          exercises: [{ ...workout.exercises[0], sets: [{ id: 's1', type: 'mystery', weight: null, reps: 10, completed: true }] }],
        },
      ],
      routines: [routine, { ...routine, id: 'r2', exercises: 'none' }],
      exercises: [{ ...custom, equipment: 'hoverboard', secondaryMuscles: ['chest', 'elbows'] }, { ...custom, id: 'lib-y', source: 'library' }],
      bodyweight: [{ id: 'b1', date: T0, weight: -3, updatedAt: T0 }],
      settings: { weightUnit: 'stone', defaultRest: 120, platesKg: 'all of them', timerSound: false },
    };
    const b = parseBackup(JSON.stringify(file));
    expect(b.skipped).toBe(6);
    expect(b.exportedAt).toBe(Date.UTC(2026, 9, 4, 18));
    expect(b.workouts).toHaveLength(1);
    const [w] = b.workouts;
    expect(w.title).toBe('Workout');
    expect(w.exerciseIds).toEqual(['cus-1']);
    expect(w.exercises[0].sets[0]).toEqual({ id: 's1', type: 'normal', reps: 10, completed: true });
    expect(b.routines.map((r) => r.id)).toEqual(['r1']);
    expect(b.exercises).toEqual([{ ...custom, equipment: 'other', secondaryMuscles: ['chest'] }]);
    expect(b.settings).toEqual({ defaultRest: 120, timerSound: false });
  });

  it('keeps a single weigh-in per day after a restore', async () => {
    const day = new Date(2026, 8, 24).getTime();
    await db.bodyweight.bulkPut([
      { id: 'local-same-day', date: day, weight: 81, updatedAt: T0 },
      { id: 'local-other-day', date: day - 86_400_000, weight: 81.5, updatedAt: T0 },
    ]);
    await importBackup(
      JSON.stringify({
        app: 'chalk',
        workouts: [],
        bodyweight: [
          { id: 'old', date: day, weight: 80.2, updatedAt: T0 },
          { id: 'new', date: day, weight: 80, updatedAt: T0 + 1 },
        ],
      }),
    );
    const all = await db.bodyweight.orderBy('date').toArray();
    expect(all.map((b) => [b.id, b.weight])).toEqual([
      ['local-other-day', 81.5],
      ['new', 80],
    ]);
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
