import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, setKV } from '../db';
import type { ActiveWorkout, WorkoutExercise } from '../types';
import { exerciseUses } from './exercises';

const block = (exerciseId: string): WorkoutExercise => ({ id: `we-${exerciseId}`, exerciseId, sets: [] });
const workout = (id: string, ...ids: string[]) => ({ id, title: id, startTime: 0, endTime: 0, exercises: ids.map(block), exerciseIds: ids });
const routine = (id: string, ...ids: string[]) => ({ id, title: id, exercises: ids.map(block), order: 0, createdAt: 0, updatedAt: 0 });

describe('exerciseUses', () => {
  beforeEach(async () => {
    await Promise.all([db.kv.clear(), db.workouts.clear(), db.routines.clear()]);
  });

  it('is null when nothing uses the exercise', async () => {
    await db.workouts.add(workout('w1', 'other'));
    await db.routines.add(routine('r1', 'other'));
    expect(await exerciseUses('mine')).toBeNull();
  });

  it('counts routines, not only workouts, so deleting it never breaks a routine', async () => {
    await db.routines.bulkAdd([routine('r1', 'mine'), routine('r2', 'other')]);
    expect(await exerciseUses('mine')).toBe('1 routine');
  });

  it('lists workouts, routines and the workout in progress together', async () => {
    await db.workouts.bulkAdd([workout('w1', 'mine'), workout('w2', 'other', 'mine'), workout('w3', 'other')]);
    await db.routines.bulkAdd([routine('r1', 'mine'), routine('r2', 'mine')]);
    const active: ActiveWorkout = { id: 'a', title: '', startTime: 0, exercises: [block('mine')] };
    await setKV('active', active);
    expect(await exerciseUses('mine')).toBe('2 workouts, 2 routines and the workout in progress');
  });
});
