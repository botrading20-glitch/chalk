import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, getKV, setKV } from '../db';
import type { ActiveWorkout, Exercise, Routine, Workout } from '../types';
import { wipeAllData } from './backup';
import { logBodyWeight } from './bodyweight';
import { checkData, deleteIssue, describeRecord, inspectRecord, inspectSettings, repairIssue } from './dataCheck';
import { toCsv } from './csv';
import { applyImport, planImport } from './importer';
import { parseStrongCsv } from './strong';
import { computeRecords, typeLookup } from './stats';
import { saveRoutine, templateFrom, workoutFromDraft } from './workouts';

const T0 = new Date(2026, 8, 24, 21, 30).getTime();

const exercise = (over: Partial<Exercise> = {}): Exercise => ({
  id: 'cus-1',
  name: 'Seated Dip (Machine)',
  type: 'weight_reps',
  equipment: 'machine',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  instructions: [],
  images: [],
  source: 'custom',
  ...over,
});

const workout = (over: Record<string, unknown> = {}) =>
  ({
    id: 'w1',
    title: 'Arms day',
    startTime: T0,
    endTime: T0 + 3_600_000,
    exerciseIds: ['cus-1'],
    exercises: [{ id: 'we1', exerciseId: 'cus-1', sets: [{ id: 's1', type: 'normal', weight: 60, reps: 10, completed: true }] }],
    ...over,
  }) as unknown as Workout;

const routine = (over: Partial<Routine> = {}): Routine => ({
  id: 'r1',
  title: 'Arms day',
  order: 1,
  createdAt: T0,
  updatedAt: T0,
  exercises: [{ id: 'we1', exerciseId: 'cus-1', sets: [{ id: 's1', type: 'normal', completed: false }] }],
  ...over,
});

/** Writes a record the way a damaged sync would: no shape checks at all. */
const put = (table: 'workouts' | 'routines' | 'exercises' | 'bodyweight', row: unknown) => (db[table] as unknown as { put(r: unknown): Promise<unknown> }).put(row);

beforeEach(async () => {
  await wipeAllData();
  await db.exercises.clear();
});

describe('records the app writes itself are healthy', () => {
  it('a finished workout with explicit undefined fields', async () => {
    const draft: ActiveWorkout = {
      id: 'draft-1',
      title: 'Push',
      startTime: T0,
      endTime: T0 + 3_000_000,
      exercises: [
        { id: 'we1', exerciseId: 'lib-press', sets: [{ id: 's1', type: 'normal', weight: 60, reps: 10, rpe: undefined, completed: true }] },
        { id: 'we2', exerciseId: 'lib-fly', notes: undefined, supersetId: undefined, sets: [{ id: 's2', type: 'warmup', weight: 15, reps: 12, completed: true }] },
      ],
    };
    const finished = workoutFromDraft(draft, false);
    expect(finished.description).toBeUndefined();
    await db.workouts.put(finished);
    expect((await checkData()).issues).toEqual([]);
  });

  it('a routine saved from a workout', async () => {
    await saveRoutine({ id: 'r1', title: 'Push', exercises: templateFrom(workout().exercises) });
    await saveRoutine({ id: 'r2', title: 'Pull', folder: 'Split', exercises: [] });
    const { counts, issues } = await checkData();
    expect(issues).toEqual([]);
    expect(counts.routines).toBe(2);
  });

  it('a custom exercise, an import and a weigh-in', async () => {
    await db.exercises.put(exercise());
    const csv = toCsv([
      ['Date', 'Workout Name', 'Duration', 'Exercise Name', 'Set Order', 'Weight', 'Reps', 'Distance', 'Seconds'],
      ['2026-09-24 21:30:00', 'Chest day', '1h 10m', 'Rope Pushdown', 1, 25, 12, 0, 0],
      ['2026-09-26 21:30:00', 'Leg day', '1h', 'Treadmill Walk', 1, 0, 0, 2100, 900],
    ]);
    await applyImport(await planImport(parseStrongCsv(csv, { weightUnit: 'kg' }).workouts));
    await logBodyWeight(T0, 81.4);
    const { counts, issues } = await checkData();
    expect(issues).toEqual([]);
    expect(counts).toEqual({ workouts: 2, routines: 0, exercises: 3, bodyweight: 1, settings: 0 });
  });

  it('exerciseIds in another order, and fields from a newer version', () => {
    const w = workout({
      exerciseIds: ['b', 'a', 'a'],
      futureField: { nested: [1, 2] },
      exercises: [
        { id: 'we1', exerciseId: 'a', tag: 'x', sets: [{ id: 's1', type: 'normal', weight: 1, tempo: '3-1-1', completed: true }] },
        { id: 'we2', exerciseId: 'b', sets: [] },
      ],
    });
    expect(inspectRecord('workouts', w)).toBeNull();
  });

  it('well-formed settings, including keys this version does not know', async () => {
    await setKV('settings', { weightUnit: 'lbs', platesKg: [20, 10], plateBars: { a: 20 }, newerSetting: { x: 1 } });
    expect((await checkData()).issues).toEqual([]);
    expect(inspectSettings({})).toBeNull();
  });

  it('the exercise library is not checked', async () => {
    await db.exercises.put(exercise({ id: 'lib-odd', name: '', type: 'bogus' as never, source: 'library' }));
    const { counts, issues } = await checkData();
    expect(issues).toEqual([]);
    expect(counts.exercises).toBe(0);
  });
});

describe('finding problems', () => {
  it('a workout that cannot be read crashes the records, and the check names it', async () => {
    const broken = workout({ exercises: null });
    expect(() => computeRecords([broken], typeLookup([]))).toThrow();
    await put('workouts', broken);
    const { issues } = await checkData();
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ kind: 'workouts', key: 'w1', status: 'damaged', fields: [] });
    expect(issues[0].label).toContain('Arms day');
  });

  it('what Setward can derive is repairable, and says what changes', () => {
    expect(inspectRecord('workouts', workout({ exerciseIds: undefined }))).toMatchObject({ status: 'repairable', fields: ['exercise list'] });
    expect(inspectRecord('workouts', workout({ exerciseIds: ['cus-1', 'gone'] }))).toMatchObject({ status: 'repairable', fields: ['exercise list'] });
    expect(inspectRecord('workouts', workout({ endTime: T0 - 1 }))).toMatchObject({ status: 'repairable', fields: ['end time'] });
    expect(inspectRecord('exercises', exercise({ type: 'bogus' as never }))).toMatchObject({ status: 'repairable', fields: ['type'] });
    expect(inspectRecord('exercises', exercise({ source: 'weird' as never }))).toMatchObject({ status: 'repairable', fields: ['source'] });
    expect(inspectRecord('routines', { ...routine(), createdAt: undefined })).toMatchObject({ status: 'repairable', fields: ['created time'] });
  });

  it('the null that JSON writes in place of NaN is repairable', () => {
    const w = workout({ exercises: [{ id: 'we1', exerciseId: 'cus-1', sets: [{ id: 's1', type: 'normal', weight: null, reps: 10, completed: true }] }] });
    expect(inspectRecord('workouts', w)).toMatchObject({ status: 'repairable', fields: ['exercises and sets'] });
  });

  it('identity or structure that is broken can only be deleted', () => {
    expect(inspectRecord('routines', { ...routine(), title: undefined })).toMatchObject({ status: 'damaged', label: 'Untitled routine' });
    expect(inspectRecord('bodyweight', { id: 'b1', date: T0, weight: 0, updatedAt: T0 })).toMatchObject({ status: 'damaged' });
    expect(inspectRecord('exercises', exercise({ name: '  ' }))).toMatchObject({ status: 'damaged', label: 'Unnamed exercise' });
    expect(inspectRecord('workouts', workout({ id: 42 }))).toMatchObject({ status: 'damaged', key: 42 });
    expect(inspectRecord('workouts', workout({ startTime: 'yesterday' }))).toMatchObject({ status: 'damaged' });
    expect(inspectRecord('workouts', workout({ exercises: [{ id: 'we1', exerciseId: 'cus-1', sets: [{ id: 's1', weight: 'heavy' }] }] }))).toMatchObject({ status: 'damaged' });
  });

  it('settings that fail their check, and settings that are not an object', () => {
    expect(inspectSettings({ weightUnit: 'lbs', platesKg: 'x', theme: 'neon' })).toMatchObject({ kind: 'settings', status: 'repairable', fields: expect.arrayContaining(['kg plates', 'theme']) });
    expect(inspectSettings('oops')).toMatchObject({ status: 'repairable', fields: ['settings'] });
    expect(inspectSettings(null)).toMatchObject({ status: 'repairable', fields: ['settings'] });
  });

  it('exercises say where they are still used', async () => {
    await put('exercises', exercise({ name: '' }));
    await put('workouts', workout());
    await put('routines', routine());
    const { issues } = await checkData();
    expect(issues).toHaveLength(1);
    expect(issues[0].usedBy).toBe('1 workout and 1 routine');
  });

  it('describeRecord shortens a long record', () => {
    expect(describeRecord({ a: 1 })).toBe('{\n  "a": 1\n}');
    const long = describeRecord({ text: 'x'.repeat(5000) });
    expect(long.length).toBeLessThan(1600);
    expect(long).toContain('more characters');
  });
});

describe('repairing and deleting', () => {
  it('repair writes the cleaned record, keeps unknown fields, and leaves nothing to find', async () => {
    await put('workouts', workout({ exerciseIds: undefined, futureField: 'keep me' }));
    const [issue] = (await checkData()).issues;
    expect(await repairIssue(issue)).toBe('done');
    const stored = (await db.workouts.get('w1')) as unknown as Record<string, unknown>;
    expect(stored.exerciseIds).toEqual(['cus-1']);
    expect(stored.futureField).toBe('keep me');
    expect((await checkData()).issues).toEqual([]);
  });

  it('a repaired routine counts as an edit', async () => {
    await put('routines', { ...routine(), order: 'first' });
    const [issue] = (await checkData()).issues;
    expect(issue.fields).toEqual(['order']);
    await repairIssue(issue);
    const stored = (await db.routines.get('r1'))!;
    expect(stored.order).toBe(0);
    expect(stored.updatedAt).toBeGreaterThan(T0);
    expect(stored.title).toBe('Arms day');
  });

  it('delete removes only the damaged record it was asked for', async () => {
    await put('workouts', workout({ id: 'bad1', exercises: null }));
    await put('workouts', workout({ id: 'bad2', exercises: null }));
    await put('workouts', workout({ id: 'good' }));
    const { issues } = await checkData();
    expect(issues).toHaveLength(2);
    expect(await deleteIssue(issues.find((i) => i.key === 'bad1')!)).toBe('done');
    expect((await db.workouts.toArray()).map((w) => w.id).sort()).toEqual(['bad2', 'good']);
  });

  it('delete never removes a record that can be repaired, or one that was fixed in the meantime', async () => {
    await put('workouts', workout({ exerciseIds: undefined }));
    const [repairable] = (await checkData()).issues;
    expect(await deleteIssue(repairable)).toBe('stale');
    expect(await db.workouts.get('w1')).toBeTruthy();

    await put('workouts', workout({ id: 'w2', exercises: null }));
    const damaged = (await checkData()).issues.find((i) => i.key === 'w2')!;
    await put('workouts', workout({ id: 'w2' })); // a sync replaced it with a healthy copy
    expect(await deleteIssue(damaged)).toBe('stale');
    expect(await db.workouts.get('w2')).toBeTruthy();
  });

  it('repair does nothing when the record is already gone or healthy', async () => {
    await put('workouts', workout({ exerciseIds: undefined }));
    const [issue] = (await checkData()).issues;
    await db.workouts.delete('w1');
    expect(await repairIssue(issue)).toBe('stale');
    expect(await db.workouts.count()).toBe(0);
  });

  it('a damaged record with a number for a key can be deleted', async () => {
    await put('workouts', workout({ id: 42 }));
    const [issue] = (await checkData()).issues;
    expect(await deleteIssue(issue)).toBe('done');
    expect(await db.workouts.count()).toBe(0);
  });

  it('settings repair drops only the settings that failed', async () => {
    await setKV('settings', { weightUnit: 'lbs', platesKg: 'x', newerSetting: 7 });
    const { issues } = await checkData();
    expect(issues).toHaveLength(1);
    expect(await repairIssue(issues[0])).toBe('done');
    expect(await getKV('settings')).toEqual({ weightUnit: 'lbs', newerSetting: 7 });
    expect((await checkData()).issues).toEqual([]);
    expect(await deleteIssue(issues[0])).toBe('stale');
  });

  it('settings that are not an object become empty', async () => {
    await setKV('settings', 'oops');
    const [issue] = (await checkData()).issues;
    await repairIssue(issue);
    expect(await getKV('settings')).toEqual({});
  });
});
