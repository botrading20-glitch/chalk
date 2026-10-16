import { db } from '../db';
import type { Equipment, Exercise, ExerciseType, Muscle, SetType, Workout, WorkoutSet } from '../types';
import { detectDelimiter, parseCsv } from './csv';
import { isSetwardHeader, parseSetwardCsv } from './exportCsv';
import { uid } from './format';
import { normalize } from './search';
import { isStrongHeader, parseStrongCsv, type ReadOptions } from './strong';
import { t } from '../i18n';

// Format-neutral import pipeline. Each file format (Strong, Setward's own CSV)
// parses into ParsedWorkout; planImport matches the exercises against the
// library and the user's own, and applyImport writes the result.

export interface ParsedSet {
  type: SetType;
  weight?: number;
  reps?: number;
  distance?: number;
  duration?: number;
  rpe?: number;
}

export interface ParsedExercise {
  name: string;
  notes?: string;
  supersetId?: number;
  sets: ParsedSet[];
}

export interface ParsedWorkout {
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  exercises: ParsedExercise[];
}

// ---------------------------------------------------------------------------
// Guessing metadata for exercises the file has but Setward does not

const MUSCLE_RULES: [RegExp, Muscle][] = [
  [/cycl|bike|running|\brun\b|treadmill|elliptical|stair|rowing machine|jump rope|cardio|walk/, 'cardio'],
  [/tricep|pushdown|push down|skull|kickback(?!.*glute)|overhead.*extension|dip/, 'triceps'],
  [/wrist|forearm|reverse curl|grip/, 'forearms'],
  [/brachialis|hammer|bicep|preacher|curl(?!.*leg)/, 'biceps'],
  [/rear delt|reverse fly|face pull/, 'shoulders'],
  [/shrug/, 'traps'],
  [/lateral raise|side delt|front raise|shoulder|delt|overhead press|military|arnold|upright row|y raise/, 'shoulders'],
  [/pulldown|pull down|pull up|pullup|chin up|\blat\b|\blats\b/, 'lats'],
  [/hyperextension|back extension|good morning/, 'lower_back'],
  [/\brow/, 'upper_back'],
  [/chest|bench|fly|flye|crossover|pec|push up|pushup/, 'chest'],
  [/leg curl|hamstring|romanian|rdl|nordic/, 'hamstrings'],
  [/hip thrust|glute|bridge/, 'glutes'],
  [/calf|calve/, 'calves'],
  [/abduct/, 'abductors'],
  [/adduct/, 'adductors'],
  [/leg extension|squat|leg press|lunge|hack|step up/, 'quadriceps'],
  [/deadlift/, 'hamstrings'],
  [/crunch|plank|sit up|situp|\babs?\b|leg raise|knee raise|oblique|russian twist/, 'abdominals'],
];

const EQUIPMENT_RULES: [RegExp, Equipment][] = [
  [/smith/, 'smith_machine'],
  [/cable|rope/, 'cable'],
  [/machine/, 'machine'],
  [/dumbbell/, 'dumbbell'],
  [/ez bar|ez curl/, 'ez_bar'],
  [/barbell/, 'barbell'],
  [/kettlebell/, 'kettlebell'],
  [/band/, 'band'],
  [/bodyweight|push up|pull up|chin up|dip|plank/, 'bodyweight'],
];

function guessMuscle(name: string): Muscle {
  const n = normalize(name);
  return MUSCLE_RULES.find(([re]) => re.test(n))?.[1] ?? 'other';
}

function guessEquipment(name: string): Equipment {
  const n = normalize(name);
  return EQUIPMENT_RULES.find(([re]) => re.test(n))?.[1] ?? 'other';
}

function guessType(sets: ParsedSet[]): ExerciseType {
  const has = (k: keyof ParsedSet) => sets.some((s) => ((s[k] as number | undefined) ?? 0) > 0);
  if (has('distance')) return has('weight') ? 'weight_distance' : 'distance_duration';
  if (has('duration') && !has('reps')) return has('weight') ? 'weight_duration' : 'duration';
  if (has('weight')) return 'weight_reps';
  return 'bodyweight_reps';
}

/** Same start (to the second, which is all most files carry) and title: the workout is already here. */
const duplicateKey = (w: { startTime: number; title: string }) => `${Math.floor(w.startTime / 1000)}|${w.title}`;

export interface ImportPlan {
  workouts: Workout[];
  newExercises: Exercise[];
  matchedExercises: number;
  duplicates: number;
}

export async function planImport(parsed: ParsedWorkout[]): Promise<ImportPlan> {
  const existing = await db.exercises.toArray();
  // Custom exercises win over library ones with the same name.
  const byName = new Map<string, Exercise>();
  // A library exercise the user replaced with their own version imports as that version.
  const replacement = new Map(existing.flatMap((x) => (x.replaces ? [[x.replaces, x] as const] : [])));
  for (const e of existing.filter((x) => x.source === 'library')) byName.set(normalize(e.name), replacement.get(e.id) ?? e);
  for (const e of existing.filter((x) => x.source === 'custom')) byName.set(normalize(e.name), e);

  const newExercises: Exercise[] = [];
  const matched = new Set<string>();
  const setsByName = new Map<string, ParsedSet[]>();
  for (const w of parsed) {
    for (const ex of w.exercises) {
      const key = normalize(ex.name);
      setsByName.set(key, [...(setsByName.get(key) ?? []), ...ex.sets]);
    }
  }
  for (const w of parsed) {
    for (const ex of w.exercises) {
      const key = normalize(ex.name);
      if (byName.has(key)) {
        if (!newExercises.some((n) => normalize(n.name) === key)) matched.add(key);
        continue;
      }
      const created: Exercise = {
        id: `cus-${uid()}`,
        name: ex.name,
        type: guessType(setsByName.get(key) ?? []),
        equipment: guessEquipment(ex.name),
        primaryMuscle: guessMuscle(ex.name),
        secondaryMuscles: [],
        instructions: [],
        images: [],
        source: 'custom',
      };
      byName.set(key, created);
      newExercises.push(created);
    }
  }

  const seen = new Set((await db.workouts.toArray()).map(duplicateKey));
  const workouts: Workout[] = [];
  let duplicates = 0;
  for (const w of parsed) {
    if (seen.has(duplicateKey(w))) {
      duplicates++;
      continue;
    }
    const exercises = w.exercises.map((ex) => ({
      id: uid(),
      exerciseId: byName.get(normalize(ex.name))!.id,
      notes: ex.notes,
      supersetId: ex.supersetId,
      sets: ex.sets.map(
        (s): WorkoutSet => ({
          id: uid(),
          type: s.type,
          weight: s.weight,
          reps: s.reps,
          distance: s.distance,
          duration: s.duration,
          rpe: s.rpe,
          completed: true,
        }),
      ),
    }));
    workouts.push({
      id: uid(),
      title: w.title,
      description: w.description,
      startTime: w.startTime,
      endTime: Math.max(w.endTime, w.startTime),
      exercises,
      exerciseIds: [...new Set(exercises.map((e) => e.exerciseId))],
    });
  }
  return { workouts, newExercises, matchedExercises: matched.size, duplicates };
}

export async function applyImport(plan: ImportPlan) {
  await db.transaction('rw', db.exercises, db.workouts, async () => {
    await db.exercises.bulkAdd(plan.newExercises);
    await db.workouts.bulkAdd(plan.workouts);
  });
}

// ---------------------------------------------------------------------------
// Reading a file: Strong's export or Setward's own CSV, told apart by the header

export type ImportFormat = 'strong' | 'setward';

export interface FileReading {
  format: ImportFormat;
  workouts: ParsedWorkout[];
  /** The file has weights but no unit, so the caller's guess was used and the user should confirm it. */
  needsWeightUnit: boolean;
}

export function readWorkoutCsv(text: string, options: ReadOptions): FileReading {
  const [header = []] = parseCsv(text, detectDelimiter(text));
  if (isSetwardHeader(header)) return { format: 'setward', workouts: parseSetwardCsv(text), needsWeightUnit: false };
  if (isStrongHeader(header)) return { format: 'strong', ...parseStrongCsv(text, options) };
  throw new Error(t('error.importUnknown'));
}
