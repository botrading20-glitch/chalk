import type { SetType } from '../types';
import { cellNumber, detectDelimiter, parseCsv } from './csv';
import { KG_PER_LB } from './format';
import type { ParsedExercise, ParsedWorkout } from './importer';
import { t } from '../i18n';

// Strong's CSV export. Strong doesn't publish the format, so this reads what
// users report and what the export has looked like across versions:
//   Date, Workout Name, Duration, Exercise Name, Set Order, Weight, [Weight Unit],
//   Reps, Distance, [Distance Unit], Seconds, Notes, Workout Notes, RPE
// Weight carries no unit in older files, which is why a file can come back with
// `needsWeightUnit` and the caller asks which one it was.

export type WeightUnitGuess = 'kg' | 'lbs';

export interface ReadOptions {
  /** Used when the file doesn't say which unit its weights are in. */
  weightUnit: WeightUnitGuess;
}

export interface ReadResult {
  workouts: ParsedWorkout[];
  /** True when the weights had no unit in the file, so `weightUnit` was applied. */
  needsWeightUnit: boolean;
}

const MI = 1.609344;

/** "2026-09-24 21:30:12" (local), with or without seconds; anything else goes through Date.parse. */
export function parseLocalDate(s: string): number | undefined {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)).getTime();
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : t;
}

/** "1h 3m", "45m", "1h", "1:03:00" or plain seconds, in milliseconds. */
export function parseDuration(s: string | undefined): number {
  if (!s) return 0;
  const text = s.trim().toLowerCase();
  const clock = text.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (clock) {
    const [h, m, sec] = clock[3] === undefined ? [0, Number(clock[1]), Number(clock[2])] : [Number(clock[1]), Number(clock[2]), Number(clock[3])];
    return (h * 3600 + m * 60 + sec) * 1000;
  }
  const value = (re: RegExp) => Number(text.match(re)?.[1]?.replace(',', '.') ?? 0);
  if (/[hms]/.test(text)) {
    return (value(/(\d+(?:[.,]\d+)?)\s*h/) * 3600 + value(/(\d+(?:[.,]\d+)?)\s*m/) * 60 + value(/(\d+(?:[.,]\d+)?)\s*s/)) * 1000;
  }
  return (cellNumber(text) ?? 0) * 1000;
}

/** Set Order "W", "D" and "F" are warm-up, drop and failure sets; numbers are working sets; anything else (a rest-timer row) isn't a set. */
function setKind(order: string): { type: SetType; index?: number } | undefined {
  const o = order.trim().toUpperCase();
  if (o === 'W') return { type: 'warmup' };
  if (o === 'D') return { type: 'dropset' };
  if (o === 'F') return { type: 'failure' };
  const n = cellNumber(o);
  return n === undefined ? undefined : { type: 'normal', index: n };
}

const isPounds = (unit: string) => /^(lb|lbs|pound|pounds)$/.test(unit);

function distanceKm(v: number | undefined, unit: string) {
  if (!v) return undefined;
  if (/^(mi|mile|miles)$/.test(unit)) return v * MI;
  if (/^(km|kilometer|kilometers|kilometre|kilometres)$/.test(unit)) return v;
  // Strong stores distance in meters.
  return v / 1000;
}

export function isStrongHeader(header: string[]) {
  const names = header.map((h) => h.trim().toLowerCase());
  return names.includes('exercise name') && names.includes('set order');
}

export function parseStrongCsv(text: string, options: ReadOptions): ReadResult {
  const [header = [], ...rows] = parseCsv(text, detectDelimiter(text));
  if (!isStrongHeader(header)) {
    throw new Error(t('error.notStrong'));
  }
  const names = header.map((h) => h.trim().toLowerCase());
  const at = (name: string) => names.findIndex((n) => n === name || n.startsWith(`${name} (`));
  const col = {
    date: at('date'),
    title: at('workout name'),
    duration: at('duration'),
    exercise: at('exercise name'),
    order: at('set order'),
    weight: at('weight'),
    weightUnit: at('weight unit'),
    reps: at('reps'),
    distance: at('distance'),
    distanceUnit: at('distance unit'),
    seconds: at('seconds'),
    notes: at('notes'),
    workoutNotes: at('workout notes'),
    rpe: at('rpe'),
  };
  const get = (row: string[], i: number) => (i < 0 ? undefined : row[i]);
  // A unit in the header ("Weight (kg)") counts the same as a unit column.
  const headerUnit = (i: number) => (i < 0 ? '' : (names[i].match(/\(([^)]+)\)/)?.[1] ?? '').trim());
  const knowsWeightUnit = col.weightUnit >= 0 || headerUnit(col.weight) !== '';

  const workouts = new Map<string, ParsedWorkout>();
  let block: ParsedExercise | undefined;
  let lastIndex = 0;
  for (const row of rows) {
    const startTime = parseLocalDate(get(row, col.date) ?? '');
    const kind = setKind(get(row, col.order) ?? '');
    if (startTime === undefined || !kind) continue;
    const title = get(row, col.title)?.trim() || t('import.defaultWorkout');
    const key = `${title}|${get(row, col.date)}`;
    let w = workouts.get(key);
    if (!w) {
      w = {
        title,
        description: get(row, col.workoutNotes)?.trim() || undefined,
        startTime,
        endTime: startTime + parseDuration(get(row, col.duration)),
        exercises: [],
      };
      workouts.set(key, w);
      block = undefined;
      lastIndex = 0;
    }

    const name = get(row, col.exercise)?.trim() || t('import.unknownExercise');
    // The same exercise again later is a new block: its numbering restarts, or a warm-up follows working sets.
    const restarts = kind.index !== undefined ? kind.index <= lastIndex : kind.type === 'warmup' && lastIndex > 0;
    if (!block || w.exercises.at(-1) !== block || block.name !== name || restarts) {
      block = { name, notes: get(row, col.notes)?.trim() || undefined, sets: [] };
      w.exercises.push(block);
      lastIndex = 0;
    }
    if (kind.index !== undefined) lastIndex = kind.index;
    block.notes ??= get(row, col.notes)?.trim() || undefined;

    const unit = (get(row, col.weightUnit) ?? headerUnit(col.weight)).trim().toLowerCase();
    const raw = cellNumber(get(row, col.weight));
    const pounds = unit ? isPounds(unit) : options.weightUnit === 'lbs';
    const dUnit = (get(row, col.distanceUnit) ?? headerUnit(col.distance)).trim().toLowerCase();
    block.sets.push({
      type: kind.type,
      weight: raw ? (pounds ? raw * KG_PER_LB : raw) : undefined,
      reps: cellNumber(get(row, col.reps)) || undefined,
      distance: distanceKm(cellNumber(get(row, col.distance)), dUnit),
      duration: cellNumber(get(row, col.seconds)) || undefined,
      rpe: cellNumber(get(row, col.rpe)) || undefined,
    });
  }
  return { workouts: [...workouts.values()].sort((a, b) => a.startTime - b.startTime), needsWeightUnit: !knowsWeightUnit };
}
