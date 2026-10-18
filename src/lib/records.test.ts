import { describe, expect, it } from 'vitest';
import type { Workout } from '../types';
import { liveRecordSets, newLiveRecords, recentRecords } from './records';
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

describe('liveRecordSets', () => {
  const history = [session(2, ['bench', 100, 5]), session(1, ['bench', 90, 5])];
  const { best } = computeRecords(history, typeOf);
  const live = (...sets: { weight: number; reps: number; type?: 'normal' | 'warmup'; completed?: boolean }[]) => [
    {
      id: 'b1',
      exerciseId: 'bench',
      sets: sets.map((s, i) => ({ id: `l${i}`, type: s.type ?? ('normal' as const), weight: s.weight, reps: s.reps, completed: s.completed ?? true })),
    },
  ];

  it('credits a checked set that beats the best from earlier workouts', () => {
    const map = liveRecordSets(live({ weight: 105, reps: 5 }), typeOf, best);
    expect(map.get('l0')).toEqual(['weight', 'e1rm', 'volume']);
  });

  it('does not count a tie, a lighter set, a warm-up or an unchecked set', () => {
    expect(liveRecordSets(live({ weight: 100, reps: 5 }), typeOf, best).size).toBe(0);
    expect(liveRecordSets(live({ weight: 80, reps: 5 }), typeOf, best).size).toBe(0);
    expect(liveRecordSets(live({ weight: 200, reps: 5, type: 'warmup' }), typeOf, best).size).toBe(0);
    expect(liveRecordSets(live({ weight: 200, reps: 5, completed: false }), typeOf, best).size).toBe(0);
  });

  it('treats an exercise with no history as its baseline', () => {
    const fresh = [{ id: 'b2', exerciseId: 'curl', sets: [{ id: 'c0', type: 'normal' as const, weight: 500, reps: 5, completed: true }] }];
    expect(liveRecordSets(fresh, typeOf, best).size).toBe(0);
  });

  it('gives the credit to the best set of the workout, and says which kinds a check just added', () => {
    const one = liveRecordSets(live({ weight: 105, reps: 5 }), typeOf, best);
    const two = liveRecordSets(live({ weight: 105, reps: 5 }, { weight: 110, reps: 5 }), typeOf, best);
    expect(two.get('l0')).toBeUndefined();
    expect(two.get('l1')).toEqual(['weight', 'e1rm', 'volume']);
    expect(newLiveRecords(one, two, 'l1')).toEqual(['weight', 'e1rm', 'volume']);
    // Checking the same set again adds nothing new.
    expect(newLiveRecords(two, two, 'l1')).toEqual([]);
  });

  it('adds up to the records the saved workout will show', () => {
    const sets = live({ weight: 105, reps: 5 }, { weight: 110, reps: 3 });
    const map = liveRecordSets(sets, typeOf, best);
    const saved: Workout = { id: 'w3', title: 'Today', startTime: 3 * 86_400_000, endTime: 3 * 86_400_000 + 1000, exerciseIds: ['bench'], exercises: sets };
    const total = [...map.values()].reduce((n, kinds) => n + kinds.length, 0);
    expect(computeRecords([...history, saved], typeOf).byWorkout.get('w3')).toBe(total);
  });
});
