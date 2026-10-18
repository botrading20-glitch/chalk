import { DEFAULT_SETTINGS } from '../db';
import type { BodyWeight, Exercise, Routine, Settings, SetType, WarmupStep, Workout, WorkoutExercise, WorkoutSet } from '../types';
import { LOCALE_CODES } from '../i18n/locales';
import { EQUIPMENT, EXERCISE_TYPES, MUSCLES } from './meta';

// Shape checks for records that come from outside the app (backup files).
// A record whose identity or structure is broken is rejected (null). Fields
// Chalk can fill in safely are repaired: derived ids, unknown labels, and the
// nulls JSON writes in place of NaN. Fields this version doesn't know, written
// by a newer Chalk, pass through untouched so a restore never drops data.

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

const SET_TYPES: SetType[] = ['normal', 'warmup', 'failure', 'dropset'];
const SET_NUMBERS = ['weight', 'reps', 'distance', 'duration', 'rpe'] as const;

const SET_KEYS = ['id', 'type', 'completed', ...SET_NUMBERS];
const BLOCK_KEYS = ['id', 'exerciseId', 'sets', 'notes', 'supersetId', 'restSeconds'];
const WORKOUT_KEYS = ['id', 'title', 'description', 'startTime', 'endTime', 'exercises', 'exerciseIds', 'routineId'];
const ROUTINE_KEYS = ['id', 'title', 'notes', 'folder', 'exercises', 'order', 'createdAt', 'updatedAt'];
const EXERCISE_KEYS = ['id', 'name', 'type', 'equipment', 'primaryMuscle', 'secondaryMuscles', 'instructions', 'images', 'source', 'replaces'];
const BODYWEIGHT_KEYS = ['id', 'date', 'weight', 'updatedAt'];

/** Unknown fields of `original` plus the checked known ones; a known field that failed its check stays out. */
function withUnknown<T extends object>(original: Obj, known: readonly string[], checked: T): T {
  return { ...Object.fromEntries(Object.entries(original).filter(([k]) => !known.includes(k))), ...checked };
}

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
  return withUnknown<WorkoutSet>(v, SET_KEYS, set);
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
    out.push(
      withUnknown<WorkoutExercise>(we, BLOCK_KEYS, {
        id: we.id,
        exerciseId: we.exerciseId,
        sets: sets as WorkoutSet[],
        ...(isStr(we.notes) ? { notes: we.notes } : {}),
        ...(superset !== undefined ? { supersetId: superset } : {}),
        ...(rest !== undefined ? { restSeconds: rest } : {}),
      }),
    );
  }
  return out;
}

export function cleanWorkout(v: unknown): Workout | null {
  if (!isObj(v) || !isStr(v.id) || !isNum(v.startTime) || !isNum(v.endTime)) return null;
  const exercises = cleanExercises(v.exercises, true);
  if (!exercises) return null;
  return withUnknown<Workout>(v, WORKOUT_KEYS, {
    id: v.id,
    title: isStr(v.title) ? v.title : 'Workout',
    startTime: v.startTime,
    endTime: Math.max(v.endTime, v.startTime),
    exercises,
    // Denormalised, so rebuilt rather than trusted.
    exerciseIds: [...new Set(exercises.map((we) => we.exerciseId))],
    ...(isStr(v.description) ? { description: v.description } : {}),
    ...(isStr(v.routineId) ? { routineId: v.routineId } : {}),
  });
}

export function cleanRoutine(v: unknown): Routine | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.title)) return null;
  const exercises = cleanExercises(v.exercises, false);
  if (!exercises) return null;
  const now = Date.now();
  return withUnknown<Routine>(v, ROUTINE_KEYS, {
    id: v.id,
    title: v.title,
    exercises,
    order: isNum(v.order) ? v.order : 0,
    createdAt: isNum(v.createdAt) ? v.createdAt : now,
    updatedAt: isNum(v.updatedAt) ? v.updatedAt : now,
    ...(isStr(v.notes) ? { notes: v.notes } : {}),
    ...(isStr(v.folder) && v.folder.trim() ? { folder: v.folder } : {}),
  });
}

/** Only the user's own exercises travel in backups; the library ships with the app. */
export function cleanExercise(v: unknown): Exercise | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.name) || !v.name.trim() || v.source === 'library') return null;
  return withUnknown<Exercise>(v, EXERCISE_KEYS, {
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
  });
}

export function cleanBodyWeight(v: unknown): BodyWeight | null {
  if (!isObj(v) || !isStr(v.id) || !isNum(v.date) || !isNum(v.weight) || v.weight <= 0) return null;
  return withUnknown<BodyWeight>(v, BODYWEIGHT_KEYS, { id: v.id, date: v.date, weight: v.weight, updatedAt: isNum(v.updatedAt) ? v.updatedAt : v.date });
}

/** One to six steps with a whole percent from 5 to 95 and whole reps from 1 to 30; anything else is dropped as a whole. */
export function cleanWarmupSteps(v: unknown): WarmupStep[] | undefined {
  if (!Array.isArray(v) || v.length < 1 || v.length > 6) return undefined;
  const steps: WarmupStep[] = [];
  for (const s of v) {
    if (!isObj(s) || !isNum(s.percent) || !isNum(s.reps)) return undefined;
    if (!Number.isInteger(s.percent) || s.percent < 5 || s.percent > 95) return undefined;
    if (!Number.isInteger(s.reps) || s.reps < 1 || s.reps > 30) return undefined;
    steps.push({ percent: s.percent, reps: s.reps });
  }
  return steps;
}

/** Keeps the settings whose type matches Chalk's own; the rest fall back to the defaults. */
export function cleanSettings(v: unknown): Partial<Settings> | undefined {
  if (!isObj(v)) return undefined;
  const out: Partial<Record<keyof Settings, unknown>> = {};
  const enums: Partial<Record<keyof Settings, readonly string[]>> = {
    weightUnit: ['kg', 'lbs'],
    distanceUnit: ['km', 'mi'],
    theme: ['dark', 'light', 'system'],
    language: ['auto', ...LOCALE_CODES],
    timeFormat: ['auto', '24h', '12h'],
    weekStart: ['auto', 'mon', 'sun', 'sat'],
    oneRmFormula: ['epley', 'brzycki'],
    previousFrom: ['any', 'routine'],
    restSound: ['classic', 'chime', 'bell', 'pulse'],
    soundVolume: ['low', 'medium', 'high'],
    accent: ['purple', 'indigo', 'teal', 'pink'],
    textSize: ['small', 'default', 'large', 'xlarge'],
    reduceMotion: ['system', 'always'],
    backupReminder: ['off', 'weekly', 'monthly'],
  };
  // Whole numbers inside a sensible range; anything else falls back to the default.
  const ranges: Partial<Record<keyof Settings, [number, number]>> = {
    weeklyGoal: [0, 7],
    newExerciseSets: [0, 10],
    warmupRest: [-1, 600],
    defaultRest: [0, 3600],
  };
  // Rounding steps are fractions of a unit, so they get a float range instead of whole numbers.
  const floats: Partial<Record<keyof Settings, [number, number]>> = {
    warmupRoundKg: [0.25, 25],
    warmupRoundLbs: [0.5, 50],
  };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = v[key];
    const fallback = DEFAULT_SETTINGS[key];
    if (value === undefined) continue;
    if (key === 'warmupSteps') {
      const steps = cleanWarmupSteps(value);
      if (steps) out[key] = steps;
    } else if (floats[key]) {
      const [min, max] = floats[key]!;
      if (isNum(value) && value >= min && value <= max) out[key] = value;
    } else if (enums[key]) {
      if (enums[key]!.includes(value as string)) out[key] = value;
    } else if (Array.isArray(fallback)) {
      if (Array.isArray(value) && value.length && value.every((n) => isNum(n) && n > 0)) out[key] = value;
    } else if (isObj(fallback)) {
      if (isObj(value) && Object.values(value).every(isNum)) out[key] = value;
    } else if (ranges[key]) {
      const [min, max] = ranges[key]!;
      if (isNum(value) && Number.isInteger(value) && value >= min && value <= max) out[key] = value;
    } else if (key === 'profileName') {
      if (isStr(value)) out[key] = value.slice(0, 40);
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
