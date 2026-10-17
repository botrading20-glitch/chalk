import type { Workout } from '../types';
import { recordValue, type RecordKind, type Records } from './stats';

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
