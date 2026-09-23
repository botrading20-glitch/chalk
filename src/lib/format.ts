import type { DistanceUnit, WeightUnit } from '../types';

const LB_PER_KG = 2.20462262;
const MI_PER_KM = 0.621371192;

export function uid() {
  // randomUUID only exists in secure contexts; plain-http LAN testing needs the fallback.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

const numberFormats = new Map<number, Intl.NumberFormat>();
export function fmtNum(n: number, maxDecimals = 2) {
  let f = numberFormats.get(maxDecimals);
  if (!f) {
    f = new Intl.NumberFormat('en-GB', { maximumFractionDigits: maxDecimals });
    numberFormats.set(maxDecimals, f);
  }
  return f.format(n);
}

/** Plain decimal string for input fields (no thousands separator). */
export function inputNum(n: number | undefined, maxDecimals = 2) {
  if (n === undefined || Number.isNaN(n)) return '';
  return String(Number(n.toFixed(maxDecimals)));
}

export function parseNum(s: string): number | undefined {
  const v = parseFloat(s.replace(',', '.').trim());
  return Number.isFinite(v) ? v : undefined;
}

export function kgTo(kg: number, unit: WeightUnit) {
  return unit === 'kg' ? kg : kg * LB_PER_KG;
}

export function toKg(v: number, unit: WeightUnit) {
  return unit === 'kg' ? v : v / LB_PER_KG;
}

export function kmTo(km: number, unit: DistanceUnit) {
  return unit === 'km' ? km : km * MI_PER_KM;
}

export function toKm(v: number, unit: DistanceUnit) {
  return unit === 'km' ? v : v / MI_PER_KM;
}

export function fmtWeight(kg: number, unit: WeightUnit) {
  return `${fmtNum(kgTo(kg, unit), unit === 'kg' ? 2 : 1)} ${unit}`;
}

export function fmtVolume(kg: number, unit: WeightUnit) {
  return `${fmtNum(Math.round(kgTo(kg, unit)), 0)} ${unit}`;
}

export function fmtDistance(km: number, unit: DistanceUnit) {
  return `${fmtNum(kmTo(km, unit), 2)} ${unit}`;
}

/** 83 → "1:23", 3723 → "1:02:03" */
export function fmtClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** 4560 → "1h 16min", 300 → "5min" */
export function fmtDuration(totalSeconds: number) {
  const m = Math.round(totalSeconds / 60);
  const h = Math.floor(m / 60);
  if (!h) return `${m}min`;
  return m % 60 ? `${h}h ${m % 60}min` : `${h}h`;
}

/** "1:30" → 90, "90" → 90, "1:02:03" → 3723 */
export function parseClock(s: string): number | undefined {
  const parts = s.trim().split(':');
  if (!s.trim() || parts.some((p) => !/^\d+$/.test(p))) return undefined;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

export function fmtRest(seconds: number) {
  if (!seconds) return 'Off';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!m) return `${s}s`;
  return s ? `${m}min ${s}s` : `${m}min`;
}

const dateShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const dateShortYear = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dateLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export function fmtDate(ts: number) {
  const d = new Date(ts);
  return d.getFullYear() === new Date().getFullYear() ? dateShort.format(d) : dateShortYear.format(d);
}

export function fmtDateLong(ts: number) {
  return dateLong.format(ts);
}

export function fmtTime(ts: number) {
  return timeFmt.format(ts);
}

export function fmtMonth(ts: number) {
  return monthFmt.format(ts);
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Monday 00:00 of the week containing ts. */
export function startOfWeek(ts: number) {
  const d = new Date(startOfDay(ts));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export function addDays(ts: number, days: number) {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function fmtRelativeDay(ts: number) {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return fmtDate(ts);
}

/** "just now", "5 min ago", "3 h ago", then a date. */
export function fmtAgo(ts: number, now = Date.now()) {
  const min = Math.round((now - ts) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (min < 24 * 60) return `${Math.round(min / 60)} h ago`;
  return `on ${fmtDate(ts)} at ${fmtTime(ts)}`;
}

export function defaultWorkoutTitle(ts = Date.now()) {
  const h = new Date(ts).getHours();
  if (h < 5) return 'Night workout';
  if (h < 12) return 'Morning workout';
  if (h < 17) return 'Afternoon workout';
  if (h < 21) return 'Evening workout';
  return 'Night workout';
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${fmtNum(n, 0)} ${n === 1 ? word : pluralWord}`;
}
