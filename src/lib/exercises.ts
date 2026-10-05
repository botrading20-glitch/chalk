import { db, getKV, setKV } from '../db';
import type { ActiveWorkout, WorkoutExercise } from '../types';
import { plural } from './format';

/** Where exercise `id` is still used, such as "3 workouts and 1 routine", or null when nothing uses it. */
export async function exerciseUses(id: string): Promise<string | null> {
  const [workouts, routines, active] = await Promise.all([
    db.workouts.where('exerciseIds').equals(id).count(),
    db.routines.filter((r) => r.exercises.some((we) => we.exerciseId === id)).count(),
    getKV<ActiveWorkout>('active'),
  ]);
  const uses = [
    workouts ? plural(workouts, 'workout') : '',
    routines ? plural(routines, 'routine') : '',
    active?.exercises.some((we) => we.exerciseId === id) ? 'the workout in progress' : '',
  ].filter(Boolean);
  if (!uses.length) return null;
  return uses.length === 1 ? uses[0] : `${uses.slice(0, -1).join(', ')} and ${uses[uses.length - 1]}`;
}

/** Points every workout, routine and the workout in progress at exercise `to` instead of `from`. */
export async function reassignExercise(from: string, to: string) {
  const swap = (list: WorkoutExercise[]) => list.map((we) => (we.exerciseId === from ? { ...we, exerciseId: to } : we));
  const uses = (list: WorkoutExercise[]) => list.some((we) => we.exerciseId === from);

  await db.transaction('rw', db.workouts, db.routines, db.kv, async () => {
    const workouts = await db.workouts.where('exerciseIds').equals(from).toArray();
    await db.workouts.bulkPut(
      workouts.map((w) => {
        const exercises = swap(w.exercises);
        return { ...w, exercises, exerciseIds: [...new Set(exercises.map((we) => we.exerciseId))] };
      }),
    );
    const routines = (await db.routines.toArray()).filter((r) => uses(r.exercises));
    await db.routines.bulkPut(routines.map((r) => ({ ...r, exercises: swap(r.exercises), updatedAt: Date.now() })));
    const active = await getKV<ActiveWorkout>('active');
    if (active && uses(active.exercises)) await setKV('active', { ...active, exercises: swap(active.exercises) });
  });
}
