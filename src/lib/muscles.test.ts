import { describe, expect, it } from 'vitest';
import type { Exercise, Muscle, WorkoutExercise } from '../types';
import { mergeMuscleSets, muscleLevel, muscleSets, rankedMuscles } from './muscles';

const ex = (id: string, primaryMuscle: Muscle, secondaryMuscles: Muscle[] = []): Exercise => ({
  id,
  name: id,
  type: 'weight_reps',
  equipment: 'barbell',
  primaryMuscle,
  secondaryMuscles,
  instructions: [],
  images: [],
  source: 'library',
});
const map = new Map([ex('bench', 'chest', ['shoulders', 'triceps']), ex('curl', 'biceps', ['forearms']), ex('odd', 'chest', ['chest'])].map((e) => [e.id, e]));
const block = (exerciseId: string, ...sets: { type?: 'normal' | 'warmup'; completed?: boolean }[]): WorkoutExercise => ({
  id: `b-${exerciseId}`,
  exerciseId,
  sets: sets.map((s, i) => ({ id: `${exerciseId}${i}`, type: s.type ?? 'normal', completed: s.completed ?? true })),
});

describe('muscleSets', () => {
  it('counts a whole set for the primary muscle and half for each secondary one', () => {
    const t = muscleSets([block('bench', {}, {}, {})], map);
    expect(t.get('chest')).toBe(3);
    expect(t.get('shoulders')).toBe(1.5);
    expect(t.get('triceps')).toBe(1.5);
    expect(t.has('biceps')).toBe(false);
  });

  it('skips warm-ups, and unchecked sets when asked to count completed ones only', () => {
    const sets = [{ type: 'warmup' as const }, {}, { completed: false }];
    expect(muscleSets([block('curl', ...sets)], map).get('biceps')).toBe(2);
    expect(muscleSets([block('curl', ...sets)], map, { completedOnly: true }).get('biceps')).toBe(1);
    expect(muscleSets([block('curl', { type: 'warmup' })], map).size).toBe(0);
  });

  it('counts a muscle listed as primary and secondary once, and a deleted exercise as other', () => {
    expect(muscleSets([block('odd', {}, {})], map).get('chest')).toBe(2);
    expect(muscleSets([block('gone', {})], map).get('other')).toBe(1);
  });

  it('adds several workouts together', () => {
    const a = muscleSets([block('bench', {})], map);
    const b = muscleSets([block('bench', {}), block('curl', {})], map);
    const sum = mergeMuscleSets([a, b]);
    expect(sum.get('chest')).toBe(2);
    expect(sum.get('shoulders')).toBe(1);
    expect(sum.get('biceps')).toBe(1);
  });
});

describe('ranking and shading', () => {
  it('lists only worked muscles, most first, ties in body order', () => {
    const totals = new Map<Muscle, number>([['biceps', 2], ['chest', 4], ['shoulders', 2], ['calves', 0]]);
    expect(rankedMuscles(totals, ['shoulders', 'biceps', 'chest', 'calves']).map((r) => r.muscle)).toEqual(['chest', 'shoulders', 'biceps']);
  });

  it('shades by share of the most worked muscle, from 1 to 4, and leaves unworked muscles at 0', () => {
    expect([0, 1, 2, 3, 4, 8].map((n) => muscleLevel(n, 8))).toEqual([0, 1, 1, 2, 2, 4]);
    expect(muscleLevel(0.5, 100)).toBe(1);
    expect(muscleLevel(5, 0)).toBe(0);
    expect(muscleLevel(Number.NaN, 5)).toBe(0);
  });
});
