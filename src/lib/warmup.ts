import type { Equipment, WarmupStep, WeightUnit } from '../types';
import { kgTo, toKg } from './format';
import { calculatePlates } from './plates';

// The warm-up calculator: from a working weight to a short ladder of lighter sets.
// Pure, so the rules can be tested without the editor. Everything inside works in
// the user's unit (kg or lbs); only the result goes back to storage kg.

/** Exercises loaded with plates on a bar: the calculator picks loads the plates can make. */
export function isPlateLoaded(equipment: Equipment | undefined) {
  return equipment === 'barbell' || equipment === 'ez_bar' || equipment === 'smith_machine';
}

/** Reps of the optional first set with just the bar. */
export const EMPTY_BAR_REPS = 10;

export interface WarmupInput {
  /** The working weight in storage kg; empty or zero asks for a weight first. */
  workingKg: number | undefined;
  unit: WeightUnit;
  equipment: Equipment | undefined;
  /** Bar weight in `unit` (0 for none); only plate-loaded exercises use it. */
  bar: number;
  /** Plate sizes owned, in `unit`. */
  plates: number[];
  steps: WarmupStep[];
  /** Start with the empty bar (plate-loaded exercises with a bar lighter than the working weight). */
  emptyBar: boolean;
  /** Round other loads to this step, in `unit`. */
  round: number;
}

export interface WarmupSet {
  /** Storage kg. */
  weight: number;
  reps: number;
}

export interface WarmupResult {
  sets: WarmupSet[];
  /** Why there are no sets: no working weight yet, or one too light to warm up for. */
  reason?: 'noWeight' | 'tooLight';
}

/** The multiple of `step` nearest to `value`; halfway goes to the lower one. */
function nearestStep(value: number, step: number) {
  return Math.round(Math.ceil(value / step - 0.5 - 1e-9) * step * 1000) / 1000;
}

export function warmupSets(input: WarmupInput): WarmupResult {
  const { workingKg, unit, bar, plates, emptyBar } = input;
  if (workingKg === undefined || !(workingKg > 0)) return { sets: [], reason: 'noWeight' };
  const working = Math.round(kgTo(workingKg, unit) * 100) / 100;
  const plateLoaded = isPlateLoaded(input.equipment);
  const step = input.round > 0 ? input.round : unit === 'kg' ? 2.5 : 5;

  const loads: { load: number; reps: number }[] = [];
  if (plateLoaded && emptyBar && bar > 0 && bar < working) loads.push({ load: bar, reps: EMPTY_BAR_REPS });

  for (const { percent, reps } of [...input.steps].sort((a, b) => a.percent - b.percent)) {
    const target = (working * percent) / 100;
    let load: number | undefined;
    if (plateLoaded) {
      const r = calculatePlates(target, bar, plates);
      if (r.underBar || r.tooHeavy) continue;
      if (r.exact) load = r.exact.total;
      else {
        // Nearest load the plates can make; halfway goes to the lower one.
        const { below, above } = r;
        load = below && above ? (target - below.total <= above.total - target ? below.total : above.total) : (below ?? above)?.total;
      }
    } else {
      load = nearestStep(target, step);
    }
    // A warm-up is lighter than the work, heavier than nothing, and not the same as the set before it.
    if (load === undefined || load <= 0 || load >= working) continue;
    if (loads.length && Math.abs(loads.at(-1)!.load - load) < 1e-6) continue;
    loads.push({ load, reps });
  }

  if (!loads.length) return { sets: [], reason: 'tooLight' };
  return { sets: loads.map(({ load, reps }) => ({ weight: Math.round(toKg(load, unit) * 1e6) / 1e6, reps })) };
}
