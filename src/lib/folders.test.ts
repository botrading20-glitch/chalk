import { describe, expect, it } from 'vitest';
import type { Routine } from '../types';
import { groupRoutines, moveItem, reorderedRoutines } from './folders';

const routine = (id: string, order: number, folder?: string): Routine => ({
  id,
  title: id,
  exercises: [],
  order,
  createdAt: 0,
  updatedAt: 0,
  ...(folder ? { folder } : {}),
});

describe('moveItem', () => {
  it('moves an item down and up', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
});

describe('reorderedRoutines', () => {
  it('reuses the group’s order values and returns only the routines that change', () => {
    const group = [routine('chest', 2), routine('back', 5), routine('legs', 9)];
    const changed = reorderedRoutines(group, ['legs', 'chest', 'back'], 123);
    expect(changed.map((r) => [r.id, r.order, r.updatedAt])).toEqual([
      ['legs', 2, 123],
      ['chest', 5, 123],
      ['back', 9, 123],
    ]);
    expect(reorderedRoutines(group, ['chest', 'back', 'legs'])).toEqual([]);
  });

  it('keeps routines in other folders where they are', () => {
    const all = [routine('push', 1, 'PPL'), routine('chest', 2), routine('pull', 3, 'PPL'), routine('back', 4)];
    const loose = groupRoutines(all).loose;
    const changed = reorderedRoutines(loose, ['back', 'chest']);
    const after = all.map((r) => changed.find((c) => c.id === r.id) ?? r).sort((a, b) => a.order - b.order);
    expect(groupRoutines(after).folders[0].routines.map((r) => r.id)).toEqual(['push', 'pull']);
    expect(groupRoutines(after).loose.map((r) => r.id)).toEqual(['back', 'chest']);
  });

  it('separates equal order values, so the new order sticks', () => {
    const group = [routine('a', 4), routine('b', 4), routine('c', 4)];
    const changed = reorderedRoutines(group, ['c', 'b', 'a']);
    const order = new Map(group.map((r) => [r.id, r.order]));
    for (const r of changed) order.set(r.id, r.order);
    expect([...order].sort((x, y) => x[1] - y[1]).map(([id]) => id)).toEqual(['c', 'b', 'a']);
  });
});
