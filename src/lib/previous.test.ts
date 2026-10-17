import { describe, expect, it } from 'vitest';
import type { Workout } from '../types';
import { previousSession } from './previous';

function workout(id: string, startTime: number, exerciseIds: string[], routineId?: string): Workout {
  return { id, title: id, startTime, endTime: startTime + 3600_000, exercises: [], exerciseIds, ...(routineId ? { routineId } : {}) };
}

// Newest first, as DataProvider keeps them.
const list = [
  workout('c', 3000, ['bench']),
  workout('b', 2000, ['bench', 'row'], 'push'),
  workout('a', 1000, ['bench'], 'push'),
];

describe('previousSession', () => {
  it('is the newest session of the exercise', () => {
    expect(previousSession(list, 'bench')?.id).toBe('c');
    expect(previousSession(list, 'row')?.id).toBe('b');
    expect(previousSession(list, 'squat')).toBeUndefined();
  });

  it('prefers the same routine, then falls back to any workout', () => {
    expect(previousSession(list, 'bench', { routineId: 'push' })?.id).toBe('b');
    expect(previousSession(list, 'bench', { routineId: 'legs' })?.id).toBe('c');
  });

  it('ignores sessions at or after `before`, and the one being edited', () => {
    expect(previousSession(list, 'bench', { before: 3000 })?.id).toBe('b');
    expect(previousSession(list, 'bench', { before: 2000, routineId: 'push' })?.id).toBe('a');
    expect(previousSession(list, 'bench', { excludeId: 'c' })?.id).toBe('b');
  });
});
