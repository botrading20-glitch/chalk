// Opt-in rest alert that works with the screen off. A locked phone freezes
// the page's timers but keeps media playing, so while resting Chalk plays a
// generated track: near-silence for what's left of the rest, then the beep.
// The alert comes from the audio itself, with no timer involved.
//
// Chrome on Android only treats audible playback as "media": the quiet track
// doesn't take audio focus (other apps' music keeps playing) and gets no
// lock-screen player. A regular notification shows the rest instead, while
// the app is in the background.

import { fmtTime } from './format';

const RATE = 8000;
/** Longer rests fall back to the in-app beep rather than build a huge file. */
const MAX_SECONDS = 20 * 60;
/** Playback starts a moment after play(); starting the beep early evens it out. */
const START_LAG = 0.2;

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

const TAG = 'chalk-rest';
let fallback: Notification | null = null;

async function registration() {
  try {
    return await navigator.serviceWorker?.getRegistration();
  } catch {
    return undefined;
  }
}

/** "Resting until 21:43" in the notification shade and on the lock screen. */
async function showRestNotification(endsAt: number) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const title = `Resting until ${fmtTime(endsAt)}`;
  const options = {
    body: 'Chalk beeps when it’s time for your next set.',
    tag: TAG,
    silent: true,
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    timestamp: endsAt,
  } as NotificationOptions;
  const reg = await registration();
  if (reg) await reg.showNotification(title, options).catch(() => {});
  else {
    // No service worker (the dev server): desktop browsers still take this.
    try {
      fallback = new Notification(title, options);
    } catch {
      // Android only shows notifications through a service worker.
    }
  }
}

async function closeRestNotification() {
  fallback?.close();
  fallback = null;
  const reg = await registration();
  for (const n of (await reg?.getNotifications({ tag: TAG }).catch(() => [])) ?? []) n.close();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (covering && covering === target) void showRestNotification(covering);
  } else {
    void closeRestNotification();
  }
});

/** Asks for notification permission; the beep works either way. */
export async function allowRestNotifications() {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'default') await Notification.requestPermission().catch(() => {});
  return Notification.permission === 'granted';
}

/** Starts (or re-times) the track for a rest ending at `endsAt`. */
export function startRestAlert(endsAt: number) {
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
    if (target === endsAt || target === 0) void closeRestNotification();
  };
  audio
    .play()
    .then(() => {
      if (target !== endsAt) return;
      covering = endsAt;
      // Re-timed with ±15 s while in the background: update the notification.
      if (document.visibilityState === 'hidden') void showRestNotification(endsAt);
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
  void closeRestNotification();
}

/** True when the track is handling the beep for this rest, so the app shouldn't beep too. */
export function restAlertCovers(endsAt: number) {
  return covering === endsAt;
}
