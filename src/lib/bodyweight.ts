import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { BodyWeight } from '../types';
import { addDays, startOfDay, uid } from './format';

/** Weigh-ins, oldest first; undefined while loading. */
export function useBodyWeights() {
  return useLiveQuery(() => db.bodyweight.orderBy('date').toArray(), []);
}

/** One weigh-in per day: logging a day that already has one replaces it. */
export async function logBodyWeight(date: number, kg: number, id?: string) {
  const day = startOfDay(date);
  await db.transaction('rw', db.bodyweight, async () => {
    const sameDay = await db.bodyweight.where('date').equals(day).toArray();
    const keep = id ?? sameDay[0]?.id ?? uid();
    await db.bodyweight.bulkDelete(sameDay.map((b) => b.id).filter((other) => other !== keep));
    await db.bodyweight.put({ id: keep, date: day, weight: kg, updatedAt: Date.now() });
  });
}

export function deleteBodyWeight(id: string) {
  return db.bodyweight.delete(id);
}

/**
 * Change from the weigh-in closest to `days` before the latest one. Falls back
 * to the first weigh-in when the history is shorter than that.
 */
export function bodyWeightChange(entries: BodyWeight[], days = 30) {
  if (entries.length < 2) return undefined;
  const latest = entries.at(-1)!;
  const target = addDays(latest.date, -days);
  const from = [...entries].reverse().find((b) => b.date <= target) ?? entries[0];
  return { kg: latest.weight - from.weight, from: from.date, full: from.date <= target };
}

/** "2026-09-24" for a date input, in local time. */
export function toDateInput(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fromDateInput(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d).getTime() : undefined;
}
