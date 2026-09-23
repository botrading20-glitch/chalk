import { db } from '../db';
import type { Equipment, Exercise, ExerciseType, Muscle, SetType, Workout, WorkoutSet } from '../types';
import { parseCsv, toCsv } from './csv';
import { uid } from './format';
import { normalize } from './search';

// Hevy's "Export workouts" CSV. Weight and distance columns follow the account's
// unit setting, so both metric and imperial variants are accepted.

interface ParsedSet {
  type: SetType;
  weight?: number;
  reps?: number;
  distance?: number;
  duration?: number;
  rpe?: number;
}

interface ParsedExercise {
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

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const LB = 2.20462262;
const MI = 1.609344;

export function parseHevyDate(s: string): number | undefined {
  const m = s.trim().match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (m) {
    const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    if (month >= 0) {
      let hours = Number(m[4]);
      if (m[7]) hours = (hours % 12) + (m[7].toLowerCase() === 'pm' ? 12 : 0);
      return new Date(Number(m[3]), month, Number(m[1]), hours, Number(m[5]), Number(m[6] ?? 0)).getTime();
    }
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : t;
}

function fmtHevyDate(ts: number) {
  const d = new Date(ts);
  const month = MONTHS[d.getMonth()];
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()} ${month[0].toUpperCase()}${month.slice(1)} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const num = (s: string | undefined) => {
  if (s === undefined || s.trim() === '') return undefined;
  const v = Number(s.replace(',', '.'));
  return Number.isFinite(v) ? v : undefined;
};

const SET_TYPES: SetType[] = ['normal', 'warmup', 'failure', 'dropset'];

export function parseHevyCsv(text: string): ParsedWorkout[] {
  const [header, ...rows] = parseCsv(text);
  const col = new Map(header?.map((h, i) => [h.trim().toLowerCase(), i]));
  for (const required of ['title', 'start_time', 'exercise_title']) {
    if (!col.has(required)) {
      throw new Error(`This file isn't a Hevy workout export: the "${required}" column is missing.`);
    }
  }
  const get = (row: string[], name: string) => {
    const i = col.get(name);
    return i === undefined ? undefined : row[i];
  };

  const workouts = new Map<string, ParsedWorkout>();
  let lastSetIndex = -1;
  for (const row of rows) {
    const title = get(row, 'title')?.trim() || 'Workout';
    const startRaw = get(row, 'start_time') ?? '';
    const startTime = parseHevyDate(startRaw);
    if (startTime === undefined) continue;
    const key = `${title}|${startRaw}`;
    let w = workouts.get(key);
    if (!w) {
      w = {
        title,
        description: get(row, 'description') || undefined,
        startTime,
        endTime: parseHevyDate(get(row, 'end_time') ?? '') ?? startTime,
        exercises: [],
      };
      workouts.set(key, w);
      lastSetIndex = -1;
    }

    const name = get(row, 'exercise_title')?.trim() || 'Unknown exercise';
    const setIndex = num(get(row, 'set_index')) ?? 0;
    let block = w.exercises.at(-1);
    // A repeated exercise shows up as a new run whose set_index restarts at 0.
    if (!block || block.name !== name || setIndex <= lastSetIndex) {
      block = {
        name,
        notes: get(row, 'exercise_notes') || undefined,
        supersetId: num(get(row, 'superset_id')),
        sets: [],
      };
      w.exercises.push(block);
    }
    lastSetIndex = setIndex;

    const lbs = num(get(row, 'weight_lbs'));
    const miles = num(get(row, 'distance_miles'));
    const rawType = (get(row, 'set_type') ?? 'normal').trim().toLowerCase() as SetType;
    block.sets.push({
      type: SET_TYPES.includes(rawType) ? rawType : 'normal',
      weight: num(get(row, 'weight_kg')) ?? (lbs !== undefined ? lbs / LB : undefined),
      reps: num(get(row, 'reps')),
      distance: num(get(row, 'distance_km')) ?? (miles !== undefined ? miles * MI : undefined),
      duration: num(get(row, 'duration_seconds')),
      rpe: num(get(row, 'rpe')),
    });
  }
  return [...workouts.values()].sort((a, b) => a.startTime - b.startTime);
}

// ---------------------------------------------------------------------------
// Guessing metadata for exercises that only exist in the user's Hevy account

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

export interface ImportPlan {
  workouts: Workout[];
  newExercises: Exercise[];
  matchedExercises: number;
  duplicates: number;
}

export async function planHevyImport(parsed: ParsedWorkout[]): Promise<ImportPlan> {
  const existing = await db.exercises.toArray();
  // Custom exercises win over library ones with the same name.
  const byName = new Map<string, Exercise>();
  for (const e of existing.filter((x) => x.source === 'library')) byName.set(normalize(e.name), e);
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

  const seen = new Set((await db.workouts.toArray()).map((w) => `${w.startTime}|${w.title}`));
  const workouts: Workout[] = [];
  let duplicates = 0;
  for (const w of parsed) {
    if (seen.has(`${w.startTime}|${w.title}`)) {
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

export function toHevyCsv(workouts: Workout[], exercises: Map<string, Exercise>) {
  const rows: (string | number | undefined)[][] = [
    ['title', 'start_time', 'end_time', 'description', 'exercise_title', 'superset_id', 'exercise_notes', 'set_index', 'set_type', 'weight_kg', 'reps', 'distance_km', 'duration_seconds', 'rpe'],
  ];
  const round = (v: number | undefined, d = 2) => (v === undefined ? undefined : Number(v.toFixed(d)));
  for (const w of [...workouts].sort((a, b) => b.startTime - a.startTime)) {
    for (const we of w.exercises) {
      we.sets.forEach((s, i) => {
        rows.push([
          w.title,
          fmtHevyDate(w.startTime),
          fmtHevyDate(w.endTime),
          w.description ?? '',
          exercises.get(we.exerciseId)?.name ?? 'Unknown exercise',
          we.supersetId,
          we.notes ?? '',
          i,
          s.type,
          round(s.weight),
          s.reps,
          round(s.distance),
          s.duration,
          s.rpe,
        ]);
      });
    }
  }
  return toCsv(rows);
}
