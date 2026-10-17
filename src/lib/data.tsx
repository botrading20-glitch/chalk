import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from '../db';
import type { Exercise, Workout, WorkoutSet } from '../types';
import { useSettings } from './settings';
import { previousSession } from './previous';
import { computeRecords, typeLookup, type Records, type TypeOf } from './stats';

interface AppData {
  ready: boolean;
  /** Everything the user can pick: library exercises they replaced with their own version are left out. */
  exercises: Exercise[];
  /** Every exercise, including replaced ones, so old references still resolve. */
  exerciseMap: Map<string, Exercise>;
  /** Newest first. */
  workouts: Workout[];
  typeOf: TypeOf;
  records: Records;
}

const Ctx = createContext<AppData | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const workouts = useLiveQuery(() => db.workouts.orderBy('startTime').reverse().toArray(), []);
  // Records depend on the 1RM formula, so they are recomputed when it changes.
  const { oneRmFormula } = useSettings();

  const value = useMemo<AppData>(() => {
    const list = exercises ?? [];
    const typeOf = typeLookup(list);
    const replaced = new Set(list.flatMap((e) => (e.replaces ? [e.replaces] : [])));
    return {
      ready: exercises !== undefined && workouts !== undefined,
      exercises: replaced.size ? list.filter((e) => !replaced.has(e.id)) : list,
      exerciseMap: new Map(list.map((e) => [e.id, e])),
      workouts: workouts ?? [],
      typeOf,
      records: computeRecords(workouts ?? [], typeOf),
    };
  }, [exercises, workouts, oneRmFormula]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside DataProvider');
  return v;
}

/**
 * Sets from the most recent earlier session of each exercise: any workout, or (with the
 * "Same routine first" setting and a routine to go by) that routine's own sessions first.
 */
export function usePreviousSets(exerciseIds: string[], opts: { before?: number; excludeId?: string; routineId?: string } = {}) {
  const { workouts } = useData();
  const { previousFrom } = useSettings();
  const key = exerciseIds.join('|');
  const routineId = previousFrom === 'routine' ? opts.routineId : undefined;
  return useMemo(() => {
    const out = new Map<string, WorkoutSet[]>();
    for (const id of new Set(exerciseIds)) {
      const w = previousSession(workouts, id, { before: opts.before, excludeId: opts.excludeId, routineId });
      if (w) {
        out.set(
          id,
          w.exercises.filter((we) => we.exerciseId === id).flatMap((we) => we.sets),
        );
      }
    }
    return out;
  }, [workouts, key, opts.before, opts.excludeId, routineId]);
}

export function useNow(intervalMs = 1000, enabled = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}
