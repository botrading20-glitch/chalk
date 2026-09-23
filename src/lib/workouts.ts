import { useLiveQuery } from 'dexie-react-hooks';
import { db, getKV, setKV } from '../db';
import type { ActiveWorkout, Routine, Workout, WorkoutExercise, WorkoutSet } from '../types';
import { defaultWorkoutTitle, uid } from './format';
import { hasValues } from './stats';

const ACTIVE = 'active';

/** undefined while loading, null when no workout is running. */
export function useActiveWorkout() {
  return useLiveQuery(async () => (await getKV<ActiveWorkout>(ACTIVE)) ?? null, []);
}

export function getActive() {
  return getKV<ActiveWorkout>(ACTIVE);
}

export async function updateActive(fn: (a: ActiveWorkout) => ActiveWorkout) {
  await db.transaction('rw', db.kv, async () => {
    const current = await getKV<ActiveWorkout>(ACTIVE);
    if (current) await setKV(ACTIVE, fn(current));
  });
}

export function discardActive() {
  return db.kv.delete(ACTIVE);
}

/** Copies exercises with fresh ids so templates and history are never mutated. */
export function cloneExercises(list: WorkoutExercise[], completed = false): WorkoutExercise[] {
  return list.map((we) => ({
    ...we,
    id: uid(),
    sets: we.sets.map((s) => ({ ...s, id: uid(), completed })),
  }));
}

export async function startWorkout(opts: { title?: string; exercises?: WorkoutExercise[]; routineId?: string } = {}) {
  const now = Date.now();
  const active: ActiveWorkout = {
    id: uid(),
    title: opts.title ?? defaultWorkoutTitle(now),
    startTime: now,
    exercises: cloneExercises(opts.exercises ?? []),
    routineId: opts.routineId,
  };
  await setKV(ACTIVE, active);
}

export function emptySet(type: WorkoutSet['type'] = 'normal'): WorkoutSet {
  return { id: uid(), type, completed: false };
}

export function workoutFromDraft(a: ActiveWorkout, keepUnchecked: boolean): Workout {
  const exercises = a.exercises
    .map((we) => ({
      ...we,
      sets: we.sets
        .filter((s) => s.completed || (keepUnchecked && hasValues(s)))
        .map((s) => ({ ...s, completed: true })),
    }))
    .filter((we) => we.sets.length > 0);
  return {
    id: a.editingId ?? a.id,
    title: a.title.trim() || defaultWorkoutTitle(a.startTime),
    description: a.description?.trim() || undefined,
    startTime: a.startTime,
    endTime: a.endTime ?? Date.now(),
    exercises,
    exerciseIds: [...new Set(exercises.map((e) => e.exerciseId))],
    routineId: a.routineId,
  };
}

export async function finishActive(opts: { title: string; description?: string; keepUnchecked: boolean; updateRoutine: boolean }) {
  const active = await getActive();
  if (!active) throw new Error('No workout in progress.');
  const workout = workoutFromDraft({ ...active, title: opts.title, description: opts.description }, opts.keepUnchecked);
  await db.transaction('rw', db.workouts, db.kv, db.routines, async () => {
    await db.workouts.put(workout);
    await db.kv.delete(ACTIVE);
    if (opts.updateRoutine && workout.routineId) {
      await db.routines.update(workout.routineId, {
        exercises: templateFrom(workout.exercises),
        updatedAt: Date.now(),
      });
    }
  });
  return workout;
}

/** Strips completion state so exercises can be stored as a routine. */
export function templateFrom(list: WorkoutExercise[]): WorkoutExercise[] {
  return list.map((we) => ({
    ...we,
    id: uid(),
    sets: we.sets.map((s) => ({ id: uid(), type: s.type, weight: s.weight, reps: s.reps, distance: s.distance, duration: s.duration, completed: false })),
  }));
}

export async function saveRoutine(r: Omit<Routine, 'order' | 'createdAt' | 'updatedAt'> & Partial<Routine>) {
  const existing = await db.routines.get(r.id);
  const now = Date.now();
  const order = existing?.order ?? ((await db.routines.orderBy('order').last())?.order ?? 0) + 1;
  const routine: Routine = { ...r, order, createdAt: existing?.createdAt ?? now, updatedAt: now };
  await db.routines.put(routine);
  return routine;
}

export function routineFromWorkout(w: Workout, title = w.title) {
  return saveRoutine({ id: uid(), title, exercises: templateFrom(w.exercises) });
}

/**
 * One routine per workout title that repeats in history, built from the most
 * recent session with that title. Titles that already have a routine are skipped.
 */
export async function createRoutinesFromHistory() {
  const workouts = await db.workouts.orderBy('startTime').reverse().toArray();
  const routines = await db.routines.toArray();
  const taken = new Set(routines.map((r) => r.title.trim().toLowerCase()));
  const counts = new Map<string, number>();
  for (const w of workouts) counts.set(w.title.trim().toLowerCase(), (counts.get(w.title.trim().toLowerCase()) ?? 0) + 1);
  const created: string[] = [];
  for (const w of workouts) {
    const key = w.title.trim().toLowerCase();
    if (taken.has(key) || (counts.get(key) ?? 0) < 2) continue;
    taken.add(key);
    await routineFromWorkout(w);
    created.push(w.title);
  }
  return created;
}
