import { db } from '../db';
import type { Program } from '../data/programs';
import { uid } from './format';
import { emptySet, saveRoutine } from './workouts';
import { t } from '../i18n';
import type { WorkoutExercise } from '../types';

/** The routines a program makes, titled in the current language. */
export function programRoutines(program: Program): { title: string; exercises: WorkoutExercise[] }[] {
  return program.days.map((day) => ({
    title: t(day.title),
    exercises: day.exercises.map(([exerciseId, sets, reps]) => ({
      id: uid(),
      exerciseId,
      sets: Array.from({ length: sets }, () => ({ ...emptySet(), ...(reps ? { reps } : {}) })),
    })),
  }));
}

/** Whether the user already has a folder with this program's name. */
export async function hasProgramFolder(program: Program) {
  const folder = t(program.title);
  return (await db.routines.toArray()).some((r) => r.folder?.trim() === folder);
}

/** Saves a program's routines into a folder named after it, in order, and returns how many. */
export async function addProgram(program: Program) {
  const folder = t(program.title);
  const routines = programRoutines(program);
  for (const r of routines) await saveRoutine({ id: uid(), title: r.title, folder, exercises: r.exercises });
  return routines.length;
}
