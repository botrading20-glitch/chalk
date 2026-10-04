import { DEFAULT_SETTINGS } from '../db';
import type { BodyWeight, Exercise, Routine, Settings, SetType, Workout, WorkoutExercise, WorkoutSet } from '../types';
import { EQUIPMENT, EXERCISE_TYPES, MUSCLES } from './meta';

// Shape checks for records that come from outside the app (backup files).
// A record whose identity or structure is broken is rejected (null). Fields
// Chalk can fill in safely are repaired: derived ids, unknown labels, and the
// nulls JSON writes in place of NaN.

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

const SET_TYPES: SetType[] = ['normal', 'warmup', 'failure', 'dropset'];
const SET_NUMBERS = ['weight', 'reps', 'distance', 'duration', 'rpe'] as const;

/** Missing or null is fine (undefined); anything else must be a finite number. */
function optNum(v: unknown): number | undefined | false {
  if (v === undefined || v === null) return undefined;
  return isNum(v) ? v : false;
}

function cleanSet(v: unknown, completedByDefault: boolean): WorkoutSet | null {
  if (!isObj(v) || !isStr(v.id)) return null;
  const set: WorkoutSet = {
    id: v.id,
    type: oneOf(SET_TYPES, v.type, 'normal'),
    completed: typeof v.completed === 'boolean' ? v.completed : completedByDefault,
  };
  for (const key of SET_NUMBERS) {
    const n = optNum(v[key]);
    if (n === false) return null;
    if (n !== undefined) set[key] = n;
  }
  return set;
}

function cleanExercises(v: unknown, completedByDefault: boolean): WorkoutExercise[] | null {
  if (!Array.isArray(v)) return null;
  const out: WorkoutExercise[] = [];
  for (const we of v) {
    if (!isObj(we) || !isStr(we.id) || !isStr(we.exerciseId) || !Array.isArray(we.sets)) return null;
    const sets = we.sets.map((s) => cleanSet(s, completedByDefault));
    if (sets.some((s) => s === null)) return null;
    const superset = optNum(we.supersetId);
    const rest = optNum(we.restSeconds);
    if (superset === false || rest === false) return null;
    out.push({
      id: we.id,
      exerciseId: we.exerciseId,
      sets: sets as WorkoutSet[],
      ...(isStr(we.notes) ? { notes: we.notes } : {}),
      ...(superset !== undefined ? { supersetId: superset } : {}),
      ...(rest !== undefined ? { restSeconds: rest } : {}),
    });
  }
  return out;
}

export function cleanWorkout(v: unknown): Workout | null {
  if (!isObj(v) || !isStr(v.id) || !isNum(v.startTime) || !isNum(v.endTime)) return null;
  const exercises = cleanExercises(v.exercises, true);
  if (!exercises) return null;
  return {
    id: v.id,
    title: isStr(v.title) ? v.title : 'Workout',
    startTime: v.startTime,
    endTime: Math.max(v.endTime, v.startTime),
    exercises,
    // Denormalised, so rebuilt rather than trusted.
    exerciseIds: [...new Set(exercises.map((we) => we.exerciseId))],
    ...(isStr(v.description) ? { description: v.description } : {}),
    ...(isStr(v.routineId) ? { routineId: v.routineId } : {}),
  };
}

export function cleanRoutine(v: unknown): Routine | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.title)) return null;
  const exercises = cleanExercises(v.exercises, false);
  if (!exercises) return null;
  const now = Date.now();
  return {
    id: v.id,
    title: v.title,
    exercises,
    order: isNum(v.order) ? v.order : 0,
    createdAt: isNum(v.createdAt) ? v.createdAt : now,
    updatedAt: isNum(v.updatedAt) ? v.updatedAt : now,
    ...(isStr(v.notes) ? { notes: v.notes } : {}),
    ...(isStr(v.folder) && v.folder.trim() ? { folder: v.folder } : {}),
  };
}

/** Only the user's own exercises travel in backups; the library ships with the app. */
export function cleanExercise(v: unknown): Exercise | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.name) || !v.name.trim() || v.source === 'library') return null;
  return {
    id: v.id,
    name: v.name,
    type: oneOf(EXERCISE_TYPES, v.type, 'weight_reps'),
    equipment: oneOf(EQUIPMENT, v.equipment, 'other'),
    primaryMuscle: oneOf(MUSCLES, v.primaryMuscle, 'other'),
    secondaryMuscles: Array.isArray(v.secondaryMuscles) ? v.secondaryMuscles.filter((m) => MUSCLES.includes(m)) : [],
    instructions: isStrList(v.instructions) ? v.instructions : [],
    images: isStrList(v.images) ? v.images : [],
    source: 'custom',
    ...(isStr(v.replaces) ? { replaces: v.replaces } : {}),
  };
}

export function cleanBodyWeight(v: unknown): BodyWeight | null {
  if (!isObj(v) || !isStr(v.id) || !isNum(v.date) || !isNum(v.weight) || v.weight <= 0) return null;
  return { id: v.id, date: v.date, weight: v.weight, updatedAt: isNum(v.updatedAt) ? v.updatedAt : v.date };
}

/** Keeps the settings whose type matches Chalk's own; the rest fall back to the defaults. */
export function cleanSettings(v: unknown): Partial<Settings> | undefined {
  if (!isObj(v)) return undefined;
  const out: Partial<Record<keyof Settings, unknown>> = {};
  const enums: Partial<Record<keyof Settings, readonly string[]>> = {
    weightUnit: ['kg', 'lbs'],
    distanceUnit: ['km', 'mi'],
    theme: ['dark', 'light', 'system'],
  };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = v[key];
    const fallback = DEFAULT_SETTINGS[key];
    if (value === undefined) continue;
    if (enums[key]) {
      if (enums[key]!.includes(value as string)) out[key] = value;
    } else if (Array.isArray(fallback)) {
      if (Array.isArray(value) && value.length && value.every((n) => isNum(n) && n > 0)) out[key] = value;
    } else if (isObj(fallback)) {
      if (isObj(value) && Object.values(value).every(isNum)) out[key] = value;
    } else if (typeof value === typeof fallback && (typeof value !== 'number' || isNum(value))) {
      out[key] = value;
    }
  }
  return out as Partial<Settings>;
}

/** Cleans a list, counting what had to be left out. */
export function cleanAll<T>(list: unknown, clean: (v: unknown) => T | null): { items: T[]; skipped: number } {
  if (!Array.isArray(list)) return { items: [], skipped: 0 };
  const items: T[] = [];
  for (const v of list) {
    const c = clean(v);
    if (c) items.push(c);
  }
  return { items, skipped: list.length - items.length };
}
