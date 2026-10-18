import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, setKV } from '../db';
import type { ActiveWorkout, Workout } from '../types';
import { wipeAllData } from './backup';
import {
  attachVideo,
  fmtSize,
  getVideo,
  MAX_VIDEO_BYTES,
  orphanVideos,
  removeAllVideos,
  removeOrphanVideos,
  removeVideo,
  removeVideosForSets,
  removeVideosForWorkout,
  videoType,
  videoUsage,
} from './media';
import { discardActive, finishActive, startWorkout, updateActive } from './workouts';

const T0 = new Date(2026, 8, 24, 21, 30).getTime();

const clip = (bytes = 10, type = 'video/mp4') => new Blob([new Uint8Array(bytes)], { type });
const target = (setId: string, workoutId = 'w1') => ({ setId, workoutId, exerciseId: 'ex1' });

const workout = (id: string, setIds: string[]): Workout => ({
  id,
  title: 'Day',
  startTime: T0,
  endTime: T0 + 3_600_000,
  exerciseIds: ['ex1'],
  exercises: [{ id: `we-${id}`, exerciseId: 'ex1', sets: setIds.map((s) => ({ id: s, type: 'normal' as const, weight: 50, reps: 5, completed: true })) }],
});

beforeEach(async () => {
  await wipeAllData();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('what counts as a video', () => {
  it('takes the file type, or guesses from the extension when the phone leaves it blank', () => {
    expect(videoType({ type: 'video/quicktime', name: 'a.mov' })).toBe('video/quicktime');
    expect(videoType({ type: '', name: 'IMG_0042.MOV' })).toBe('video/quicktime');
    expect(videoType({ type: '', name: 'clip.mp4' })).toBe('video/mp4');
    expect(videoType({ type: '', name: 'notes.txt' })).toBeUndefined();
    expect(videoType({ type: 'image/png', name: 'a.mp4' })).toBeUndefined();
  });

  it('writes sizes the way the Data page shows them', () => {
    expect(fmtSize(300)).toBe('1 KB');
    expect(fmtSize(48.2 * 1024 * 1024)).toBe('48.2 MB');
    expect(fmtSize(1.35 * 1024 * 1024 * 1024)).toBe('1.35 GB');
  });
});

describe('attaching a video', () => {
  it('stores it for the set with its type and size', async () => {
    const r = await attachVideo(clip(2048), target('s1'));
    const stored = await getVideo('s1');
    expect(stored?.id).toBe(r.id);
    expect(stored).toMatchObject({ setId: 's1', workoutId: 'w1', exerciseId: 'ex1', type: 'video/mp4', size: 2048 });
    expect(stored?.blob.size).toBe(2048);
  });

  it('keeps one video per set: a new one replaces the old', async () => {
    await attachVideo(clip(10), target('s1'));
    await attachVideo(clip(20, 'video/webm'), target('s1'));
    expect(await db.media.count()).toBe(1);
    expect((await getVideo('s1'))?.type).toBe('video/webm');
  });

  it('refuses a file that is not a video, and one over the size cap', async () => {
    await expect(attachVideo(clip(10, 'image/png'), target('s1'))).rejects.toThrow("That file isn’t a video.");
    const huge = clip(10);
    Object.defineProperty(huge, 'size', { value: MAX_VIDEO_BYTES + 1 });
    await expect(attachVideo(huge, target('s1'))).rejects.toThrow('bigger than 500 MB');
    expect(await db.media.count()).toBe(0);
  });

  it('refuses a video that would leave less than the headroom free', async () => {
    const mb = 1024 * 1024;
    vi.stubGlobal('navigator', { storage: { estimate: async () => ({ quota: 200 * mb, usage: 120 * mb }) } });
    await expect(attachVideo(clip(40 * mb), target('s1'))).rejects.toThrow('enough free space');
    await expect(attachVideo(clip(20 * mb), target('s1'))).resolves.toBeTruthy();
  });

  it('goes ahead when the browser cannot say how much room there is', async () => {
    vi.stubGlobal('navigator', {});
    await expect(attachVideo(clip(10), target('s1'))).resolves.toBeTruthy();
  });
});

describe('removing videos', () => {
  beforeEach(async () => {
    await attachVideo(clip(10), target('s1', 'w1'));
    await attachVideo(clip(10), target('s2', 'w1'));
    await attachVideo(clip(10), target('s3', 'w2'));
  });

  it('removes by id, by set, and by workout except the sets it keeps', async () => {
    await removeVideo((await getVideo('s3'))!.id);
    expect(await getVideo('s3')).toBeUndefined();

    await removeVideosForSets(['s2']);
    expect(await getVideo('s2')).toBeUndefined();
    expect(await getVideo('s1')).toBeDefined();

    await attachVideo(clip(10), target('s4', 'w1'));
    await removeVideosForWorkout('w1', ['s1']);
    expect((await db.media.toArray()).map((r) => r.setId)).toEqual(['s1']);
  });

  it('removeAll empties the table and says how many went', async () => {
    expect(await removeAllVideos()).toBe(3);
    expect(await db.media.count()).toBe(0);
  });
});

describe('videos not linked to a set', () => {
  it('counts a video as linked when its set is in a saved workout, the workout in progress or an editor draft', async () => {
    await db.workouts.put(workout('w1', ['saved']));
    await setKV('active', { id: 'a1', title: 'Live', startTime: T0, exercises: workout('a1', ['live']).exercises } satisfies ActiveWorkout);
    await setKV('draft:workout:w1', { id: 'w1', title: 'Day', startTime: T0, exercises: workout('w1', ['drafted']).exercises } satisfies ActiveWorkout);
    for (const s of ['saved', 'live', 'drafted', 'gone']) await attachVideo(clip(10), target(s));

    expect((await orphanVideos()).map((r) => r.setId)).toEqual(['gone']);
    const usage = await videoUsage();
    expect(usage).toEqual({ count: 4, bytes: 40, orphans: 1 });

    expect(await removeOrphanVideos()).toBe(1);
    expect(await db.media.count()).toBe(3);
  });

  it('is the state a restored backup or a synced deletion leaves behind', async () => {
    await db.workouts.put(workout('w1', ['s1']));
    await attachVideo(clip(10), target('s1'));
    await db.workouts.delete('w1');
    expect((await orphanVideos()).map((r) => r.setId)).toEqual(['s1']);
  });
});

describe('the life of a video follows its workout', () => {
  const started = async () => {
    await startWorkout({ title: 'Push', exercises: workout('x', ['t1', 't2', 't3']).exercises });
    const active = (await db.kv.get('active'))!.value as ActiveWorkout;
    return { active, sets: active.exercises[0].sets.map((s) => s.id) };
  };

  it('finishing keeps the videos of the sets it saves and deletes those of the sets it drops', async () => {
    const { active, sets } = await started();
    await updateActive((a) => ({
      ...a,
      exercises: a.exercises.map((we) => ({ ...we, sets: we.sets.map((s, i) => ({ ...s, completed: i < 2, weight: 60, reps: 5 })) })),
    }));
    for (const id of sets) await attachVideo(clip(10), target(id, active.id));

    // The third set was never checked off, and the "also save" option is off: it is dropped with its video.
    const saved = await finishActive({ title: 'Push', keepUnchecked: false, updateRoutine: false });
    expect(saved.id).toBe(active.id);
    expect((await db.media.toArray()).map((r) => r.setId).sort()).toEqual([sets[0], sets[1]].sort());
  });

  it('discarding a new workout deletes all its videos but leaves other workouts alone', async () => {
    const { active, sets } = await started();
    await attachVideo(clip(10), target(sets[0], active.id));
    await attachVideo(clip(10), target('elsewhere', 'other-workout'));
    await discardActive();
    expect((await db.media.toArray()).map((r) => r.setId)).toEqual(['elsewhere']);
    expect(await db.kv.get('active')).toBeUndefined();
  });

  it('discarding edits to a saved workout keeps the videos on the sets it already had', async () => {
    await db.workouts.put(workout('w1', ['old']));
    await attachVideo(clip(10), target('old', 'w1'));
    await attachVideo(clip(10), target('added', 'w1'));
    await setKV('active', { id: 'w1', editingId: 'w1', title: 'Day', startTime: T0, exercises: workout('w1', ['old', 'added']).exercises } satisfies ActiveWorkout);
    await discardActive();
    expect((await db.media.toArray()).map((r) => r.setId)).toEqual(['old']);
  });

  it('erasing all data clears the videos too', async () => {
    await attachVideo(clip(10), target('s1'));
    await wipeAllData();
    expect(await db.media.count()).toBe(0);
  });
});
