import type { Equipment, WeightUnit } from '../types';

// Plate maths for the plate calculator. Everything here works in the unit the
// user trains in (kg plates for kg, lb plates for lbs), not in storage kg.

export const DEFAULT_PLATES: Record<WeightUnit, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lbs: [45, 35, 25, 10, 5, 2.5],
};

export const BAR_OPTIONS: Record<WeightUnit, number[]> = {
  kg: [20, 15, 10, 0],
  lbs: [45, 35, 25, 0],
};

/** Starting bar weight when an exercise has none remembered. */
export function defaultBar(equipment: Equipment | undefined, unit: WeightUnit) {
  const [olympic, , ez] = BAR_OPTIONS[unit];
  if (equipment === 'barbell') return olympic;
  if (equipment === 'ez_bar') return ez;
  // Plate-loaded machines, Smith machines (bar weights vary a lot) and the rest.
  return 0;
}

export interface Load {
  /** Plates on one side, heaviest first. */
  perSide: number[];
  /** Bar plus both sides. */
  total: number;
}

export interface PlateResult {
  /** Exactly the target, with as few plates as possible. */
  exact?: Load;
  /** Nearest loads below and above when the target can't be made. */
  below?: Load;
  above?: Load;
  /** The target is lighter than the empty bar. */
  underBar: boolean;
}

const UNIT = 100; // work in hundredths so 1.25 and 2.5 stay integers

/**
 * Fewest plates for every per-side amount up to `max` (in hundredths), with
 * any number of each plate size. Greedy isn't enough once the user leaves out
 * sizes: with only 15s and 10s, 20 per side is 10 + 10, not 15 + a gap.
 */
function solve(max: number, plates: number[]) {
  const sizes = [...new Set(plates.map((p) => Math.round(p * UNIT)))].filter((p) => p > 0).sort((a, b) => b - a);
  const count = new Int32Array(max + 1).fill(-1);
  const last = new Int32Array(max + 1);
  count[0] = 0;
  for (let amount = 1; amount <= max; amount++) {
    for (const size of sizes) {
      if (size > amount || count[amount - size] < 0) continue;
      const n = count[amount - size] + 1;
      if (count[amount] < 0 || n < count[amount]) {
        count[amount] = n;
        last[amount] = size;
      }
    }
  }
  const platesFor = (amount: number) => {
    const out: number[] = [];
    for (let a = amount; a > 0; a -= last[a]) out.push(last[a] / UNIT);
    return out.sort((x, y) => y - x);
  };
  return { reachable: (amount: number) => amount >= 0 && amount <= max && count[amount] >= 0, platesFor };
}

export function calculatePlates(target: number, bar: number, plates: number[]): PlateResult {
  const side = Math.round(((target - bar) / 2) * UNIT);
  if (side < 0) return { underBar: true };
  const biggest = Math.round(Math.max(0, ...plates) * UNIT);
  const { reachable, platesFor } = solve(side + biggest, plates);
  const load = (amount: number): Load => {
    const perSide = platesFor(amount);
    return { perSide, total: Math.round((bar + (2 * amount) / UNIT) * UNIT) / UNIT };
  };

  if (reachable(side)) return { exact: load(side), underBar: false };
  let lo = side - 1;
  while (lo > 0 && !reachable(lo)) lo--;
  let hi = side + 1;
  while (hi <= side + biggest && !reachable(hi)) hi++;
  return { below: load(Math.max(lo, 0)), above: reachable(hi) ? load(hi) : undefined, underBar: false };
}
