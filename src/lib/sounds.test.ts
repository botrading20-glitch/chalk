import { describe, expect, it } from 'vitest';
import { GAIN, SOUNDS, TRACK_AMPLITUDE, soundSeconds } from './sounds';

describe('rest sounds', () => {
  it('every sound has tones that fit in a few seconds', () => {
    for (const [name, tones] of Object.entries(SOUNDS)) {
      expect(tones.length, name).toBeGreaterThan(0);
      for (const t of tones) {
        expect(t.freq).toBeGreaterThan(100);
        expect(t.length).toBeGreaterThan(0);
        expect(t.at).toBeGreaterThanOrEqual(0);
        expect(t.level ?? 1).toBeLessThanOrEqual(1);
      }
    }
    for (const name of Object.keys(SOUNDS) as (keyof typeof SOUNDS)[]) expect(soundSeconds(name)).toBeLessThan(2);
  });

  it('volume steps go up, and Medium is the level the beep always had', () => {
    expect(GAIN.low).toBeLessThan(GAIN.medium);
    expect(GAIN.medium).toBeLessThan(GAIN.high);
    expect(GAIN.medium).toBe(0.35);
    expect(TRACK_AMPLITUDE.low).toBeLessThan(TRACK_AMPLITUDE.medium);
    expect(TRACK_AMPLITUDE.medium).toBeLessThan(TRACK_AMPLITUDE.high);
    expect(TRACK_AMPLITUDE.high).toBeLessThanOrEqual(1);
  });
});
