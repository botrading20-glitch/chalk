import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from '../db';
import type { Exercise, Workout, WorkoutSet } from '../types';
import { computeRecords, typeLookup, type Records, type TypeOf } from './stats';

interface AppData {
  ready: boolean;
  exercises: Exercise[];
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

  const value = useMemo<AppData>(() => {
    const list = exercises ?? [];
    const typeOf = typeLookup(list);
    return {
      ready: exercises !== undefined && workouts !== undefined,
      exercises: list,
      exerciseMap: new Map(list.map((e) => [e.id, e])),
      workouts: workouts ?? [],
      typeOf,
      records: computeRecords(workouts ?? [], typeOf),
    };
  }, [exercises, workouts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside DataProvider');
  return v;
}

/** Sets from the most recent earlier session of each exercise. */
export function usePreviousSets(exerciseIds: string[], opts: { before?: number; excludeId?: string } = {}) {
  const { workouts } = useData();
  const key = exerciseIds.join('|');
  return useMemo(() => {
    const wanted = new Set(exerciseIds);
    const out = new Map<string, WorkoutSet[]>();
    for (const w of workouts) {
      if (out.size === wanted.size) break;
      if (w.id === opts.excludeId || (opts.before !== undefined && w.startTime >= opts.before)) continue;
      for (const id of w.exerciseIds) {
        if (!wanted.has(id) || out.has(id)) continue;
        out.set(
          id,
          w.exercises.filter((we) => we.exerciseId === id).flatMap((we) => we.sets),
        );
      }
    }
    return out;
  }, [workouts, key, opts.before, opts.excludeId]);
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
