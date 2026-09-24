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

/** Plays the rest beep; false when audio isn't available (no tap on the page yet, or suspended). */
export function beep() {
  if (!ctx || ctx.state !== 'running') return false;
  const start = ctx.currentTime + 0.05;
  [880, 880, 1320].forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx!.destination);
    const t = start + i * 0.25;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (i === 2 ? 0.45 : 0.18));
    osc.start(t);
    osc.stop(t + 0.5);
  });
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
