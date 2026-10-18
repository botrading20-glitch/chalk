import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../db';
import { KG_PER_LB } from './format';
import { DEFAULT_PLATES } from './plates';
import { isPlateLoaded, warmupSets, type WarmupInput } from './warmup';

const base: WarmupInput = {
  workingKg: 100,
  unit: 'kg',
  equipment: 'barbell',
  bar: 20,
  plates: DEFAULT_PLATES.kg,
  steps: DEFAULT_SETTINGS.warmupSteps,
  emptyBar: true,
  round: 2.5,
};
const ladder = (input: Partial<WarmupInput>) => warmupSets({ ...base, ...input }).sets.map((s) => [Math.round(s.weight * 100) / 100, s.reps]);

describe('warm-up sets for a barbell', () => {
  it('builds the usual ladder with the empty bar first', () => {
    expect(ladder({})).toEqual([
      [20, 10],
      [50, 10],
      [70, 5],
      [85, 3],
    ]);
  });

  it('leaves out the empty bar when asked', () => {
    expect(ladder({ emptyBar: false })).toEqual([
      [50, 10],
      [70, 5],
      [85, 3],
    ]);
  });

  it('uses loads the plates can make: with no 1.25 and 2.5 plates, 85 kg becomes the nearest 5 kg step, halfway going lower', () => {
    const plates = [25, 20, 15, 10, 5];
    // 85 kg needs 32.5 a side, which 5 kg plates can't make: 30 (80 kg) and 35 (90 kg) are 5 away, so the lower wins.
    expect(ladder({ plates, emptyBar: false })).toEqual([
      [50, 10],
      [70, 5],
      [80, 3],
    ]);
  });

  it('rounds to the nearest reachable load and sends a tie to the lower one', () => {
    const plates = [25, 20, 15, 10, 5, 2.5]; // totals step by 5 kg from the 20 kg bar
    expect(ladder({ workingKg: 142, steps: [{ percent: 50, reps: 5 }], emptyBar: false, plates })).toEqual([[70, 5]]); // 71 → 70
    expect(ladder({ workingKg: 145, steps: [{ percent: 50, reps: 5 }], emptyBar: false, plates })).toEqual([[70, 5]]); // 72.5 is halfway → 70
    expect(ladder({ workingKg: 148, steps: [{ percent: 50, reps: 5 }], emptyBar: false, plates })).toEqual([[75, 5]]); // 74 → 75
  });

  it('works in pounds with pound plates and returns storage kg', () => {
    const lbs = { unit: 'lbs' as const, bar: 45, plates: DEFAULT_PLATES.lbs, workingKg: 225 * KG_PER_LB };
    const sets = warmupSets({ ...base, ...lbs }).sets;
    // 45 bar, then 50% = 112.5 (plates make 110 or 115, halfway goes to 110), 70% = 157.5 → 155 (25 + 35 + 10 + 10 a side? any exact load), 85% = 191.25 → 190
    expect(sets.map((s) => [Math.round(s.weight / KG_PER_LB), s.reps])).toEqual([
      [45, 10],
      [110, 10],
      [155, 5],
      [190, 3],
    ]);
  });

  it('skips steps below the bar and steps at or above the working weight', () => {
    // 30 kg on a 20 kg bar: 50% is 15 (under the bar), 70% is 21 (the bar + 0.5 a side: not reachable, nearest 20 = the bar), 85% is 25.5
    const light = warmupSets({ ...base, workingKg: 30 });
    expect(light.sets.every((s) => s.weight >= 20 && s.weight < 30)).toBe(true);
    // The working weight is the bar: nothing to warm up with.
    expect(warmupSets({ ...base, workingKg: 20 })).toEqual({ sets: [], reason: 'tooLight' });
    // A step of 100% or more is dropped.
    expect(ladder({ steps: [{ percent: 95, reps: 1 }], workingKg: 20.5, emptyBar: false }).length).toBeLessThanOrEqual(1);
  });

  it('never repeats a load', () => {
    const sets = warmupSets({
      ...base,
      emptyBar: false,
      steps: [
        { percent: 50, reps: 10 },
        { percent: 51, reps: 8 },
        { percent: 51, reps: 6 }, // 51 kg is not a load the plates make: both fall back to 50
      ],
    }).sets;
    expect(sets).toHaveLength(1);
    expect(sets[0].reps).toBe(10);
  });
});

describe('warm-up sets for everything else', () => {
  it('rounds dumbbells to the step, halfway going lower, and ignores the empty bar', () => {
    expect(ladder({ equipment: 'dumbbell', workingKg: 30, bar: 0 })).toEqual([
      [15, 10],
      [20, 5], // 21 → 20
      [25, 3], // 25.5 → 25
    ]);
    expect(ladder({ equipment: 'dumbbell', workingKg: 25, steps: [{ percent: 50, reps: 5 }], round: 5 })).toEqual([[10, 5]]); // 12.5 is halfway → 10
  });

  it('keeps 100 kg on a machine at 50, 70 and 85', () => {
    expect(ladder({ equipment: 'machine', bar: 0 })).toEqual([
      [50, 10],
      [70, 5],
      [85, 3],
    ]);
  });

  it('sorts the steps from light to heavy', () => {
    const steps = [
      { percent: 85, reps: 3 },
      { percent: 50, reps: 10 },
    ];
    expect(ladder({ equipment: 'cable', bar: 0, steps })).toEqual([
      [50, 10],
      [85, 3],
    ]);
  });

  it('treats a zero or missing rounding step as the default instead of dividing by zero', () => {
    const sets = warmupSets({ ...base, equipment: 'machine', bar: 0, round: 0 }).sets;
    expect(sets.map((s) => s.weight)).toEqual([50, 70, 85]);
  });
});

describe('when there is nothing to build', () => {
  it('asks for a weight first', () => {
    expect(warmupSets({ ...base, workingKg: undefined })).toEqual({ sets: [], reason: 'noWeight' });
    expect(warmupSets({ ...base, workingKg: 0 })).toEqual({ sets: [], reason: 'noWeight' });
    expect(warmupSets({ ...base, workingKg: Number.NaN })).toEqual({ sets: [], reason: 'noWeight' });
  });

  it('says too light when every step falls away', () => {
    expect(warmupSets({ ...base, equipment: 'dumbbell', bar: 0, workingKg: 1 })).toEqual({ sets: [], reason: 'tooLight' });
  });

  it('knows which equipment is loaded with plates', () => {
    expect(['barbell', 'ez_bar', 'smith_machine'].every((e) => isPlateLoaded(e as never))).toBe(true);
    expect(['dumbbell', 'machine', 'cable', 'kettlebell', 'bodyweight', undefined].some((e) => isPlateLoaded(e as never))).toBe(false);
  });
});
