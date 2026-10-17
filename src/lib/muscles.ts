import type { Exercise, Muscle, WorkoutExercise } from '../types';

// Which muscles a workout worked, counted in sets. A primary muscle gets a whole set
// and each secondary muscle half a set, so a bench press adds to chest, then to
// shoulders and triceps a little. Warm-ups never count.

export const SECONDARY_WEIGHT = 0.5;

export function muscleSets(
  exercises: WorkoutExercise[],
  exerciseMap: Map<string, Exercise>,
  opts: { completedOnly?: boolean } = {},
): Map<Muscle, number> {
  const totals = new Map<Muscle, number>();
  const add = (m: Muscle, n: number) => totals.set(m, (totals.get(m) ?? 0) + n);
  for (const we of exercises) {
    const n = we.sets.filter((s) => s.type !== 'warmup' && (!opts.completedOnly || s.completed)).length;
    if (!n) continue;
    const ex = exerciseMap.get(we.exerciseId);
    add(ex?.primaryMuscle ?? 'other', n);
    // A muscle listed as both primary and secondary counts once, as primary.
    for (const m of new Set(ex?.secondaryMuscles ?? [])) if (m !== ex?.primaryMuscle) add(m, n * SECONDARY_WEIGHT);
  }
  return totals;
}

/** Adds up several workouts' counts (the monthly report and the 30-day card). */
export function mergeMuscleSets(maps: Map<Muscle, number>[]): Map<Muscle, number> {
  const out = new Map<Muscle, number>();
  for (const m of maps) for (const [muscle, n] of m) out.set(muscle, (out.get(muscle) ?? 0) + n);
  return out;
}

/** Muscles with sets, most worked first (ties keep body order so the list doesn't jump around). */
export function rankedMuscles(totals: Map<Muscle, number>, order: Muscle[]): { muscle: Muscle; sets: number }[] {
  return order
    .map((muscle) => ({ muscle, sets: totals.get(muscle) ?? 0 }))
    .filter((r) => r.sets > 0)
    .sort((a, b) => b.sets - a.sets);
}

/** Shade 0 (nothing) to 4 (the most worked muscle), by share of the maximum. */
export function muscleLevel(sets: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (!(sets > 0) || !(max > 0)) return 0;
  return Math.min(4, Math.max(1, Math.ceil((sets / max) * 4))) as 1 | 2 | 3 | 4;
}
