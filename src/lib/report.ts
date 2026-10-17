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
  /** The month before, for the comparison. */
  previous: MonthTotals;
}

function inMonth(workouts: Workout[], start: number) {
  const end = addMonths(start, 1);
  return workouts.filter((w) => w.startTime >= start && w.startTime < end);
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

export function monthReport(workouts: Workout[], typeOf: TypeOf, exerciseMap: Map<string, Exercise>, records: Records, start: number, limit = 5): MonthReport {
  const list = inMonth(workouts, start);
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
    previous: totals(inMonth(workouts, addMonths(start, -1)), typeOf, records),
  };
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

/** Signed difference for the comparison line; 0 when there is nothing to compare with. */
export function change(now: number, before: number) {
  return before > 0 ? now - before : 0;
}
