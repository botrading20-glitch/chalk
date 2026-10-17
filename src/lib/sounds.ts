import type { RestSound, SoundVolume } from '../types';

// The rest-end sounds. Each is a few tones: the in-app beep plays them with Web
// Audio, and the lock-screen backup track (restAlert.ts) renders the same ones.

export interface Tone {
  /** Seconds from the start of the sound. */
  at: number;
  freq: number;
  /** Seconds the tone rings for. */
  length: number;
  /** 0 to 1, against the volume setting; partials of a bell sit under its base note. */
  level?: number;
}

export const SOUNDS: Record<RestSound, Tone[]> = {
  classic: [
    { at: 0, freq: 880, length: 0.18 },
    { at: 0.25, freq: 880, length: 0.18 },
    { at: 0.5, freq: 1320, length: 0.45 },
  ],
  chime: [
    { at: 0, freq: 1046.5, length: 0.55 },
    { at: 0.22, freq: 1318.5, length: 0.55 },
    { at: 0.44, freq: 1568, length: 0.9 },
  ],
  bell: [
    { at: 0, freq: 523.25, length: 1.3 },
    { at: 0, freq: 1046.5, length: 0.9, level: 0.6 },
    { at: 0, freq: 1568, length: 0.55, level: 0.35 },
  ],
  pulse: [0, 0.2, 0.4, 0.6].map((at) => ({ at, freq: 1000, length: 0.12 })),
};

export const soundSeconds = (sound: RestSound) => Math.max(...SOUNDS[sound].map((t) => t.at + t.length));

/** Web Audio gain at the loudest point of a tone; Medium is what the beep always used. */
export const GAIN: Record<SoundVolume, number> = { low: 0.15, medium: 0.35, high: 0.8 };
/** The same steps for the lock-screen track, as a share of full scale. */
export const TRACK_AMPLITUDE: Record<SoundVolume, number> = { low: 0.25, medium: 0.6, high: 0.95 };

let config: { sound: RestSound; volume: SoundVolume } = { sound: 'classic', volume: 'medium' };

/** The sound and volume in effect; plain functions read them here, the way format.ts reads its own context. */
export const soundConfig = () => config;
export function setSoundConfig(next: { sound: RestSound; volume: SoundVolume }) {
  config = next;
}
