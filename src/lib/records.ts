import type { Workout, WorkoutExercise } from '../types';
import { RECORD_KINDS, recordValue, type RecordKind, type Records, type TypeOf } from './stats';

/** The records one exercise set in one workout, for the "Recent records" list. */
export interface RecentRecord {
  exerciseId: string;
  workoutId: string;
  time: number;
  /** Each record kind broken and the new value, the headline one first. */
  items: { kind: RecordKind; value: number }[];
}

const ORDER: RecordKind[] = ['weight', 'e1rm', 'volume', 'reps', 'duration', 'distance'];

/**
 * The latest records, newest workout first, one entry per exercise per workout.
 * `workouts` is newest first, as DataProvider keeps them; `records` is its computeRecords result.
 */
export function recentRecords(workouts: Workout[], records: Records, limit = 6): RecentRecord[] {
  const out: RecentRecord[] = [];
  for (const w of workouts) {
    for (const we of w.exercises) {
      const items: RecentRecord['items'] = [];
      for (const set of we.sets) {
        for (const kind of records.bySet.get(set.id) ?? []) items.push({ kind, value: recordValue(kind, set) });
      }
      // The headline record first: heaviest weight, then estimated 1RM, volume and so on.
      items.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
      if (items.length) out.push({ exerciseId: we.exerciseId, workoutId: w.id, time: w.startTime, items });
    }
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}

/**
 * The records the workout in progress has broken so far, keyed by set id. Same rules as
 * `computeRecords`: warm-ups and unchecked sets never count, an exercise with no earlier
 * history sets its baseline instead, a tie is not a record, and only the best set of each
 * kind in this workout gets the credit, so the live trophies add up to the saved total.
 * `best` is `Records['best']` of the saved workouts (the workout in progress is not among them).
 */
export function liveRecordSets(exercises: WorkoutExercise[], typeOf: TypeOf, best: Records['best']): Map<string, RecordKind[]> {
  const session = new Map<string, Partial<Record<RecordKind, { value: number; setId: string }>>>();
  for (const we of exercises) {
    const kinds = RECORD_KINDS[typeOf(we.exerciseId)];
    const current = session.get(we.exerciseId) ?? {};
    for (const s of we.sets) {
      if (s.type === 'warmup' || !s.completed) continue;
      for (const kind of kinds) {
        const value = recordValue(kind, s);
        if (value > 0 && value > (current[kind]?.value ?? 0)) current[kind] = { value, setId: s.id };
      }
    }
    session.set(we.exerciseId, current);
  }
  const bySet = new Map<string, RecordKind[]>();
  for (const [exerciseId, entries] of session) {
    for (const [kind, entry] of Object.entries(entries) as [RecordKind, { value: number; setId: string }][]) {
      const previous = best.get(exerciseId)?.[kind];
      if (previous && entry.value > previous.value + 1e-9) bySet.set(entry.setId, [...(bySet.get(entry.setId) ?? []), kind]);
    }
  }
  return bySet;
}

/** The kinds a set has just started to hold, headline first: heaviest weight, then estimated 1RM, volume and so on. */
export function newLiveRecords(before: Map<string, RecordKind[]>, after: Map<string, RecordKind[]>, setId: string): RecordKind[] {
  const had = before.get(setId) ?? [];
  return (after.get(setId) ?? []).filter((k) => !had.includes(k)).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}
