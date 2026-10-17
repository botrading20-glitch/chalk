import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import library from '../data/exercises.json';
import { PROGRAMS } from '../data/programs';
import { db } from '../db';
import { en } from '../i18n/en';
import { addProgram, hasProgramFolder, programRoutines } from './programs';

const ids = new Set((library as { id: string }[]).map((e) => e.id));

describe('starter programs', () => {
  it('only use exercises that exist in the library', () => {
    const missing = PROGRAMS.flatMap((p) => p.days.flatMap((d) => d.exercises.map(([id]) => id))).filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it('are sensible: 3 to 5 sessions, a few exercises each, no exercise twice in a session', () => {
    for (const p of PROGRAMS) {
      expect(p.days.length, p.id).toBeGreaterThanOrEqual(3);
      expect(p.days.length, p.id).toBeLessThanOrEqual(5);
      for (const d of p.days) {
        expect(d.exercises.length, d.title).toBeGreaterThanOrEqual(4);
        expect(d.exercises.length, d.title).toBeLessThanOrEqual(7);
        expect(new Set(d.exercises.map(([id]) => id)).size, d.title).toBe(d.exercises.length);
        for (const [, sets, reps] of d.exercises) {
          expect(sets).toBeGreaterThanOrEqual(2);
          expect(sets).toBeLessThanOrEqual(4);
          if (reps !== undefined) expect(reps).toBeGreaterThanOrEqual(5);
        }
      }
    }
  });

  it('have a title, summary and session names in the catalog', () => {
    for (const p of PROGRAMS) {
      for (const key of [p.title, p.summary, ...p.days.map((d) => d.title)]) expect(en[key], key).toBeTruthy();
    }
  });

  it('make routines with the planned sets and reps', () => {
    const first = programRoutines(PROGRAMS[0])[0];
    expect(first.title).toBe('Full body A');
    expect(first.exercises[0].exerciseId).toBe('lib-x-squat-barbell');
    expect(first.exercises[0].sets).toHaveLength(3);
    expect(first.exercises[0].sets.every((s) => s.reps === 8 && !s.completed)).toBe(true);
    // Timed work has sets but no rep target.
    const plank = first.exercises.find((e) => e.exerciseId === 'lib-plank')!;
    expect(plank.sets.every((s) => s.reps === undefined)).toBe(true);
  });
});

describe('addProgram', () => {
  beforeEach(async () => {
    await db.routines.clear();
  });

  it('saves one routine per session into a folder named after the program, in order', async () => {
    const program = PROGRAMS.find((p) => p.id === 'ppl')!;
    expect(await hasProgramFolder(program)).toBe(false);
    expect(await addProgram(program)).toBe(3);
    const saved = await db.routines.orderBy('order').toArray();
    expect(saved.map((r) => r.title)).toEqual(['Push', 'Pull', 'Legs']);
    expect(saved.every((r) => r.folder === 'Push / Pull / Legs')).toBe(true);
    expect(await hasProgramFolder(program)).toBe(true);
  });

  it('can add a program twice (the screen asks first)', async () => {
    const program = PROGRAMS.find((p) => p.id === 'machines')!;
    await addProgram(program);
    await addProgram(program);
    expect(await db.routines.count()).toBe(6);
  });
});
