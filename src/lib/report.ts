import type { Exercise, Muscle, Workout } from '../types';
import { addDays, startOfDay } from './format';
import { mergeMuscleSets, muscleSets } from './muscles';
import { workoutReps, workoutSets, workoutVolume, type Records, type TypeOf } from './stats';

// The monthly report: one calendar month of training added up and set beside the month
// before. Months are local: a workout belongs to the month of its start in the device's
// time zone. Everything here is pure, so the boundaries can be tested.

/** 00:00 on the first day of the month containing ts. */
export function monthStart(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

/** The first day of the month `n` months from this one (negative for earlier). */
export function addMonths(start: number, n: number) {
  const d = new Date(start);
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
}

/** "2026-09", the form used in the address. */
export function monthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** The start of the month a key names, or undefined when it isn't "yyyy-mm" with a real month. */
export function parseMonthKey(key: string | undefined) {
  const m = /^(\d{4})-(\d{2})$/.exec(key ?? '');
  if (!m) return undefined;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return undefined;
  return new Date(Number(m[1]), month - 1, 1).getTime();
}

export interface MonthTotals {
  workouts: number;
  /** Seconds trained. */
  seconds: number;
  /** kg */
  volume: number;
  sets: number;
  reps: number;
  records: number;
  /** Different days with a workout. */
  days: number;
}

export interface MonthReport extends MonthTotals {
  start: number;
  /** The month's workouts, newest first as given. */
  list: Workout[];
  /** Most-trained exercises: sets first, then sessions. */
  top: { exerciseId: string; sets: number; sessions: number }[];
  muscles: Map<Muscle, number>;
  /** The month before, for the comparison: all of it, or only its first days while this month is still running. */
  previous: MonthTotals;
  /** This month is still running, so `previous` covers only as many days as have passed in it. */
  partial: boolean;
}

function between(workouts: Workout[], from: number, to: number) {
  return workouts.filter((w) => w.startTime >= from && w.startTime < to);
}

function inMonth(workouts: Workout[], start: number) {
  return between(workouts, start, addMonths(start, 1));
}

function totals(list: Workout[], typeOf: TypeOf, records: Records): MonthTotals {
  return {
    workouts: list.length,
    seconds: list.reduce((n, w) => n + Math.max(0, w.endTime - w.startTime) / 1000, 0),
    volume: list.reduce((n, w) => n + workoutVolume(w, typeOf), 0),
    sets: list.reduce((n, w) => n + workoutSets(w), 0),
    reps: list.reduce((n, w) => n + workoutReps(w), 0),
    records: list.reduce((n, w) => n + (records.byWorkout.get(w.id) ?? 0), 0),
    days: new Set(list.map((w) => startOfDay(w.startTime))).size,
  };
}

/**
 * One month's report. A month still running (`now` falls in it) is set against the same days of the month
 * before, so "+2 vs the same days last month" compares like with like; a finished month, against all of it.
 */
export function monthReport(
  workouts: Workout[],
  typeOf: TypeOf,
  exerciseMap: Map<string, Exercise>,
  records: Records,
  start: number,
  limit = 5,
  now = Date.now(),
): MonthReport {
  const list = inMonth(workouts, start);
  const partial = now >= start && now < addMonths(start, 1);
  const before = addMonths(start, -1);
  // Days passed so far this month, today included, applied to the month before (which may be shorter).
  const passed = Math.round((startOfDay(now) - start) / 86_400_000) + 1;
  const previousEnd = partial ? Math.min(start, addDays(before, passed)) : start;
  const perExercise = new Map<string, { sets: number; sessions: number }>();
  for (const w of list) {
    for (const id of new Set(w.exercises.map((we) => we.exerciseId))) {
      const row = perExercise.get(id) ?? { sets: 0, sessions: 0 };
      row.sessions++;
      row.sets += w.exercises.filter((we) => we.exerciseId === id).reduce((n, we) => n + we.sets.filter((s) => s.type !== 'warmup').length, 0);
      perExercise.set(id, row);
    }
  }
  const top = [...perExercise.entries()]
    .map(([exerciseId, row]) => ({ exerciseId, ...row }))
    .filter((r) => r.sets > 0)
    .sort((a, b) => b.sets - a.sets || b.sessions - a.sessions)
    .slice(0, limit);
  return {
    ...totals(list, typeOf, records),
    start,
    list,
    top,
    muscles: mergeMuscleSets(list.map((w) => muscleSets(w.exercises, exerciseMap))),
    previous: totals(between(workouts, before, previousEnd), typeOf, records),
    partial,
  };
}

/** Workouts and time trained in the month starting at `start`: all Home's card needs. */
export function monthSummary(workouts: Workout[], start: number) {
  const list = inMonth(workouts, start);
  return { workouts: list.length, seconds: list.reduce((n, w) => n + Math.max(0, w.endTime - w.startTime) / 1000, 0) };
}

/**
 * The month as rows of seven days, each a local midnight or null where the week spills into
 * the neighbouring month. `firstDay` is 0 for Sunday, as Date.getDay() counts.
 */
export function monthGrid(start: number, firstDay: number): (number | null)[][] {
  const end = addMonths(start, 1);
  const lead = (new Date(start).getDay() - firstDay + 7) % 7;
  const cells: (number | null)[] = Array.from({ length: lead }, () => null);
  for (let day = start; day < end; day = addDays(day, 1)) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}
