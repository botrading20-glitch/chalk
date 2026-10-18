import { describe, expect, it } from 'vitest';
import type { Exercise, Workout } from '../types';
import { addMonths, monthGrid, monthKey, monthReport, monthStart, monthSummary, parseMonthKey } from './report';
import { computeRecords } from './stats';

const at = (y: number, m: number, d: number, h = 20) => new Date(y, m - 1, d, h).getTime();
const typeOf = () => 'weight_reps' as const;
const ex = (id: string, primaryMuscle: Exercise['primaryMuscle']): Exercise => ({ id, name: id, type: 'weight_reps', equipment: 'machine', primaryMuscle, secondaryMuscles: [], instructions: [], images: [], source: 'library' });
const map = new Map([ex('press', 'chest'), ex('row', 'lats')].map((e) => [e.id, e]));

let n = 0;
function workout(start: number, ...lifts: [string, number, number, number?][]): Workout {
  return {
    id: `w${++n}`,
    title: 'Day',
    startTime: start,
    endTime: start + 3_600_000,
    exerciseIds: lifts.map(([id]) => id),
    exercises: lifts.map(([exerciseId, weight, reps, sets = 1]) => ({
      id: `e${++n}`,
      exerciseId,
      sets: Array.from({ length: sets }, () => ({ id: `s${++n}`, type: 'normal' as const, weight, reps, completed: true })),
    })),
  };
}

describe('months', () => {
  it('finds the start of a month and moves between months across year ends', () => {
    expect(monthStart(at(2026, 10, 17))).toBe(at(2026, 10, 1, 0));
    expect(addMonths(at(2026, 12, 1, 0), 1)).toBe(at(2027, 1, 1, 0));
    expect(addMonths(at(2026, 1, 1, 0), -1)).toBe(at(2025, 12, 1, 0));
    expect(addMonths(at(2026, 3, 1, 0), 0)).toBe(at(2026, 3, 1, 0));
  });

  it('writes and reads the key in the address, refusing nonsense', () => {
    expect(monthKey(at(2026, 9, 30, 23))).toBe('2026-09');
    expect(parseMonthKey('2026-09')).toBe(at(2026, 9, 1, 0));
    for (const bad of [undefined, '', '2026-13', '2026-00', '26-09', '2026-9', 'abcd-ef']) expect(parseMonthKey(bad)).toBeUndefined();
  });

  it('lays the month out in weeks starting on the chosen day', () => {
    // October 2026 starts on a Thursday and has 31 days.
    const monday = monthGrid(at(2026, 10, 1, 0), 1);
    expect(monday[0].filter((d) => d === null)).toHaveLength(3);
    expect(monday.flat().filter((d) => d !== null)).toHaveLength(31);
    expect(monday.every((week) => week.length === 7)).toBe(true);
    const sunday = monthGrid(at(2026, 10, 1, 0), 0);
    expect(sunday[0].filter((d) => d === null)).toHaveLength(4);
    // A month that starts on the first day of the week has no lead-in.
    expect(monthGrid(at(2026, 6, 1, 0), 1)[0][0]).toBe(at(2026, 6, 1, 0));
  });
});

describe('monthReport', () => {
  const workouts = [
    workout(at(2026, 10, 3), ['press', 100, 5, 3], ['row', 60, 10, 2]),
    workout(at(2026, 10, 3, 9), ['press', 90, 5]),
    workout(at(2026, 10, 31, 23), ['row', 70, 10]),
    workout(at(2026, 9, 30, 23), ['press', 80, 5]),
    workout(at(2026, 9, 2), ['press', 80, 5]),
    workout(at(2026, 11, 1, 0), ['press', 110, 5]),
  ].sort((a, b) => b.startTime - a.startTime);
  const records = computeRecords(workouts, typeOf);
  // October 2026 as a finished month: "now" is in the new year.
  const report = monthReport(workouts, typeOf, map, records, at(2026, 10, 1, 0), 5, at(2027, 1, 15));

  it('keeps workouts to the local month: 23:00 on the last day is in, 00:00 on the next 1st is out', () => {
    expect(report.workouts).toBe(3);
    expect(report.list.every((w) => w.startTime >= at(2026, 10, 1, 0) && w.startTime < at(2026, 11, 1, 0))).toBe(true);
    expect(report.previous.workouts).toBe(2);
  });

  it('adds up time, sets, reps, volume and training days', () => {
    expect(report.seconds).toBe(3 * 3600);
    expect(report.sets).toBe(3 + 2 + 1 + 1);
    expect(report.reps).toBe(3 * 5 + 2 * 10 + 5 + 10);
    expect(report.volume).toBe(3 * 500 + 2 * 600 + 450 + 700);
    expect(report.days).toBe(2);
    expect(report.previous.volume).toBe(800);
  });

  it('counts the records of the month and ranks exercises by sets', () => {
    expect(report.records).toBe([...report.list].reduce((s, w) => s + (records.byWorkout.get(w.id) ?? 0), 0));
    expect(report.records).toBeGreaterThan(0);
    expect(report.top.map((r) => [r.exerciseId, r.sets, r.sessions])).toEqual([['press', 4, 2], ['row', 3, 2]]);
  });

  it('adds muscle sets and handles an empty month', () => {
    expect(report.muscles.get('chest')).toBe(4);
    expect(report.muscles.get('lats')).toBe(3);
    const empty = monthReport(workouts, typeOf, map, records, at(2027, 5, 1, 0), 5, at(2027, 7, 1));
    expect(empty.workouts).toBe(0);
    expect(empty.top).toEqual([]);
    expect(empty.muscles.size).toBe(0);
  });

  it('sets a finished month against all of the month before', () => {
    expect(report.partial).toBe(false);
    expect(report.previous.workouts).toBe(2);
  });

  it('sets a month still running against the same days of the month before', () => {
    // On 2 October the month before counts 1 to 2 September: the workout of the 2nd, not the one of the 30th.
    const early = monthReport(workouts, typeOf, map, records, at(2026, 10, 1, 0), 5, at(2026, 10, 2, 8));
    expect(early.partial).toBe(true);
    expect(early.previous.workouts).toBe(1);
    expect(early.previous.volume).toBe(400);
    // From the 30th on, the whole of September is in.
    const late = monthReport(workouts, typeOf, map, records, at(2026, 10, 1, 0), 5, at(2026, 10, 30, 8));
    expect(late.previous.workouts).toBe(2);
    // The 31st of a month after a 30-day month still ends at the month's end, never into this one.
    const day31 = monthReport(workouts, typeOf, map, records, at(2026, 10, 1, 0), 5, at(2026, 10, 31, 12));
    expect(day31.previous.workouts).toBe(2);
    // The report itself still counts the whole month so far, whatever "now" is.
    expect(early.workouts).toBe(report.workouts);
  });

  it('is not a running month before it starts or once it is over', () => {
    expect(monthReport(workouts, typeOf, map, records, at(2026, 10, 1, 0), 5, at(2026, 9, 20)).partial).toBe(false);
    expect(monthReport(workouts, typeOf, map, records, at(2026, 10, 1, 0), 5, at(2026, 11, 1, 0)).partial).toBe(false);
  });

  it('summarises a month for the Home card', () => {
    expect(monthSummary(workouts, at(2026, 10, 1, 0))).toEqual({ workouts: report.workouts, seconds: report.seconds });
    expect(monthSummary(workouts, at(2027, 5, 1, 0))).toEqual({ workouts: 0, seconds: 0 });
  });
});
