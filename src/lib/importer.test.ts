import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import type { Exercise, Workout } from '../types';
import { escapeCell, toCsv, unescapeCell } from './csv';
import { parseSetwardCsv, toSetwardCsv } from './exportCsv';
import { applyImport, planImport, readWorkoutCsv } from './importer';
import { parseDuration, parseLocalDate, parseStrongCsv } from './strong';

const STRONG_HEADER = ['Date', 'Workout Name', 'Duration', 'Exercise Name', 'Set Order', 'Weight', 'Reps', 'Distance', 'Seconds', 'Notes', 'Workout Notes', 'RPE'];
const kg = { weightUnit: 'kg' as const };

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

describe('Strong dates and durations', () => {
  it('reads local dates with or without seconds, and ISO as a fallback', () => {
    expect(parseLocalDate('2026-09-24 21:30:12')).toBe(new Date(2026, 8, 24, 21, 30, 12).getTime());
    expect(parseLocalDate('2026-09-24 9:05')).toBe(new Date(2026, 8, 24, 9, 5).getTime());
    expect(parseLocalDate('2026-03-05T10:00:00Z')).toBe(Date.UTC(2026, 2, 5, 10));
    expect(parseLocalDate('not a date')).toBeUndefined();
  });

  it('reads "1h 3m", "45m", "1h", clock times and plain seconds', () => {
    expect(parseDuration('1h 3m')).toBe(63 * 60_000);
    expect(parseDuration('45m')).toBe(45 * 60_000);
    expect(parseDuration('1h')).toBe(3_600_000);
    expect(parseDuration('1:03:00')).toBe(63 * 60_000);
    expect(parseDuration('45:30')).toBe(45.5 * 60_000);
    expect(parseDuration('90')).toBe(90_000);
    expect(parseDuration('')).toBe(0);
  });
});

describe('parseStrongCsv', () => {
  const csv = toCsv([
    STRONG_HEADER,
    ['2026-09-24 21:30:00', 'Chest day', '1h 10m', 'Chest Press (Machine)', 'W', 30, 12, 0, 0, 'Seat 4', 'Felt good', undefined],
    ['2026-09-24 21:30:00', 'Chest day', '1h 10m', 'Chest Press (Machine)', 1, 60, 10, 0, 0, 'Seat 4', 'Felt good', 8.5],
    ['2026-09-24 21:30:00', 'Chest day', '1h 10m', 'Chest Press (Machine)', 'Rest Timer', 0, 0, 0, 90, '', '', undefined],
    ['2026-09-24 21:30:00', 'Chest day', '1h 10m', 'Cable Fly', 'F', 15, 12, 0, 0, '', '', undefined],
    ['2026-09-24 21:30:00', 'Chest day', '1h 10m', 'Chest Press (Machine)', 'D', 40, 15, 0, 0, '', '', undefined],
    ['2026-09-26 21:30:00', 'Leg day', '1h', 'Plank', 1, 0, 0, 0, 75, '', '', undefined],
    ['2026-09-26 21:30:00', 'Leg day', '1h', 'Treadmill', 1, 0, 0, 2000, 600, '', '', undefined],
  ]);

  it('groups rows into workouts, maps W/D/F, skips rest-timer rows and splits a repeated exercise', () => {
    const { workouts, needsWeightUnit } = parseStrongCsv(csv, kg);
    expect(needsWeightUnit).toBe(true);
    const [chest, legs] = workouts;
    expect(chest.title).toBe('Chest day');
    expect(chest.description).toBe('Felt good');
    expect(chest.endTime - chest.startTime).toBe(70 * 60_000);
    expect(chest.exercises.map((e) => e.name)).toEqual(['Chest Press (Machine)', 'Cable Fly', 'Chest Press (Machine)']);
    expect(chest.exercises[0].notes).toBe('Seat 4');
    expect(chest.exercises[0].sets).toEqual([
      { type: 'warmup', weight: 30, reps: 12, distance: undefined, duration: undefined, rpe: undefined },
      { type: 'normal', weight: 60, reps: 10, distance: undefined, duration: undefined, rpe: 8.5 },
    ]);
    expect(chest.exercises[1].sets[0].type).toBe('failure');
    expect(chest.exercises[2].sets[0].type).toBe('dropset');
    expect(legs.exercises[0].sets[0].duration).toBe(75);
    // Distance comes in meters.
    expect(legs.exercises[1].sets[0].distance).toBe(2);
  });

  it('applies the chosen unit when the file has none, and trusts a unit the file does carry', () => {
    const lbs = parseStrongCsv(csv, { weightUnit: 'lbs' }).workouts[0].exercises[0].sets[1].weight!;
    expect(lbs).toBeCloseTo(27.22, 2);

    const withColumn = toCsv([
      ['Date', 'Workout Name', 'Duration', 'Exercise Name', 'Set Order', 'Weight', 'Weight Unit', 'Reps', 'Distance', 'Distance Unit', 'Seconds'],
      ['2026-10-01 08:00:00', 'Mixed', '30m', 'Leg Press', 1, 225, 'lbs', 10, 0, 'mi', 0],
      ['2026-10-01 08:00:00', 'Mixed', '30m', 'Row', 1, 0, 'lbs', 0, 1, 'mi', 600],
    ]);
    const result = parseStrongCsv(withColumn, kg);
    expect(result.needsWeightUnit).toBe(false);
    expect(result.workouts[0].exercises[0].sets[0].weight).toBeCloseTo(102.06, 2);
    expect(result.workouts[0].exercises[1].sets[0].distance).toBeCloseTo(1.609344, 6);

    const inHeader = toCsv([
      ['Date', 'Workout Name', 'Exercise Name', 'Set Order', 'Weight (lbs)', 'Reps'],
      ['2026-10-01 08:00:00', 'Mixed', 'Leg Press', 1, 225, 10],
    ]);
    expect(parseStrongCsv(inHeader, kg).needsWeightUnit).toBe(false);
    expect(parseStrongCsv(inHeader, kg).workouts[0].exercises[0].sets[0].weight).toBeCloseTo(102.06, 2);
  });

  it('reads a semicolon-separated file with decimal commas', () => {
    const text = [
      'Date;Workout Name;Duration;Exercise Name;Set Order;Weight (kg);Reps',
      '2026-10-02 18:00:00;Push;50m;Bench Press;1;62,5;8',
      '2026-10-02 18:00:00;Push;50m;Bench Press;2;62,5;7',
    ].join('\n');
    const [w] = parseStrongCsv(text, kg).workouts;
    expect(w.exercises).toHaveLength(1);
    expect(w.exercises[0].sets.map((s) => [s.weight, s.reps])).toEqual([[62.5, 8], [62.5, 7]]);
  });

  it('rejects a file that is not a Strong export', () => {
    expect(() => parseStrongCsv('name,date\nx,y', kg)).toThrow(/Strong/);
  });
});

describe('readWorkoutCsv', () => {
  it('tells Strong and Setward files apart and refuses anything else', () => {
    const strong = toCsv([STRONG_HEADER, ['2026-09-24 21:30:00', 'A', '1h', 'Squat', 1, 100, 5, 0, 0, '', '', undefined]]);
    expect(readWorkoutCsv(strong, kg).format).toBe('strong');
    expect(readWorkoutCsv(toSetwardCsv([], new Map()), kg)).toEqual({ format: 'setward', workouts: [], needsWeightUnit: false });
    expect(() => readWorkoutCsv('title,start_time,exercise_title\na,b,c', kg)).toThrow(/read this file/);
  });
});

describe('planImport', () => {
  beforeEach(async () => {
    await Promise.all([db.exercises.clear(), db.workouts.clear()]);
    await db.exercises.put(libraryPress);
  });

  it('matches known exercises by name, creates the rest and skips workouts already imported', async () => {
    const csv = toCsv([
      STRONG_HEADER,
      ['2026-09-24 21:30:00', 'Chest day', '1h 10m', 'chest press (machine)', 1, 60, 10, 0, 0, '', '', undefined],
      ['2026-09-24 21:30:00', 'Chest day', '1h 10m', 'Rope Pushdown', 1, 25, 12, 0, 0, '', '', undefined],
      ['2026-09-26 21:30:00', 'Leg day', '1h', 'Treadmill Walk', 1, 0, 0, 2100, 900, '', '', undefined],
    ]);
    const plan = await planImport(parseStrongCsv(csv, kg).workouts);
    expect(plan.matchedExercises).toBe(1);
    expect(plan.newExercises.map((e) => [e.name, e.type, e.primaryMuscle, e.equipment])).toEqual([
      ['Rope Pushdown', 'weight_reps', 'triceps', 'cable'],
      ['Treadmill Walk', 'distance_duration', 'cardio', 'other'],
    ]);
    expect(plan.workouts[0].exercises[0].exerciseId).toBe('lib-press');
    expect(plan.workouts[0].exercises.every((we) => we.sets.every((s) => s.completed))).toBe(true);

    await applyImport(plan);
    const again = await planImport(parseStrongCsv(csv, kg).workouts);
    expect(again.duplicates).toBe(2);
    expect(again.workouts).toHaveLength(0);
  });
});

describe('Setward CSV', () => {
  const start = new Date(2026, 8, 24, 21, 30, 12).getTime();
  const workout = (): Workout => ({
    id: 'w1',
    title: 'Chest, "heavy"',
    description: 'Notes',
    startTime: start + 345, // stored with milliseconds
    endTime: start + 3_600_000,
    exerciseIds: ['lib-press'],
    exercises: [
      {
        id: 'we1',
        exerciseId: 'lib-press',
        notes: 'Seat 4',
        supersetId: 0,
        sets: [
          { id: 's1', type: 'warmup', weight: 30, reps: 12, completed: true },
          { id: 's2', type: 'normal', weight: 61.234, reps: 10, rpe: 9, completed: true },
        ],
      },
      { id: 'we2', exerciseId: 'lib-press', sets: [{ id: 's3', type: 'dropset', weight: 40, reps: 15, completed: true }] },
    ],
  });
  const names = new Map([['lib-press', libraryPress]]);

  it('reads back what it wrote: units, set types, notes, supersets and repeated exercises', () => {
    const [back] = parseSetwardCsv(toSetwardCsv([workout()], names));
    expect(back.title).toBe('Chest, "heavy"');
    expect(back.description).toBe('Notes');
    expect(back.startTime).toBe(start);
    expect(back.endTime).toBe(start + 3_600_000);
    expect(back.exercises.map((e) => e.name)).toEqual(['Chest Press (Machine)', 'Chest Press (Machine)']);
    expect(back.exercises[0].notes).toBe('Seat 4');
    expect(back.exercises[0].supersetId).toBe(0);
    expect(back.exercises[0].sets.map((s) => [s.type, s.weight, s.reps, s.rpe])).toEqual([
      ['warmup', 30, 12, undefined],
      ['normal', 61.234, 10, 9],
    ]);
    expect(back.exercises[1].sets[0].type).toBe('dropset');
  });

  it('names the stored unit in each column', () => {
    const [header, row] = toSetwardCsv([workout()], names).split('\n');
    expect(header.split(',')).toContain('"weight_kg"');
    expect(header.split(',')).toContain('"distance_km"');
    expect(header.split(',')).toContain('"duration_s"');
    expect(row).toContain('"2026-09-24 21:30:12"');
  });

  it('keeps text that looks like a formula as text in the file and restores it on import', () => {
    const tricky = ['=SUM(A1)', '-5 kg drop', '+1 set', '@home', "'=quoted", "''=double", "'plain", 'Leg day'];
    const w = { ...workout(), title: tricky[0], description: tricky[1] };
    w.exercises = [{ ...w.exercises[0], notes: tricky[3] }, w.exercises[1]];
    const csv = toSetwardCsv([w], names);
    // Spreadsheets run a cell that starts with = + - @, so each one has an apostrophe in front.
    expect(csv).toContain(`"'=SUM(A1)"`);
    expect(csv).toContain(`"'-5 kg drop"`);
    expect(csv).not.toContain('"=SUM(A1)"');
    const [back] = parseSetwardCsv(csv);
    expect(back.title).toBe('=SUM(A1)');
    expect(back.description).toBe('-5 kg drop');
    expect(back.exercises[0].notes).toBe('@home');
    // The mapping is invertible for every case, including text that already starts with apostrophes.
    for (const text of tricky) expect(unescapeCell(escapeCell(text))).toBe(text);
    expect(escapeCell("'plain")).toBe("'plain");
    expect(escapeCell("'=quoted")).toBe("''=quoted");
    // Numbers are not text: a negative number stays a plain number.
    expect(toCsv([[-5, 'x']])).toBe('-5,"x"');
  });

  it('importing its own export again adds nothing', async () => {
    await Promise.all([db.exercises.clear(), db.workouts.clear()]);
    await db.exercises.put(libraryPress);
    await db.workouts.put(workout());
    const plan = await planImport(readWorkoutCsv(toSetwardCsv([workout()], names), kg).workouts);
    expect(plan.duplicates).toBe(1);
    expect(plan.workouts).toHaveLength(0);
  });
});
