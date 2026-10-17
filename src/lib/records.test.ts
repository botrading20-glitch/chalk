import { describe, expect, it } from 'vitest';
import type { Workout } from '../types';
import { recentRecords } from './records';
import { computeRecords } from './stats';

let n = 0;
function session(day: number, ...lifts: [exerciseId: string, weight: number, reps: number][]): Workout {
  const startTime = day * 86_400_000;
  return {
    id: `w${day}`,
    title: `Day ${day}`,
    startTime,
    endTime: startTime + 3_600_000,
    exerciseIds: lifts.map(([id]) => id),
    exercises: lifts.map(([exerciseId, weight, reps]) => ({
      id: `e${++n}`,
      exerciseId,
      sets: [{ id: `s${++n}`, type: 'normal' as const, weight, reps, completed: true }],
    })),
  };
}

const typeOf = () => 'weight_reps' as const;

describe('recentRecords', () => {
  // Newest first, as DataProvider keeps them.
  const workouts = [
    session(4, ['bench', 100, 5], ['row', 60, 10]),
    session(3, ['bench', 90, 5], ['row', 60, 10]),
    session(2, ['bench', 90, 5]),
    session(1, ['bench', 80, 5], ['row', 50, 10]),
  ];
  const records = computeRecords(workouts, typeOf);

  it('lists the newest records first, leaving out the baseline session', () => {
    const list = recentRecords(workouts, records);
    // Day 3 only matched day 2's bench and day 4 only matched day 3's row, so neither is a record.
    expect(list.map((r) => `${r.workoutId}:${r.exerciseId}`)).toEqual(['w4:bench', 'w3:row', 'w2:bench']);
  });

  it('carries every kind broken with its new value', () => {
    const [bench] = recentRecords(workouts, records);
    expect(bench.items.map((i) => i.kind)).toEqual(['weight', 'e1rm', 'volume']);
    expect(bench.items.find((i) => i.kind === 'weight')!.value).toBe(100);
    expect(bench.items.find((i) => i.kind === 'volume')!.value).toBe(500);
  });

  it('stops at the limit and copes with no records', () => {
    expect(recentRecords(workouts, records, 1)).toHaveLength(1);
    expect(recentRecords([workouts[3]], computeRecords([workouts[3]], typeOf))).toEqual([]);
    expect(recentRecords([], computeRecords([], typeOf))).toEqual([]);
  });
});
