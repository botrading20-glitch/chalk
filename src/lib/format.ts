import { intlLocale, t } from '../i18n';
import type { DistanceUnit, WeightUnit } from '../types';
import { calcContext } from './context';

export { listJoin } from '../i18n';

const LB_PER_KG = 2.20462262;
const MI_PER_KM = 0.621371192;

export function uid() {
  // randomUUID only exists in secure contexts; plain-http LAN testing needs the fallback.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

const numberFormats = new Map<string, Intl.NumberFormat>();
export function fmtNum(n: number, maxDecimals = 2) {
  const key = `${intlLocale()}|${maxDecimals}`;
  let f = numberFormats.get(key);
  if (!f) {
    f = new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: maxDecimals });
    numberFormats.set(key, f);
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
  if (!h) return t('time.minutes', { n: m });
  return m % 60 ? `${t('time.hours', { n: h })} ${t('time.minutes', { n: m % 60 })}` : t('time.hours', { n: h });
}

/** "1:30" → 90, "90" → 90, "1:02:03" → 3723 */
export function parseClock(s: string): number | undefined {
  const parts = s.trim().split(':');
  if (!s.trim() || parts.some((p) => !/^\d+$/.test(p))) return undefined;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

export function fmtRest(seconds: number) {
  if (!seconds) return t('common.off');
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (!m) return t('time.seconds', { n: sec });
  return sec ? t('time.minutesSeconds', { m, s: sec }) : t('time.minutes', { n: m });
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();

function dateFormat(id: string, options: Intl.DateTimeFormatOptions) {
  const time = calcContext().timeFormat;
  const key = `${intlLocale()}|${time}|${id}`;
  let f = dateFormats.get(key);
  if (!f) {
    const hour: Intl.DateTimeFormatOptions =
      time === '24h' ? { hourCycle: 'h23' } : time === '12h' ? { hour12: true } : {};
    f = new Intl.DateTimeFormat(intlLocale(), { ...options, ...(options.hour ? hour : {}) });
    dateFormats.set(key, f);
  }
  return f;
}

export function fmtDate(ts: number) {
  const d = new Date(ts);
  return d.getFullYear() === new Date().getFullYear()
    ? dateFormat('short', { weekday: 'short', day: 'numeric', month: 'short' }).format(d)
    : dateFormat('shortYear', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function fmtDateLong(ts: number) {
  return dateFormat('long', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(ts);
}

export function fmtTime(ts: number) {
  return dateFormat('time', { hour: calcContext().timeFormat === '12h' ? 'numeric' : '2-digit', minute: '2-digit' }).format(ts);
}

/** "24 Sep 2026" */
export function fmtDateYear(ts: number) {
  return dateFormat('shortYear', { day: 'numeric', month: 'short', year: 'numeric' }).format(ts);
}

/** "14 Oct" */
export function fmtDayMonth(ts: number) {
  return dateFormat('dayMonth', { day: 'numeric', month: 'short' }).format(ts);
}

/** "Oct" */
export function fmtMonthShort(ts: number) {
  return dateFormat('monthShort', { month: 'short' }).format(ts);
}

/** "Wednesday 14 October" */
export function fmtWeekdayDate(ts: number) {
  return dateFormat('weekdayDate', { weekday: 'long', day: 'numeric', month: 'long' }).format(ts);
}

/** "Wed" */
export function fmtWeekdayShort(ts: number) {
  return dateFormat('weekdayShort', { weekday: 'short' }).format(ts);
}

/** "W" */
export function fmtWeekdayNarrow(ts: number) {
  return dateFormat('weekdayNarrow', { weekday: 'narrow' }).format(ts);
}

export function fmtMonth(ts: number) {
  return dateFormat('month', { month: 'long', year: 'numeric' }).format(ts);
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The first day of the week as Date.getDay() counts it (0 is Sunday): the setting, else the language's custom. */
export function firstDayOfWeek(): number {
  switch (calcContext().weekStart) {
    case 'mon':
      return 1;
    case 'sun':
      return 0;
    case 'sat':
      return 6;
  }
  try {
    const locale = new Intl.Locale(intlLocale()) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;
    if (info) return info.firstDay % 7;
  } catch {
    // Older browsers: Monday, as the app always had.
  }
  return 1;
}

/** 00:00 of the first day of the week containing ts. */
export function startOfWeek(ts: number) {
  const d = new Date(startOfDay(ts));
  d.setDate(d.getDate() - ((d.getDay() - firstDayOfWeek() + 7) % 7));
  return d.getTime();
}

export function addDays(ts: number, days: number) {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function fmtRelativeDay(ts: number) {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86_400_000);
  if (days === 0) return t('date.today');
  if (days === 1) return t('date.yesterday');
  if (days < 7) return t('date.daysAgo', { n: days });
  return fmtDate(ts);
}

/** "just now", "5 min ago", "3 h ago", then a date. */
export function fmtAgo(ts: number, now = Date.now()) {
  const min = Math.round((now - ts) / 60_000);
  if (min < 1) return t('date.justNow');
  if (min < 60) return t('date.minutesAgo', { n: min });
  if (min < 24 * 60) return t('date.hoursAgo', { n: Math.round(min / 60) });
  return t('date.onAt', { date: fmtDate(ts), time: fmtTime(ts) });
}

export function defaultWorkoutTitle(ts = Date.now()) {
  const h = new Date(ts).getHours();
  if (h < 5) return t('workout.default.night');
  if (h < 12) return t('workout.default.morning');
  if (h < 17) return t('workout.default.afternoon');
  if (h < 21) return t('workout.default.evening');
  return t('workout.default.night');
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${fmtNum(n, 0)} ${n === 1 ? word : pluralWord}`;
}
