import { useLiveQuery } from 'dexie-react-hooks';
import { db, getKV, requestPersistentStorage } from '../db';
import type { ActiveWorkout, MediaRecord, WorkoutExercise } from '../types';
import { fmtNum, isolate, uid } from './format';
import { t } from '../i18n';

// Set videos live in the `media` table, one per set, and follow their workout: they are
// deleted with it, dropped when the set is, and listed as "not linked" when something
// else (a restore, a sync) leaves one behind. They are never synced or backed up.

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
/** Space to leave free in the browser's storage beyond the video itself. */
const HEADROOM_BYTES = 50 * 1024 * 1024;

const EXTENSION_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
  mkv: 'video/x-matroska',
};

/** A picked file's video type: its own, or one guessed from the extension when the phone leaves it blank. */
export function videoType(file: { type: string; name?: string }) {
  if (file.type.startsWith('video/')) return file.type;
  if (file.type) return undefined;
  return EXTENSION_TYPES[(file.name ?? '').split('.').pop()?.toLowerCase() ?? ''];
}

/** "48.2 MB", "1.35 GB". */
export function fmtSize(bytes: number) {
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) return isolate(`${fmtNum(mb / 1024, 2)} GB`);
  if (mb >= 1) return isolate(`${fmtNum(mb, 1)} MB`);
  return isolate(`${fmtNum(Math.max(1, Math.round(bytes / 1024)), 0)} KB`);
}

export interface VideoTarget {
  setId: string;
  workoutId: string;
  exerciseId: string;
}

/**
 * Checks a picked file and stores it for the set, replacing any video the set had.
 * The errors are messages fit to show.
 */
export async function attachVideo(file: Blob & { name?: string }, target: VideoTarget): Promise<MediaRecord> {
  const type = videoType(file);
  if (!type) throw new Error(t('video.errType'));
  if (file.size > MAX_VIDEO_BYTES) throw new Error(t('video.errTooBig', { max: fmtSize(MAX_VIDEO_BYTES) }));
  const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
  if (estimate?.quota !== undefined && estimate.usage !== undefined && estimate.quota - estimate.usage < file.size + HEADROOM_BYTES) {
    throw new Error(t('video.errSpace'));
  }
  void requestPersistentStorage();

  const record: MediaRecord = { id: uid(), ...target, blob: file, type, size: file.size, createdAt: Date.now() };
  try {
    await db.transaction('rw', db.media, async () => {
      await db.media.where('setId').equals(target.setId).delete();
      await db.media.put(record);
    });
  } catch (e) {
    if ((e as Error).name === 'QuotaExceededError') throw new Error(t('video.errSpace'));
    throw new Error(t('video.errFailed', { message: (e as Error).message }));
  }
  return record;
}

const FILE_EXTENSIONS: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/3gpp': '3gp' };

/** The video as a named file, for the share sheet. */
export function videoFile(r: MediaRecord) {
  return new File([r.blob], `setward-video-${new Date(r.createdAt).toISOString().slice(0, 10)}.${FILE_EXTENSIONS[r.type] ?? 'video'}`, { type: r.type });
}

export function getVideo(setId: string) {
  return db.media.where('setId').equals(setId).first();
}

export function removeVideo(id: string) {
  return db.media.delete(id);
}

export function removeVideosForSets(setIds: string[]) {
  return db.media.where('setId').anyOf(setIds).delete();
}

/** Deletes a workout's videos except those on sets in `keep`. Call it inside a transaction that includes `db.media`. */
export function removeVideosForWorkout(workoutId: string, keep: Iterable<string> = []) {
  const kept = new Set(keep);
  return db.media
    .where('workoutId')
    .equals(workoutId)
    .filter((r) => !kept.has(r.setId))
    .delete();
}

export function setIdsOf(w: { exercises: WorkoutExercise[] }) {
  return w.exercises.flatMap((we) => we.sets.map((s) => s.id));
}

const EMPTY: Set<string> = new Set();

/** Ids of the sets that have a video, live. */
export function useVideoSets() {
  return useLiveQuery(async () => new Set((await db.media.orderBy('setId').keys()) as string[]), [], EMPTY);
}

/** Every set a video could belong to: saved workouts, the workout in progress and editor drafts. */
async function linkedSetIds() {
  const ids = new Set<string>();
  const add = (w: { exercises: WorkoutExercise[] } | undefined) => w?.exercises?.forEach((we) => we.sets.forEach((s) => ids.add(s.id)));
  await db.workouts.each((w) => add(w));
  add(await getKV<ActiveWorkout>('active'));
  for (const d of await db.kv.where('key').startsWith('draft:workout:').toArray()) add(d.value as ActiveWorkout | undefined);
  return ids;
}

/** Videos whose set is nowhere any more (a synced deletion, a restore over the workout). */
export async function orphanVideos() {
  const linked = await linkedSetIds();
  return (await db.media.toArray()).filter((r) => !linked.has(r.setId));
}

export interface VideoUsage {
  count: number;
  bytes: number;
  orphans: number;
}

export async function videoUsage(): Promise<VideoUsage> {
  const all = await db.media.toArray();
  const linked = await linkedSetIds();
  return { count: all.length, bytes: all.reduce((n, r) => n + r.size, 0), orphans: all.filter((r) => !linked.has(r.setId)).length };
}

export function useVideoUsage() {
  return useLiveQuery(videoUsage, []);
}

/** Returns how many were removed. */
export async function removeOrphanVideos() {
  const orphans = await orphanVideos();
  await db.media.bulkDelete(orphans.map((r) => r.id));
  return orphans.length;
}

export async function removeAllVideos() {
  const n = await db.media.count();
  await db.media.clear();
  return n;
}
