import { describe, expect, it } from 'vitest';
import type { ExerciseType, Workout, WorkoutSet } from '../types';
import { addDays, startOfWeek } from './format';
import { bestSet, computeRecords, e1rm, sessionMetric, weekStreak, weeklyBuckets, workoutVolume, type TypeOf } from './stats';

let n = 0;
const set = (weight: number | undefined, reps: number | undefined, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: `s${++n}`,
  type: 'normal',
  weight,
  reps,
  completed: true,
  ...extra,
});

const workout = (id: string, startTime: number, blocks: [string, WorkoutSet[]][]): Workout => ({
  id,
  title: id,
  startTime,
  endTime: startTime + 3_600_000,
  exercises: blocks.map(([exerciseId, sets], i) => ({ id: `${id}-${i}`, exerciseId, sets })),
  exerciseIds: [...new Set(blocks.map(([exerciseId]) => exerciseId))],
});

const types: Record<string, ExerciseType> = { press: 'weight_reps', pullup: 'bodyweight_reps', plank: 'duration' };
const typeOf: TypeOf = (id) => types[id] ?? 'weight_reps';
const DAY = 86_400_000;
const T0 = new Date(2026, 5, 1, 21, 30).getTime();

describe('e1rm', () => {
  it('uses Epley and returns the weight itself for a single', () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 2);
    expect(e1rm(0, 5)).toBe(0);
    expect(e1rm(80, 0)).toBe(0);
  });
});

describe('computeRecords', () => {
  it('treats the first session as the baseline', () => {
    const r = computeRecords([workout('a', T0, [['press', [set(60, 10)]]])], typeOf);
    expect(r.byWorkout.get('a')).toBe(0);
    expect(r.bySet.size).toBe(0);
    expect(r.best.get('press')?.weight?.value).toBe(60);
  });

  it('flags each kind a later session beats', () => {
    const heavier = set(65, 8);
    const r = computeRecords(
      [workout('b', T0 + DAY, [['press', [set(60, 8), heavier]]]), workout('a', T0, [['press', [set(60, 10)]]])],
      typeOf,
    );
    // 65 × 8: heavier (65 > 60), e1RM 82.3 > 80, but volume 520 < 600.
    expect(r.bySet.get(heavier.id)).toEqual(['weight', 'e1rm']);
    expect(r.byWorkout.get('b')).toBe(2);
    expect(r.best.get('press')?.weight?.workoutId).toBe('b');
    expect(r.best.get('press')?.volume?.workoutId).toBe('a');
  });

  it('ignores warm-ups, unchecked sets and ties', () => {
    const r = computeRecords(
      [
        workout('a', T0, [['press', [set(60, 10)]]]),
        workout('b', T0 + DAY, [['press', [set(100, 10, { type: 'warmup' }), set(100, 10, { completed: false }), set(60, 10)]]]),
      ],
      typeOf,
    );
    expect(r.byWorkout.get('b')).toBe(0);
  });

  it('counts only the best set of a session once per kind', () => {
    const r = computeRecords(
      [workout('a', T0, [['press', [set(60, 10)]]]), workout('b', T0 + DAY, [['press', [set(62.5, 10), set(65, 10)]]])],
      typeOf,
    );
    expect(r.byWorkout.get('b')).toBe(3);
    expect([...r.bySet.keys()]).toHaveLength(1);
  });

  it('tracks reps for bodyweight and time for duration exercises', () => {
    const r = computeRecords(
      [
        workout('a', T0, [['pullup', [set(undefined, 8)]], ['plank', [set(undefined, undefined, { duration: 60 })]]]),
        workout('b', T0 + DAY, [['pullup', [set(undefined, 9)]], ['plank', [set(undefined, undefined, { duration: 75 })]]]),
      ],
      typeOf,
    );
    expect(r.byWorkout.get('b')).toBe(2);
    expect(r.best.get('pullup')?.reps?.value).toBe(9);
    expect(r.best.get('plank')?.duration?.value).toBe(75);
  });
});

describe('session metrics', () => {
  it('leaves warm-ups out of best-set metrics but not out of session volume', () => {
    const sets = [set(100, 5, { type: 'warmup' }), set(60, 10)];
    expect(sessionMetric('heaviest', sets)).toBe(60);
    expect(sessionMetric('sessionVolume', sets)).toBe(1100);
    expect(bestSet(sets, 'weight_reps')?.weight).toBe(60);
  });

  it('counts volume only for exercise types that carry load', () => {
    const w = workout('a', T0, [['press', [set(50, 10)]], ['pullup', [set(20, 10)]]]);
    expect(workoutVolume(w, typeOf)).toBe(500);
  });
});

describe('weekly aggregates', () => {
  it('puts each workout in its Monday-to-Sunday week', () => {
    const now = new Date(2026, 2, 31, 12).getTime(); // the Tuesday after Europe's spring clock change
    const thisWeek = startOfWeek(now);
    const ws = [
      workout('mon', thisWeek + 9 * 3_600_000, [['press', [set(50, 10)]]]),
      workout('sun-before', addDays(thisWeek, -1) + 22 * 3_600_000, [['press', [set(50, 10)]]]),
      workout('two-weeks', addDays(thisWeek, -14) + 3_600_000, [['press', [set(50, 10)]]]),
    ];
    const buckets = weeklyBuckets(ws, typeOf, 4, now);
    expect(buckets.map((b) => b.workouts)).toEqual([0, 1, 1, 1]);
    expect(buckets[3].volume).toBe(500);
    expect(buckets[3].duration).toBe(3600);
  });

  it('counts the streak back from this week, or from last week when this one is empty', () => {
    const now = new Date(2026, 9, 7, 12).getTime();
    const week = (k: number) => addDays(startOfWeek(now), -7 * k) + 3_600_000;
    const w = (k: number) => workout(`w${k}`, week(k), [['press', [set(50, 10)]]]);
    expect(weekStreak([w(0), w(1), w(2), w(4)], now)).toBe(3);
    expect(weekStreak([w(1), w(2)], now)).toBe(2);
    expect(weekStreak([w(2)], now)).toBe(0);
  });
});
