// Rest alert that works with the screen off (setting `timerLockScreen`, on by default).
//
// While resting, Chalk plays a generated, near-silent track. It makes no sound
// on time: it keeps the app running while the phone is locked (Android keeps
// apps that play media alive) and shows the rest as a player on the lock
// screen. The beep itself is the in-app Web Audio beep, fired by a timer. Web
// Audio doesn't take audio focus, so other apps' music keeps playing. Tested on
// Android: an audible <audio> track takes focus and pauses Spotify for good,
// which is why the track stays quiet.
//
// If the app was frozen anyway and the timer can't beep, the track's own beep
// FALLBACK seconds later still wakes you, at the cost of pausing the music.

import { beep } from './timer';

const RATE = 8000;
/** Longer rests fall back to the in-app beep rather than build a huge file. */
const MAX_SECONDS = 20 * 60;
const FALLBACK = 3;

export interface RestControls {
  skip: () => void;
  adjust: (seconds: number) => void;
}

let audio: HTMLAudioElement | null = null;
let url = '';
let target = 0;
/** The rest end the track is playing for. */
let covering = 0;
let rang = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

// Lock-screen text follows the phone's clock format, unlike the app's 24 h times.
const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

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
  // A whisper of noise (about −80 dB): inaudible, but still a playing track.
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

const ACTIONS: MediaSessionAction[] = ['pause', 'nexttrack', 'seekforward', 'seekbackward'];

function showPlayer(endsAt: number, rest: number, controls: RestControls) {
  const ms = navigator.mediaSession;
  if (!ms) return;
  const icon = (size: number) => ({ src: `${import.meta.env.BASE_URL}icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png' });
  ms.metadata = new MediaMetadata({ title: `Resting until ${clock.format(endsAt)}`, artist: 'Chalk', artwork: [icon(192), icon(512)] });
  const handlers: Record<string, MediaSessionActionHandler> = {
    // Nothing to pause in a rest, and pausing would drop the backup beep: end the rest instead.
    pause: controls.skip,
    nexttrack: controls.skip,
    seekforward: () => controls.adjust(15),
    seekbackward: () => controls.adjust(-15),
  };
  for (const action of ACTIONS) {
    try {
      ms.setActionHandler(action, handlers[action]);
    } catch {
      // Not every browser knows every action.
    }
  }
  try {
    // The bar runs to the end of the rest, not to the backup beep.
    ms.setPositionState({ duration: rest, position: 0, playbackRate: 1 });
  } catch {
    // Optional.
  }
}

function hidePlayer() {
  const ms = navigator.mediaSession;
  if (!ms) return;
  ms.metadata = null;
  for (const action of ACTIONS) {
    try {
      ms.setActionHandler(action, null);
    } catch {
      // Ignore.
    }
  }
}

function silenceTrack() {
  covering = 0;
  if (audio) {
    audio.onended = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  if (url) URL.revokeObjectURL(url);
  url = '';
  hidePlayer();
}

/**
 * Beeps once for the rest ending at `endsAt`. When the in-app beep can play,
 * the track stops before its backup beep, so music from other apps carries on.
 */
export function ringRest(endsAt: number) {
  if (rang === endsAt) return;
  rang = endsAt;
  if (beep() || covering !== endsAt) silenceTrack();
}

/** Starts (or re-times) the alert for a rest ending at `endsAt`. */
export function startRestAlert(endsAt: number, controls: RestControls) {
  if (endsAt === target) return;
  clearTimeout(timer);
  const rest = (endsAt - Date.now()) / 1000;
  if (rest < 1 || rest > MAX_SECONDS) {
    stopRestAlert();
    return;
  }
  target = endsAt;
  // A single timer, not chained to others, so a hidden page still runs it within about a second.
  timer = setTimeout(() => ringRest(endsAt), endsAt - Date.now());

  covering = 0;
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(buildTrack(rest + FALLBACK));
  audio ??= new Audio();
  audio.src = url;
  audio.onended = () => {
    if (target === endsAt || target === 0) hidePlayer();
  };
  audio
    .play()
    .then(() => {
      if (target !== endsAt) return;
      covering = endsAt;
      showPlayer(endsAt, rest, controls);
    })
    // Blocked or unsupported: the timer's in-app beep still runs while the app is awake.
    .catch(() => {});
}

export function stopRestAlert() {
  clearTimeout(timer);
  // The in-app beep couldn't play for the rest that just ended: let the track's backup beep sound.
  const backup = covering !== 0 && rang === covering;
  target = 0;
  if (!backup) silenceTrack();
}
