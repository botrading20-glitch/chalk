import type { Exercise, SetType, Workout } from '../types';
import { cellNumber, detectDelimiter, parseCsv, toCsv } from './csv';
import type { ParsedExercise, ParsedWorkout } from './importer';
import { parseLocalDate } from './strong';
import { t } from '../i18n';

// Setward's own CSV: one row per set, newest workout first. Column names carry
// the units (weight_kg, distance_km, duration_s) because stored values are
// always kg, km and seconds, whatever units the app displays. Dates are local
// time, "2026-09-24 21:30:12", like a spreadsheet would show them.

export const SETWARD_CSV_HEADER = [
  'workout',
  'date',
  'end',
  'notes',
  'exercise',
  'superset',
  'exercise_notes',
  'set',
  'set_type',
  'weight_kg',
  'reps',
  'distance_km',
  'duration_s',
  'rpe',
];

const SET_TYPES: SetType[] = ['normal', 'warmup', 'failure', 'dropset'];

const pad = (n: number) => String(n).padStart(2, '0');

export function fmtCsvDate(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function toSetwardCsv(workouts: Workout[], exercises: Map<string, Exercise>) {
  const rows: (string | number | undefined)[][] = [SETWARD_CSV_HEADER];
  // Float noise (61.234000000000002) isn't worth a spreadsheet column.
  const round = (v: number | undefined, d = 3) => (v === undefined ? undefined : Number(v.toFixed(d)));
  for (const w of [...workouts].sort((a, b) => b.startTime - a.startTime)) {
    for (const we of w.exercises) {
      we.sets.forEach((s, i) => {
        rows.push([
          w.title,
          fmtCsvDate(w.startTime),
          fmtCsvDate(w.endTime),
          w.description ?? '',
          exercises.get(we.exerciseId)?.name ?? 'Unknown exercise',
          we.supersetId,
          we.notes ?? '',
          i + 1,
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

export function isSetwardHeader(header: string[]) {
  const names = header.map((h) => h.trim().toLowerCase());
  return names.includes('set_type') && names.includes('weight_kg') && names.includes('exercise');
}

export function parseSetwardCsv(text: string): ParsedWorkout[] {
  const [header = [], ...rows] = parseCsv(text, detectDelimiter(text));
  if (!isSetwardHeader(header)) throw new Error(t('error.notSetwardCsv'));
  const col = new Map(header.map((h, i) => [h.trim().toLowerCase(), i]));
  const get = (row: string[], name: string) => {
    const i = col.get(name);
    return i === undefined ? undefined : row[i];
  };

  const workouts = new Map<string, ParsedWorkout>();
  let lastSet = 0;
  for (const row of rows) {
    const startTime = parseLocalDate(get(row, 'date') ?? '');
    if (startTime === undefined) continue;
    const title = get(row, 'workout')?.trim() || t('import.defaultWorkout');
    const key = `${title}|${get(row, 'date')}`;
    let w = workouts.get(key);
    if (!w) {
      w = {
        title,
        description: get(row, 'notes')?.trim() || undefined,
        startTime,
        endTime: Math.max(startTime, parseLocalDate(get(row, 'end') ?? '') ?? startTime),
        exercises: [],
      };
      workouts.set(key, w);
      lastSet = 0;
    }
    const name = get(row, 'exercise')?.trim() || t('import.unknownExercise');
    const index = cellNumber(get(row, 'set')) ?? lastSet + 1;
    let block: ParsedExercise | undefined = w.exercises.at(-1);
    // A repeated exercise is a new run whose set number starts again.
    if (!block || block.name !== name || index <= lastSet) {
      block = {
        name,
        notes: get(row, 'exercise_notes')?.trim() || undefined,
        supersetId: cellNumber(get(row, 'superset')),
        sets: [],
      };
      w.exercises.push(block);
    }
    lastSet = index;
    const type = (get(row, 'set_type') ?? 'normal').trim().toLowerCase() as SetType;
    block.sets.push({
      type: SET_TYPES.includes(type) ? type : 'normal',
      weight: cellNumber(get(row, 'weight_kg')),
      reps: cellNumber(get(row, 'reps')),
      distance: cellNumber(get(row, 'distance_km')),
      duration: cellNumber(get(row, 'duration_s')),
      rpe: cellNumber(get(row, 'rpe')),
    });
  }
  return [...workouts.values()].sort((a, b) => a.startTime - b.startTime);
}
