import type Dexie from 'dexie';
import { DEFAULT_SETTINGS, db } from '../db';
import type { Settings } from '../types';
import { fmtDate, plural } from './format';
import { requestSync } from './sync';
import { cleanBodyWeight, cleanExercise, cleanRoutine, cleanSettings, cleanWorkout } from './validate';

// The "Check data" workflow. Records that arrive through sync, or that a bug
// wrote, aren't shape-checked when they're read, and one damaged workout is
// enough to crash the app. This runs the same cleaners as Restore backup over
// what is stored and lets the user repair or delete each problem. Nothing is
// changed until the user asks, because filtering automatically would look like
// a deletion to the sync engine (see DECISIONS.md).
//
// Deliberately free of React and DataProvider so the crash screen can use it.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

export type RecordKind = 'workouts' | 'routines' | 'exercises' | 'bodyweight';
export type Kind = RecordKind | 'settings';

export const KIND_LABEL: Record<Kind, string> = {
  workouts: 'Workout',
  routines: 'Routine',
  exercises: 'Exercise',
  bodyweight: 'Weigh-in',
  settings: 'Settings',
};

export interface Issue {
  kind: Kind;
  /** Primary key of the stored record; 'settings' for the settings row. */
  key: IDBValidKey;
  label: string;
  /** repairable: Setward can work out the fix. damaged: only deleting is left. */
  status: 'repairable' | 'damaged';
  /** Plain-word names of the parts that get fixed (repairable only). */
  fields: string[];
  raw: unknown;
  /** Exercises only: where the record is still used, such as "3 workouts". */
  usedBy?: string;
}

export interface CheckResult {
  counts: Record<Kind, number>;
  issues: Issue[];
}

const CLEAN = {
  workouts: cleanWorkout,
  routines: cleanRoutine,
  exercises: cleanExercise,
  bodyweight: cleanBodyWeight,
} as const;

const FIELD: Record<string, string> = {
  title: 'title',
  description: 'description',
  startTime: 'start time',
  endTime: 'end time',
  exercises: 'exercises and sets',
  exerciseIds: 'exercise list',
  routineId: 'routine link',
  notes: 'notes',
  folder: 'folder',
  order: 'order',
  createdAt: 'created time',
  updatedAt: 'updated time',
  name: 'name',
  type: 'type',
  equipment: 'equipment',
  primaryMuscle: 'main muscle',
  secondaryMuscles: 'other muscles',
  instructions: 'instructions',
  images: 'images',
  source: 'source',
  replaces: 'replaced exercise',
  date: 'date',
  weight: 'weight',
  weightUnit: 'weight unit',
  distanceUnit: 'distance unit',
  defaultRest: 'default rest',
  theme: 'theme',
  timerSound: 'rest sound',
  timerLockScreen: 'rest alert with the screen off',
  timerVibrate: 'vibration',
  keepAwake: 'keep screen on',
  platesKg: 'kg plates',
  platesLbs: 'lb plates',
  plateBars: 'bar weights',
};
const fieldName = (k: string) => FIELD[k] ?? k;

/** Keys sorted and undefined dropped, so two records that mean the same compare equal. */
function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (isObj(v)) {
    return Object.fromEntries(
      Object.entries(v)
        .filter(([, x]) => x !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, x]) => [k, canon(x)]),
    );
  }
  return v;
}

function sameJson(a: unknown, b: unknown) {
  try {
    return JSON.stringify(canon(a)) === JSON.stringify(canon(b));
  } catch {
    return false;
  }
}

/** `exerciseIds` is only an index, so its order and repeats don't matter. */
function comparable(kind: RecordKind, v: Obj): Obj {
  if (kind === 'workouts' && Array.isArray(v.exerciseIds) && v.exerciseIds.every((x) => typeof x === 'string')) {
    return { ...v, exerciseIds: [...new Set(v.exerciseIds as string[])].sort() };
  }
  return v;
}

function changedFields(a: Obj, b: Obj) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((k) => !sameJson(a[k], b[k])).map(fieldName);
}

type Verdict = { status: 'ok' } | { status: 'damaged' } | { status: 'repairable'; fixed: Obj; fields: string[] };

function evaluate(kind: RecordKind, raw: unknown): Verdict {
  const fixed = CLEAN[kind](raw) as Obj | null;
  if (!fixed) return { status: 'damaged' };
  const fields = changedFields(comparable(kind, raw as Obj), comparable(kind, fixed));
  return fields.length ? { status: 'repairable', fixed, fields } : { status: 'ok' };
}

function evaluateSettings(raw: unknown): Verdict {
  if (!isObj(raw)) return { status: 'repairable', fixed: {}, fields: ['settings'] };
  const good = cleanSettings(raw) ?? {};
  const bad = (Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]).filter((k) => raw[k] !== undefined && !(k in good));
  if (!bad.length) return { status: 'ok' };
  // Only the settings that fail their check go; they fall back to the defaults.
  return {
    status: 'repairable',
    fixed: Object.fromEntries(Object.entries(raw).filter(([k]) => !bad.includes(k as keyof Settings))),
    fields: bad.map(fieldName),
  };
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const when = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? fmtDate(v) : undefined);

/** Something the user can recognise the record by, however broken it is. */
function labelFor(kind: Kind, raw: unknown) {
  const r = isObj(raw) ? raw : {};
  switch (kind) {
    case 'workouts':
      return [str(r.title) ?? 'Untitled workout', when(r.startTime)].filter(Boolean).join(' · ');
    case 'routines':
      return str(r.title) ?? 'Untitled routine';
    case 'exercises':
      return str(r.name) ?? 'Unnamed exercise';
    case 'bodyweight':
      return when(r.date) ?? 'Undated weigh-in';
    default:
      return 'Your settings';
  }
}

/** The problem with one stored record, or null when it's fine. Pure. */
export function inspectRecord(kind: RecordKind, raw: unknown): Issue | null {
  const verdict = evaluate(kind, raw);
  if (verdict.status === 'ok') return null;
  return {
    kind,
    key: (isObj(raw) ? raw.id : undefined) as IDBValidKey,
    label: labelFor(kind, raw),
    status: verdict.status,
    fields: verdict.status === 'repairable' ? verdict.fields : [],
    raw,
  };
}

/** The problem with the stored settings, or null. Pure. */
export function inspectSettings(raw: unknown): Issue | null {
  const verdict = evaluateSettings(raw);
  if (verdict.status !== 'repairable') return null;
  return { kind: 'settings', key: 'settings', label: labelFor('settings', raw), status: 'repairable', fields: verdict.fields, raw };
}

type RawTable = Dexie.Table<unknown, IDBValidKey>;
const tables: Record<RecordKind, RawTable> = {
  workouts: db.workouts as unknown as RawTable,
  routines: db.routines as unknown as RawTable,
  exercises: db.exercises as unknown as RawTable,
  bodyweight: db.bodyweight as unknown as RawTable,
};

/** Where an exercise is still used, counted over the raw rows so a damaged one can't throw. */
function usesOf(id: unknown, workouts: unknown[], routines: unknown[]) {
  const has = (list: unknown) => Array.isArray(list) && list.some((we) => isObj(we) && we.exerciseId === id);
  const w = workouts.filter((x) => isObj(x) && (has(x.exercises) || (Array.isArray(x.exerciseIds) && x.exerciseIds.includes(id)))).length;
  const r = routines.filter((x) => isObj(x) && has(x.exercises)).length;
  const parts = [w ? plural(w, 'workout') : '', r ? plural(r, 'routine') : ''].filter(Boolean);
  return parts.length ? parts.join(' and ') : undefined;
}

export async function checkData(): Promise<CheckResult> {
  const [workouts, routines, allExercises, bodyweight, settings] = await Promise.all([
    tables.workouts.toArray(),
    tables.routines.toArray(),
    tables.exercises.toArray(),
    tables.bodyweight.toArray(),
    db.kv.get('settings'),
  ]);
  // The library is re-seeded from the app, so only the user's own exercises count.
  const exercises = allExercises.filter((e) => !(isObj(e) && e.source === 'library'));

  const issues: Issue[] = [];
  const add = (issue: Issue | null) => issue && issues.push(issue);
  workouts.forEach((r) => add(inspectRecord('workouts', r)));
  routines.forEach((r) => add(inspectRecord('routines', r)));
  exercises.forEach((r) => {
    const issue = inspectRecord('exercises', r);
    if (issue) add({ ...issue, usedBy: usesOf(issue.key, workouts, routines) });
  });
  bodyweight.forEach((r) => add(inspectRecord('bodyweight', r)));
  if (settings) add(inspectSettings(settings.value));

  return {
    counts: { workouts: workouts.length, routines: routines.length, exercises: exercises.length, bodyweight: bodyweight.length, settings: settings ? 1 : 0 },
    issues,
  };
}

/** 'done': written. 'stale': the record changed since the check, so nothing was touched. */
export type Outcome = 'done' | 'stale';

/** Repairs and bumps `updatedAt` where the record has one, because a repair is an edit. */
export async function repairIssue(issue: Issue): Promise<Outcome> {
  if (issue.kind === 'settings') {
    const outcome = await db.transaction('rw', db.kv, async (): Promise<Outcome> => {
      const verdict = evaluateSettings((await db.kv.get('settings'))?.value);
      if (verdict.status !== 'repairable') return 'stale';
      await db.kv.put({ key: 'settings', value: verdict.fixed });
      return 'done';
    });
    // Settings live in kv, whose changes don't trigger the background sync.
    if (outcome === 'done') requestSync();
    return outcome;
  }
  const table = tables[issue.kind];
  return db.transaction('rw', table, async (): Promise<Outcome> => {
    const verdict = evaluate(issue.kind as RecordKind, await table.get(issue.key));
    if (verdict.status !== 'repairable') return 'stale';
    const stamped = 'updatedAt' in verdict.fixed ? { ...verdict.fixed, updatedAt: Date.now() } : verdict.fixed;
    await table.put(stamped);
    return 'done';
  });
}

/** Deletes a record that still can't be read; a record that has been repaired or replaced since is left alone. */
export async function deleteIssue(issue: Issue): Promise<Outcome> {
  if (issue.kind === 'settings') return 'stale';
  const table = tables[issue.kind];
  return db.transaction('rw', table, async (): Promise<Outcome> => {
    const verdict = evaluate(issue.kind as RecordKind, await table.get(issue.key));
    if (verdict.status !== 'damaged') return 'stale';
    await table.delete(issue.key);
    return 'done';
  });
}

/** The stored record as readable text, cut off so a huge one doesn't fill the screen. */
export function describeRecord(raw: unknown, max = 1500) {
  let text: string;
  try {
    text = JSON.stringify(raw, null, 2) ?? String(raw);
  } catch {
    text = String(raw);
  }
  return text.length > max ? `${text.slice(0, max)}\n… (${text.length - max} more characters)` : text;
}
