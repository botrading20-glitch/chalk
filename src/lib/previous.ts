import type { Workout } from '../types';

export interface PreviousOptions {
  /** Only sessions that started before this time count. */
  before?: number;
  excludeId?: string;
  /** Look at sessions logged with this routine first (the "Same routine first" setting). */
  routineId?: string;
}

/**
 * The session whose sets stand in for "last time" for one exercise: the newest earlier
 * one, preferring the same routine when asked, then any. `workouts` is newest first.
 */
export function previousSession(workouts: Workout[], exerciseId: string, opts: PreviousOptions = {}): Workout | undefined {
  const usable = (w: Workout) =>
    w.id !== opts.excludeId && (opts.before === undefined || w.startTime < opts.before) && w.exerciseIds.includes(exerciseId);
  if (opts.routineId) {
    const same = workouts.find((w) => usable(w) && w.routineId === opts.routineId);
    if (same) return same;
  }
  return workouts.find(usable);
}
