import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import type { ActiveWorkout } from '../types';
import { bodyWeightChange, logBodyWeight } from './bodyweight';
import { finishActive, getActive, startWorkout, templateFrom, updateActive, workoutFromDraft } from './workouts';

const T0 = new Date(2026, 8, 24, 21, 30).getTime();

const draft = (): ActiveWorkout => ({
  id: 'draft-1',
  title: '  ',
  startTime: T0,
  endTime: T0 + 3_600_000,
  exercises: [
    {
      id: 'we1',
      exerciseId: 'lib-press',
      sets: [
        { id: 's1', type: 'normal', weight: 60, reps: 10, completed: true },
        { id: 's2', type: 'normal', weight: 60, reps: 8, completed: false },
        { id: 's3', type: 'normal', completed: false },
      ],
    },
    { id: 'we2', exerciseId: 'lib-fly', sets: [{ id: 's4', type: 'normal', completed: false }] },
    { id: 'we3', exerciseId: 'lib-press', sets: [{ id: 's5', type: 'dropset', weight: 40, reps: 12, completed: true }] },
  ],
});

describe('workoutFromDraft', () => {
  it('keeps checked sets, drops empty exercises and names an untitled workout', () => {
    const w = workoutFromDraft(draft(), false);
    expect(w.title).toBe('Night workout');
    expect(w.exercises.map((we) => we.id)).toEqual(['we1', 'we3']);
    expect(w.exercises[0].sets.map((s) => s.id)).toEqual(['s1']);
    expect(w.exerciseIds).toEqual(['lib-press']);
  });

  it('can also keep unchecked sets that have numbers, and marks them done', () => {
    const w = workoutFromDraft(draft(), true);
    expect(w.exercises[0].sets.map((s) => [s.id, s.completed])).toEqual([
      ['s1', true],
      ['s2', true],
    ]);
  });

  it('saves over the original when editing a past workout', () => {
    expect(workoutFromDraft({ ...draft(), editingId: 'w-old' }, false).id).toBe('w-old');
  });
});

describe('templateFrom', () => {
  it('strips completion and RPE and gives everything fresh ids', () => {
    const [we] = templateFrom([{ id: 'we1', exerciseId: 'x', notes: 'n', sets: [{ id: 's1', type: 'failure', weight: 50, reps: 8, rpe: 9, completed: true }] }]);
    expect(we.id).not.toBe('we1');
    expect(we.notes).toBe('n');
    expect(we.sets[0]).toMatchObject({ type: 'failure', weight: 50, reps: 8, completed: false });
    expect(we.sets[0].rpe).toBeUndefined();
    expect(we.sets[0].id).not.toBe('s1');
  });
});

describe('live workout storage', () => {
  beforeEach(async () => {
    await Promise.all([db.kv.clear(), db.workouts.clear(), db.routines.clear()]);
  });

  it('writes every change through, then saves and clears the draft on finish', async () => {
    await startWorkout({ title: 'Chest day', exercises: draft().exercises });
    const started = await getActive();
    expect(started?.exercises[0].sets.every((s) => !s.completed)).toBe(true);
    expect(started?.exercises[0].id).not.toBe('we1');

    await updateActive((a) => ({ ...a, exercises: a.exercises.map((we) => ({ ...we, sets: we.sets.map((s) => ({ ...s, completed: true })) })) }));
    const saved = await finishActive({ title: 'Chest day', keepUnchecked: false, updateRoutine: false });
    expect(await getActive()).toBeUndefined();
    expect(await db.workouts.get(saved.id)).toMatchObject({ title: 'Chest day' });
    // Every checked set is kept (the editor won't check a set that has no numbers).
    expect(saved.exercises.flatMap((we) => we.sets)).toHaveLength(5);
  });
});

describe('body weight', () => {
  beforeEach(() => db.bodyweight.clear());

  it('keeps one weigh-in per day', async () => {
    await logBodyWeight(T0, 80);
    await logBodyWeight(T0 + 3_600_000, 79.5);
    const all = await db.bodyweight.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].weight).toBe(79.5);
    expect(all[0].date).toBe(new Date(2026, 8, 24).getTime());
  });

  it('reports the change over 30 days, or since the first weigh-in', () => {
    const day = (d: number) => new Date(2026, 8, d).getTime();
    const e = (d: number, weight: number) => ({ id: String(d), date: day(d), weight, updatedAt: 0 });
    expect(bodyWeightChange([e(1, 80)])).toBeUndefined();
    expect(bodyWeightChange([e(10, 80), e(20, 79)])).toEqual({ kg: -1, from: day(10), full: false });
  });
});
