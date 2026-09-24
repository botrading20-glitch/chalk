import { describe, expect, it } from 'vitest';
import { calculatePlates, DEFAULT_PLATES } from './plates';

const kg = DEFAULT_PLATES.kg;

describe('calculatePlates', () => {
  it('loads a barbell with the fewest plates, heaviest first', () => {
    expect(calculatePlates(100, 20, kg).exact).toEqual({ perSide: [25, 15], total: 100 });
    expect(calculatePlates(142.5, 20, kg).exact).toEqual({ perSide: [25, 25, 10, 1.25], total: 142.5 });
    expect(calculatePlates(20, 20, kg).exact).toEqual({ perSide: [], total: 20 });
  });

  it('works without a bar, for plate-loaded machines', () => {
    expect(calculatePlates(90, 0, kg).exact).toEqual({ perSide: [25, 20], total: 90 });
  });

  it('finds combinations greedy picking would miss', () => {
    // Only 15s and 10s: 20 per side is two 10s.
    expect(calculatePlates(40, 0, [15, 10]).exact?.perSide).toEqual([10, 10]);
  });

  it('offers the nearest loads when the target can’t be made', () => {
    const r = calculatePlates(101, 20, kg);
    expect(r.exact).toBeUndefined();
    expect(r.below?.total).toBe(100);
    expect(r.above?.total).toBe(102.5);
  });

  it('flags targets lighter than the bar', () => {
    expect(calculatePlates(15, 20, kg)).toEqual({ underBar: true });
  });

  it('handles pounds', () => {
    expect(calculatePlates(225, 45, DEFAULT_PLATES.lbs).exact).toEqual({ perSide: [45, 45], total: 225 });
    expect(calculatePlates(185, 45, DEFAULT_PLATES.lbs).exact?.perSide).toEqual([45, 25]);
  });
});
