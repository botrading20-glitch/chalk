import type { Exercise, ExerciseType, Workout, WorkoutExercise, WorkoutSet } from '../types';
import { COUNTS_VOLUME, FIELDS } from './meta';
import { addDays, startOfWeek } from './format';

export type TypeOf = (exerciseId: string) => ExerciseType;

export function typeLookup(exercises: Exercise[] | undefined): TypeOf {
  const map = new Map(exercises?.map((e) => [e.id, e.type]));
  return (id) => map.get(id) ?? 'weight_reps';
}

/** Epley estimate of a one-rep max. */
export function e1rm(weight = 0, reps = 0) {
  if (!weight || !reps) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export function setVolume(s: WorkoutSet, type: ExerciseType) {
  return COUNTS_VOLUME[type] ? (s.weight ?? 0) * (s.reps ?? 0) : 0;
}

export function exerciseVolume(we: WorkoutExercise, type: ExerciseType) {
  return we.sets.reduce((sum, s) => sum + setVolume(s, type), 0);
}

export function workoutVolume(w: { exercises: WorkoutExercise[] }, typeOf: TypeOf, completedOnly = false) {
  let total = 0;
  for (const we of w.exercises) {
    const type = typeOf(we.exerciseId);
    for (const s of we.sets) if (!completedOnly || s.completed) total += setVolume(s, type);
  }
  return total;
}

export function workoutSets(w: { exercises: WorkoutExercise[] }, completedOnly = false) {
  return w.exercises.reduce((n, we) => n + we.sets.filter((s) => !completedOnly || s.completed).length, 0);
}

export function workoutReps(w: Workout) {
  return w.exercises.reduce((n, we) => n + we.sets.reduce((m, s) => m + (s.reps ?? 0), 0), 0);
}

export function hasValues(s: WorkoutSet) {
  return [s.weight, s.reps, s.distance, s.duration].some((v) => v !== undefined);
}

// ---------------------------------------------------------------------------
// Personal records

export type RecordKind = 'weight' | 'e1rm' | 'volume' | 'reps' | 'duration' | 'distance';

export const RECORD_LABEL: Record<RecordKind, string> = {
  weight: 'Heaviest weight',
  e1rm: 'Best est. 1RM',
  volume: 'Best set volume',
  reps: 'Most reps',
  duration: 'Longest duration',
  distance: 'Longest distance',
};

export const RECORD_KINDS: Record<ExerciseType, RecordKind[]> = {
  weight_reps: ['weight', 'e1rm', 'volume'],
  weighted_bodyweight: ['weight', 'e1rm', 'volume'],
  bodyweight_reps: ['reps'],
  assisted_bodyweight: ['reps'],
  duration: ['duration'],
  weight_duration: ['weight', 'duration'],
  distance_duration: ['distance', 'duration'],
  weight_distance: ['weight', 'distance'],
};

export function recordValue(kind: RecordKind, s: WorkoutSet) {
  switch (kind) {
    case 'weight':
      return s.weight ?? 0;
    case 'e1rm':
      return e1rm(s.weight, s.reps);
    case 'volume':
      return (s.weight ?? 0) * (s.reps ?? 0);
    case 'reps':
      return s.reps ?? 0;
    case 'duration':
      return s.duration ?? 0;
    case 'distance':
      return s.distance ?? 0;
  }
}

export interface RecordEntry {
  value: number;
  set: WorkoutSet;
  workoutId: string;
  time: number;
}

export interface Records {
  /** Record kinds each set broke, keyed by set id. */
  bySet: Map<string, RecordKind[]>;
  /** Number of records broken per workout. */
  byWorkout: Map<string, number>;
  /** All-time best per exercise and kind. */
  best: Map<string, Partial<Record<RecordKind, RecordEntry>>>;
}

/**
 * Walks every workout oldest-first. A set counts as a record when it beats the
 * best value from all earlier workouts, so the first session of an exercise
 * sets the baseline without producing records.
 */
export function computeRecords(workouts: Workout[], typeOf: TypeOf): Records {
  const bySet = new Map<string, RecordKind[]>();
  const byWorkout = new Map<string, number>();
  const best = new Map<string, Partial<Record<RecordKind, RecordEntry>>>();
  const sorted = [...workouts].sort((a, b) => a.startTime - b.startTime);

  for (const w of sorted) {
    let count = 0;
    const sessionBest = new Map<string, Partial<Record<RecordKind, RecordEntry>>>();
    for (const we of w.exercises) {
      const kinds = RECORD_KINDS[typeOf(we.exerciseId)];
      const current = sessionBest.get(we.exerciseId) ?? {};
      for (const s of we.sets) {
        if (s.type === 'warmup' || !s.completed) continue;
        for (const kind of kinds) {
          const value = recordValue(kind, s);
          if (value > 0 && value > (current[kind]?.value ?? 0)) {
            current[kind] = { value, set: s, workoutId: w.id, time: w.startTime };
          }
        }
      }
      sessionBest.set(we.exerciseId, current);
    }
    for (const [exerciseId, session] of sessionBest) {
      const prior = best.get(exerciseId);
      const merged = { ...prior };
      for (const [kind, entry] of Object.entries(session) as [RecordKind, RecordEntry][]) {
        const previous = prior?.[kind];
        if (previous && entry.value > previous.value + 1e-9) {
          bySet.set(entry.set.id, [...(bySet.get(entry.set.id) ?? []), kind]);
          count++;
        }
        if (!previous || entry.value > previous.value) merged[kind] = entry;
      }
      best.set(exerciseId, merged);
    }
    byWorkout.set(w.id, count);
  }
  return { bySet, byWorkout, best };
}

// ---------------------------------------------------------------------------
// Per-exercise history

export type SessionMetric =
  | 'heaviest'
  | 'e1rm'
  | 'bestSetVolume'
  | 'sessionVolume'
  | 'totalReps'
  | 'maxReps'
  | 'maxDuration'
  | 'maxDistance';

export const SESSION_METRIC_LABEL: Record<SessionMetric, string> = {
  heaviest: 'Heaviest weight',
  e1rm: 'Est. 1RM',
  bestSetVolume: 'Best set volume',
  sessionVolume: 'Session volume',
  totalReps: 'Total reps',
  maxReps: 'Most reps',
  maxDuration: 'Longest set',
  maxDistance: 'Distance',
};

export function metricsFor(type: ExerciseType): SessionMetric[] {
  const f = FIELDS[type];
  const out: SessionMetric[] = [];
  if (f.includes('weight') && f.includes('reps') && type !== 'assisted_bodyweight') {
    out.push('heaviest', 'e1rm', 'bestSetVolume', 'sessionVolume');
  } else if (f.includes('weight')) out.push('heaviest');
  if (f.includes('reps')) out.push('maxReps', 'totalReps');
  if (f.includes('duration')) out.push('maxDuration');
  if (f.includes('distance')) out.push('maxDistance');
  return out;
}

export interface Session {
  workout: Workout;
  sets: WorkoutSet[];
  notes: string[];
}

export function sessionsFor(exerciseId: string, workouts: Workout[]): Session[] {
  return workouts
    .filter((w) => w.exerciseIds.includes(exerciseId))
    .sort((a, b) => b.startTime - a.startTime)
    .map((workout) => {
      const blocks = workout.exercises.filter((we) => we.exerciseId === exerciseId);
      return {
        workout,
        sets: blocks.flatMap((b) => b.sets),
        notes: blocks.map((b) => b.notes ?? '').filter(Boolean),
      };
    });
}

export function sessionMetric(metric: SessionMetric, sets: WorkoutSet[]) {
  const working = sets.filter((s) => s.type !== 'warmup');
  const pool = working.length ? working : sets;
  const max = (f: (s: WorkoutSet) => number) => pool.reduce((m, s) => Math.max(m, f(s)), 0);
  switch (metric) {
    case 'heaviest':
      return max((s) => s.weight ?? 0);
    case 'e1rm':
      return max((s) => e1rm(s.weight, s.reps));
    case 'bestSetVolume':
      return max((s) => (s.weight ?? 0) * (s.reps ?? 0));
    case 'sessionVolume':
      return sets.reduce((n, s) => n + (s.weight ?? 0) * (s.reps ?? 0), 0);
    case 'totalReps':
      return sets.reduce((n, s) => n + (s.reps ?? 0), 0);
    case 'maxReps':
      return max((s) => s.reps ?? 0);
    case 'maxDuration':
      return max((s) => s.duration ?? 0);
    case 'maxDistance':
      return max((s) => s.distance ?? 0);
  }
}

/** The set Hevy-style lists call "best set": highest e1RM, else most reps/time/distance. */
export function bestSet(sets: WorkoutSet[], type: ExerciseType) {
  const kinds = RECORD_KINDS[type];
  const key = kinds.includes('e1rm') ? 'e1rm' : kinds[0];
  let best: WorkoutSet | undefined;
  for (const s of sets) {
    if (s.type === 'warmup' && sets.some((x) => x.type !== 'warmup')) continue;
    if (!best || recordValue(key, s) > recordValue(key, best)) best = s;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Weekly aggregates for the profile screen

export interface WeekBucket {
  start: number;
  workouts: number;
  duration: number;
  volume: number;
  reps: number;
  sets: number;
}

export function weeklyBuckets(workouts: Workout[], typeOf: TypeOf, weeks: number, now = Date.now()): WeekBucket[] {
  const first = addDays(startOfWeek(now), -7 * (weeks - 1));
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({
    start: addDays(first, i * 7),
    workouts: 0,
    duration: 0,
    volume: 0,
    reps: 0,
    sets: 0,
  }));
  for (const w of workouts) {
    if (w.startTime < first) continue;
    // Both ends are week starts, so rounding absorbs daylight-saving shifts.
    const i = Math.round((startOfWeek(w.startTime) - first) / (7 * 86_400_000));
    const b = buckets[i];
    if (!b) continue;
    b.workouts++;
    b.duration += Math.max(0, w.endTime - w.startTime) / 1000;
    b.volume += workoutVolume(w, typeOf);
    b.reps += workoutReps(w);
    b.sets += workoutSets(w);
  }
  return buckets;
}

/** Consecutive weeks with at least one workout, counting back from this week (or last week). */
export function weekStreak(workouts: Workout[], now = Date.now()) {
  const weeks = new Set(workouts.map((w) => startOfWeek(w.startTime)));
  let cursor = startOfWeek(now);
  if (!weeks.has(cursor)) cursor = addDays(cursor, -7);
  let streak = 0;
  while (weeks.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -7);
  }
  return streak;
}
