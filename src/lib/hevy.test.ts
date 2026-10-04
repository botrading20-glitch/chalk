import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import type { Exercise, Workout } from '../types';
import { toCsv } from './csv';
import { applyImport, parseHevyCsv, parseHevyDate, planHevyImport, toHevyCsv } from './hevy';

const HEADER = ['title', 'start_time', 'end_time', 'description', 'exercise_title', 'superset_id', 'exercise_notes', 'set_index', 'set_type', 'weight_kg', 'reps', 'distance_km', 'duration_seconds', 'rpe'];

const libraryPress: Exercise = {
  id: 'lib-press',
  name: 'Chest Press (Machine)',
  type: 'weight_reps',
  equipment: 'machine',
  primaryMuscle: 'chest',
  secondaryMuscles: [],
  instructions: [],
  images: [],
  source: 'library',
};

describe('parseHevyDate', () => {
  it('reads Hevy’s 24-hour and 12-hour formats, and ISO as a fallback', () => {
    expect(parseHevyDate('24 Sep 2026, 21:30')).toBe(new Date(2026, 8, 24, 21, 30).getTime());
    expect(parseHevyDate('5 Mar 2026, 9:05 pm')).toBe(new Date(2026, 2, 5, 21, 5).getTime());
    expect(parseHevyDate('5 Mar 2026, 12:10 am')).toBe(new Date(2026, 2, 5, 0, 10).getTime());
    expect(parseHevyDate('2026-03-05T10:00:00Z')).toBe(Date.UTC(2026, 2, 5, 10));
    expect(parseHevyDate('not a date')).toBeUndefined();
  });
});

describe('parseHevyCsv', () => {
  it('groups rows into workouts and splits a repeated exercise into separate blocks', () => {
    const csv = toCsv([
      HEADER,
      ['Chest day', '24 Sep 2026, 21:30', '24 Sep 2026, 22:40', 'Felt good', 'Chest Press (Machine)', undefined, 'Seat 4', 0, 'warmup', 30, 12, undefined, undefined, undefined],
      ['Chest day', '24 Sep 2026, 21:30', '24 Sep 2026, 22:40', 'Felt good', 'Chest Press (Machine)', undefined, 'Seat 4', 1, 'normal', 60, 10, undefined, undefined, 8.5],
      ['Chest day', '24 Sep 2026, 21:30', '24 Sep 2026, 22:40', 'Felt good', 'Cable Fly', 0, undefined, 0, 'failure', 15, 12, undefined, undefined, undefined],
      ['Chest day', '24 Sep 2026, 21:30', '24 Sep 2026, 22:40', 'Felt good', 'Chest Press (Machine)', undefined, undefined, 0, 'dropset', 40, 15, undefined, undefined, undefined],
      ['Leg day', '26 Sep 2026, 21:30', '26 Sep 2026, 22:30', undefined, 'Plank', undefined, undefined, 0, 'normal', undefined, undefined, undefined, 75, undefined],
    ]);
    const [chest, legs] = parseHevyCsv(csv);
    expect(chest.title).toBe('Chest day');
    expect(chest.description).toBe('Felt good');
    expect(chest.endTime - chest.startTime).toBe(70 * 60_000);
    expect(chest.exercises.map((e) => e.name)).toEqual(['Chest Press (Machine)', 'Cable Fly', 'Chest Press (Machine)']);
    expect(chest.exercises[0].notes).toBe('Seat 4');
    expect(chest.exercises[0].sets).toEqual([
      { type: 'warmup', weight: 30, reps: 12, distance: undefined, duration: undefined, rpe: undefined },
      { type: 'normal', weight: 60, reps: 10, distance: undefined, duration: undefined, rpe: 8.5 },
    ]);
    expect(chest.exercises[1].supersetId).toBe(0);
    expect(chest.exercises[2].sets[0].type).toBe('dropset');
    expect(legs.exercises[0].sets[0].duration).toBe(75);
  });

  it('converts imperial exports to kg and km', () => {
    const csv = toCsv([
      ['title', 'start_time', 'exercise_title', 'set_index', 'set_type', 'weight_lbs', 'reps', 'distance_miles', 'duration_seconds'],
      ['Mixed', '1 Oct 2026, 08:00', 'Leg Press', 0, 'normal', 225, 10, undefined, undefined],
      ['Mixed', '1 Oct 2026, 08:00', 'Treadmill', 0, 'normal', undefined, undefined, 1, 600],
    ]);
    const [w] = parseHevyCsv(csv);
    expect(w.exercises[0].sets[0].weight).toBeCloseTo(102.06, 2);
    expect(w.exercises[1].sets[0].distance).toBeCloseTo(1.609344, 6);
  });

  it('rejects a file that isn’t a Hevy workout export', () => {
    expect(() => parseHevyCsv('name,date\nx,y')).toThrow(/title/);
  });
});

describe('planHevyImport', () => {
  beforeEach(async () => {
    await Promise.all([db.exercises.clear(), db.workouts.clear()]);
    await db.exercises.put(libraryPress);
  });

  it('matches known exercises by name, creates the rest and skips workouts already imported', async () => {
    const csv = toCsv([
      HEADER,
      ['Chest day', '24 Sep 2026, 21:30', '24 Sep 2026, 22:40', '', 'chest press (machine)', undefined, '', 0, 'normal', 60, 10, undefined, undefined, undefined],
      ['Chest day', '24 Sep 2026, 21:30', '24 Sep 2026, 22:40', '', 'Rope Pushdown', undefined, '', 0, 'normal', 25, 12, undefined, undefined, undefined],
      ['Leg day', '26 Sep 2026, 21:30', '26 Sep 2026, 22:30', '', 'Treadmill Walk', undefined, '', 0, 'normal', undefined, undefined, 2.1, 900, undefined],
    ]);
    const plan = await planHevyImport(parseHevyCsv(csv));
    expect(plan.matchedExercises).toBe(1);
    expect(plan.newExercises.map((e) => [e.name, e.type, e.primaryMuscle, e.equipment])).toEqual([
      ['Rope Pushdown', 'weight_reps', 'triceps', 'cable'],
      ['Treadmill Walk', 'distance_duration', 'cardio', 'other'],
    ]);
    expect(plan.workouts[0].exercises[0].exerciseId).toBe('lib-press');
    expect(plan.workouts[0].exercises.every((we) => we.sets.every((s) => s.completed))).toBe(true);

    await applyImport(plan);
    const again = await planHevyImport(parseHevyCsv(csv));
    expect(again.duplicates).toBe(2);
    expect(again.workouts).toHaveLength(0);
  });
});

describe('toHevyCsv', () => {
  it('exports in a format the importer reads back', () => {
    const start = new Date(2026, 8, 24, 21, 30).getTime();
    const w: Workout = {
      id: 'w1',
      title: 'Chest, "heavy"',
      description: 'Notes',
      startTime: start,
      endTime: start + 3_600_000,
      exerciseIds: ['lib-press'],
      exercises: [
        {
          id: 'we1',
          exerciseId: 'lib-press',
          notes: 'Seat 4',
          sets: [
            { id: 's1', type: 'warmup', weight: 30, reps: 12, completed: true },
            { id: 's2', type: 'normal', weight: 61.234, reps: 10, rpe: 9, completed: true },
          ],
        },
      ],
    };
    const [back] = parseHevyCsv(toHevyCsv([w], new Map([['lib-press', libraryPress]])));
    expect(back.title).toBe(w.title);
    expect(back.startTime).toBe(start);
    expect(back.endTime).toBe(w.endTime);
    expect(back.exercises[0].name).toBe('Chest Press (Machine)');
    expect(back.exercises[0].notes).toBe('Seat 4');
    expect(back.exercises[0].sets.map((s) => [s.type, s.weight, s.reps, s.rpe])).toEqual([
      ['warmup', 30, 12, undefined],
      ['normal', 61.23, 10, 9],
    ]);
  });
});
