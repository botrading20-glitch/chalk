import type { RestSound, SoundVolume } from '../types';
import { GAIN, SOUNDS, soundConfig } from './sounds';

// Rest-timer alerts. Browsers only let audio start after a user gesture, so
// unlockAudio() runs when a set is checked off and the beep can play later.

let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Plays the rest sound (the chosen one unless a preview names another); false when audio isn't available (no tap on the page yet, or suspended). */
export function beep(sound: RestSound = soundConfig().sound, volume: SoundVolume = soundConfig().volume) {
  if (!ctx || ctx.state !== 'running') return false;
  const start = ctx.currentTime + 0.05;
  for (const { at, freq, length, level = 1 } of SOUNDS[sound]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = start + at;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(GAIN[volume] * level, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }
  return true;
}

/** One short tick for the 3-2-1 countdown. */
export function tick() {
  if (!ctx || ctx.state !== 'running') return false;
  const t = ctx.currentTime + 0.02;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 1000;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(GAIN[soundConfig().volume] * 0.8, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.start(t);
  osc.stop(t + 0.12);
  return true;
}

export function buzz() {
  navigator.vibrate?.([250, 120, 250]);
}

let lock: WakeLockSentinel | null = null;

/** Keeps the screen on during a workout where the Wake Lock API exists. */
export async function keepAwake(on: boolean) {
  try {
    if (on && !lock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => (lock = null));
    } else if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    lock = null;
  }
}
