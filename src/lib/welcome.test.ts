import { describe, expect, it } from 'vitest';
import { phoneRegion, shouldWelcome, suggestUnits } from './welcome';

describe('shouldWelcome', () => {
  const fresh = { workoutCount: 0, routineCount: 0, welcomeSeen: false };

  it('is for a brand-new install only', () => {
    expect(shouldWelcome(fresh)).toBe(true);
    expect(shouldWelcome({ ...fresh, workoutCount: 1 })).toBe(false);
    expect(shouldWelcome({ ...fresh, routineCount: 1 })).toBe(false);
    expect(shouldWelcome({ ...fresh, welcomeSeen: true })).toBe(false);
    expect(shouldWelcome({ ...fresh, hasActive: true })).toBe(false);
  });
});

describe('suggestUnits', () => {
  it('uses pounds and miles where people do', () => {
    expect(suggestUnits('US')).toEqual({ weightUnit: 'lbs', distanceUnit: 'mi' });
    expect(suggestUnits('GB')).toEqual({ weightUnit: 'kg', distanceUnit: 'mi' });
    expect(suggestUnits('FR')).toEqual({ weightUnit: 'kg', distanceUnit: 'km' });
    expect(suggestUnits(undefined)).toEqual({ weightUnit: 'kg', distanceUnit: 'km' });
  });
});

describe('phoneRegion', () => {
  it('reads the region of the first language that has one', () => {
    expect(phoneRegion(['en-US', 'fr'])).toBe('US');
    expect(phoneRegion(['fr', 'pt-BR'])).toBe('BR');
    expect(phoneRegion(['fr'])).toBeUndefined();
    expect(phoneRegion([])).toBeUndefined();
  });
});
