// Opt-in rest alert that works with the screen off. Phones freeze a
// backgrounded page's timers but keep media playing, so while resting Chalk
// plays a generated track: near-silence for what's left of the rest, then the
// beep. The alert comes from the audio itself, with no timer involved, and the
// Media Session puts the countdown on the lock screen. The catch, which the
// setting spells out: media playback takes audio focus, so music from other
// apps pauses during rests.

import { fmtTime } from './format';

const RATE = 8000;
/** Longer rests fall back to the in-app beep rather than build a huge file. */
const MAX_SECONDS = 20 * 60;
/** Playback starts a moment after play(); starting the beep early evens it out. */
const START_LAG = 0.2;

export interface RestControls {
  skip: () => void;
  adjust: (seconds: number) => void;
}

let audio: HTMLAudioElement | null = null;
let url = '';
/** The rest end the current track was built for, once it's actually playing. */
let covering = 0;
let target = 0;

function wav(samples: Int16Array) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  new Int16Array(buf, 44).set(samples);
  return new Blob([buf], { type: 'audio/wav' });
}

/** The in-app beep (880, 880, 1320 Hz), played twice so it carries from a pocket. */
const TONES = [0, 1.1].flatMap((offset) => [
  { at: offset, freq: 880, length: 0.18 },
  { at: offset + 0.25, freq: 880, length: 0.18 },
  { at: offset + 0.5, freq: 1320, length: 0.45 },
]);
const BEEP_SECONDS = 2.1;

function buildTrack(silence: number) {
  const lead = Math.round(silence * RATE);
  const samples = new Int16Array(lead + Math.round(BEEP_SECONDS * RATE));
  // A whisper of noise (about −80 dB) so nothing treats the track as silent.
  for (let i = 0; i < lead; i++) samples[i] = (Math.random() * 7 - 3) | 0;
  for (const tone of TONES) {
    const start = lead + Math.round(tone.at * RATE);
    const n = Math.round(tone.length * RATE);
    for (let i = 0; i < n; i++) {
      const t = i / RATE;
      const envelope = Math.min(1, t / 0.01) * Math.exp((-4 * t) / tone.length);
      samples[start + i] = Math.round(Math.sin(2 * Math.PI * tone.freq * t) * envelope * 0.6 * 32767);
    }
  }
  return wav(samples);
}

function setMediaSession(endsAt: number, duration: number, controls: RestControls) {
  const ms = navigator.mediaSession;
  if (!ms) return;
  const icon = (size: number) => ({ src: `${import.meta.env.BASE_URL}icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png' });
  ms.metadata = new MediaMetadata({ title: `Rest · ends at ${fmtTime(endsAt)}`, artist: 'Chalk', artwork: [icon(192), icon(512)] });
  const actions: [MediaSessionAction, MediaSessionActionHandler | null][] = [
    // The lock screen's pause button has nothing to pause, so it ends the rest.
    ['pause', controls.skip],
    ['nexttrack', controls.skip],
    ['seekforward', () => controls.adjust(15)],
    ['seekbackward', () => controls.adjust(-15)],
  ];
  for (const [action, handler] of actions) {
    try {
      ms.setActionHandler(action, handler);
    } catch {
      // Not every browser knows every action.
    }
  }
  try {
    ms.setPositionState({ duration, position: 0, playbackRate: 1 });
  } catch {
    // Optional.
  }
}

function clearMediaSession() {
  const ms = navigator.mediaSession;
  if (!ms) return;
  ms.metadata = null;
  for (const action of ['pause', 'nexttrack', 'seekforward', 'seekbackward'] as MediaSessionAction[]) {
    try {
      ms.setActionHandler(action, null);
    } catch {
      // Ignore.
    }
  }
}

/** Starts (or re-times) the track for a rest ending at `endsAt`. */
export function startRestAlert(endsAt: number, controls: RestControls) {
  if (endsAt === target) return;
  const remaining = (endsAt - Date.now()) / 1000 - START_LAG;
  if (remaining < 1 || remaining > MAX_SECONDS) {
    stopRestAlert();
    return;
  }
  target = endsAt;
  covering = 0;
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(buildTrack(remaining));
  audio ??= new Audio();
  audio.src = url;
  audio.onended = () => {
    if (target === endsAt || target === 0) clearMediaSession();
  };
  audio
    .play()
    .then(() => {
      if (target !== endsAt) return;
      covering = endsAt;
      setMediaSession(endsAt, remaining + BEEP_SECONDS, controls);
    })
    // Blocked (no tap on the page yet) or unsupported: the in-app beep takes over.
    .catch(() => {});
}

export function stopRestAlert() {
  // When the rest ends on time the app clears it as the beep starts; let the beep play out.
  const beeping = covering !== 0 && Date.now() >= covering - 1000;
  target = 0;
  covering = 0;
  if (beeping) return;
  if (audio) {
    audio.onended = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  if (url) URL.revokeObjectURL(url);
  url = '';
  clearMediaSession();
}

/** True when the track is handling the beep for this rest, so the app shouldn't beep too. */
export function restAlertCovers(endsAt: number) {
  return covering === endsAt;
}
