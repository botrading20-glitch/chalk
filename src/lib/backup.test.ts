import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, DEFAULT_SETTINGS, getKV, setKV } from '../db';
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

  it('rejects files that aren’t Setward backups without writing anything', async () => {
    await expect(importBackup('{oops')).rejects.toThrow(/valid JSON/);
    await expect(importBackup(JSON.stringify({ app: 'other-app', workouts: [] }))).rejects.toThrow(/isn't a Setward backup/);
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

  it('keeps fields from a newer Setward it doesn’t know, but drops known fields that fail their check', () => {
    const newer = {
      ...workout,
      heartRate: 142,
      description: 42,
      exercises: [{ ...workout.exercises[0], tempo: '3-1-1', sets: [{ ...workout.exercises[0].sets[0], velocity: 0.8 }] }],
    };
    const [w] = parseBackup(JSON.stringify({ app: 'chalk', workouts: [newer] })).workouts as unknown as Record<string, unknown>[];
    expect(w.heartRate).toBe(142);
    expect('description' in w).toBe(false);
    expect(w.exercises).toEqual([{ ...workout.exercises[0], tempo: '3-1-1', sets: [{ ...workout.exercises[0].sets[0], velocity: 0.8 }] }]);
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

describe('new settings in a backup', () => {
  it('keeps valid values, drops invalid ones and clamps nothing silently', async () => {
    const { cleanSettings } = await import('./validate');
    const cleaned = cleanSettings({
      language: 'fr',
      timeFormat: '12h',
      weekStart: 'sun',
      oneRmFormula: 'brzycki',
      weeklyGoal: 4,
      warmupRest: -1,
      profileName: 'Sam',
      accent: 'teal',
      textSize: 'xlarge',
      reduceMotion: 'always',
      backupReminder: 'monthly',
      showRpe: false,
    });
    expect(cleaned).toEqual({
      language: 'fr',
      timeFormat: '12h',
      weekStart: 'sun',
      oneRmFormula: 'brzycki',
      weeklyGoal: 4,
      warmupRest: -1,
      profileName: 'Sam',
      accent: 'teal',
      textSize: 'xlarge',
      reduceMotion: 'always',
      backupReminder: 'monthly',
      showRpe: false,
    });
    expect(
      cleanSettings({ language: 'klingon', weeklyGoal: 12, newExerciseSets: 2.5, accent: 'red', profileName: 7, showRpe: 'yes', textSize: 'huge' }),
    ).toEqual({});
    expect(cleanSettings({ profileName: 'x'.repeat(100) })?.profileName).toHaveLength(40);
  });

  it('checks the warm-up steps as a whole and the rounding steps as fractions', async () => {
    const { cleanSettings, cleanWarmupSteps } = await import('./validate');
    const steps = [
      { percent: 40, reps: 8 },
      { percent: 80, reps: 3 },
    ];
    expect(cleanSettings({ warmupSteps: steps, warmupRoundKg: 1.25, warmupRoundLbs: 2.5, warmupEmptyBar: false, liveRecords: false, setVideos: false })).toEqual({
      warmupSteps: steps,
      warmupRoundKg: 1.25,
      warmupRoundLbs: 2.5,
      warmupEmptyBar: false,
      liveRecords: false,
      setVideos: false,
    });
    // One bad step drops the list so the defaults stay; so do an empty list and one that is too long.
    expect(cleanWarmupSteps([{ percent: 40, reps: 8 }, { percent: 100, reps: 3 }])).toBeUndefined();
    expect(cleanWarmupSteps([{ percent: 40.5, reps: 8 }])).toBeUndefined();
    expect(cleanWarmupSteps([{ percent: 40, reps: 0 }])).toBeUndefined();
    expect(cleanWarmupSteps([])).toBeUndefined();
    expect(cleanWarmupSteps(Array.from({ length: 7 }, () => ({ percent: 50, reps: 5 })))).toBeUndefined();
    expect(cleanWarmupSteps('50')).toBeUndefined();
    // A rounding step of zero would divide by zero in the calculator; a typo like 2500 is out of range.
    expect(cleanSettings({ warmupRoundKg: 0, warmupRoundLbs: 2500, warmupSteps: 'x', plateShortcut: 'yes' })).toEqual({});
    // The defaults themselves pass their own checks.
    expect(cleanWarmupSteps(DEFAULT_SETTINGS.warmupSteps)).toEqual(DEFAULT_SETTINGS.warmupSteps);
  });
});
