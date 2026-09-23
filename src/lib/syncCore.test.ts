import { describe, expect, it } from 'vitest';
import {
  adoptRemoteState,
  canonical,
  hashText,
  recKey,
  shardOf,
  SyncConflict,
  syncOnce,
  type LocalStore,
  type Rec,
  type RemoteStore,
  type SyncState,
} from './syncCore';

class MemoryRemote implements RemoteStore {
  files = new Map<string, { text: string; sha: string }>();
  writes = 0;
  private n = 0;
  /** Simulates another device writing between our list() and write(). */
  interfere?: () => Promise<unknown>;

  async list() {
    return new Map([...this.files].map(([k, v]) => [k, v.sha]));
  }
  async read(shard: string) {
    return this.files.get(shard)!.text;
  }
  async write(shard: string, text: string, sha: string | undefined) {
    const interfere = this.interfere;
    this.interfere = undefined;
    await interfere?.();
    if (this.files.get(shard)?.sha !== sha) throw new SyncConflict();
    const next = `sha${++this.n}`;
    this.files.set(shard, { text, sha: next });
    this.writes++;
    return next;
  }
}

class Device implements LocalStore {
  recs = new Map<string, Rec>();
  state?: SyncState;
  conflicts = 0;

  async read() {
    return new Map([...this.recs].map(([k, v]) => [k, structuredClone(v)]));
  }
  async apply(puts: Map<string, Rec>, deletes: string[]) {
    puts.forEach((r, k) => this.recs.set(k, structuredClone(r)));
    deletes.forEach((k) => this.recs.delete(k));
  }
  async sync(remote: RemoteStore) {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await syncOnce(this, remote, this.state, 'test');
        this.state = res.state;
        return res;
      } catch (e) {
        if (!(e instanceof SyncConflict) || attempt > 2) throw e;
        this.conflicts++;
      }
    }
  }
  put(kind: 'workouts' | 'routines' | 'exercises' | 'settings', rec: Rec) {
    this.recs.set(recKey(kind, rec.id), rec);
  }
  get(kind: 'workouts' | 'routines' | 'exercises' | 'settings', id: string) {
    return this.recs.get(recKey(kind, id));
  }
  workoutIds() {
    return [...this.recs.keys()].filter((k) => k.startsWith('workouts:')).sort();
  }
}

const workout = (id: string, extra: Partial<Rec> = {}): Rec => ({
  id,
  title: `Workout ${id}`,
  startTime: 1_700_000_000_000 + id.length * 1000 + id.charCodeAt(0),
  endTime: 1_700_000_360_000,
  exercises: [{ id: `${id}-e`, exerciseId: 'lib-bench', sets: [{ id: `${id}-s`, type: 'normal', weight: 60, reps: 8, completed: true }] }],
  exerciseIds: ['lib-bench'],
  ...extra,
});

describe('canonical serialisation', () => {
  it('ignores key order and undefined values', () => {
    expect(canonical({ b: 1, a: { d: 2, c: undefined, e: [3, { z: 1, y: 2 }] } })).toBe('{"a":{"d":2,"e":[3,{"y":2,"z":1}]},"b":1}');
    expect(hashText(canonical({ a: 1, b: 2 }))).toBe(hashText(canonical({ b: 2, a: 1 })));
  });

  it('spreads workouts over 16 shards and keeps other kinds in one file', () => {
    const shards = new Set(Array.from({ length: 400 }, (_, i) => shardOf('workouts', `id-${i}`)));
    expect(shards.size).toBe(16);
    expect(shardOf('routines', 'x')).toBe('routines');
  });
});

describe('syncOnce', () => {
  it('uploads a device and downloads it onto an empty one', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    for (let i = 0; i < 30; i++) phone.put('workouts', workout(`w${i}`));
    phone.put('routines', { id: 'r1', title: 'Chest day', exercises: [] });
    phone.put('settings', { id: 'settings', weightUnit: 'kg' });

    await phone.sync(remote);
    const pc = new Device();
    const res = await pc.sync(remote);

    expect(res.received).toBe(32);
    expect(pc.workoutIds()).toEqual(phone.workoutIds());
    expect(pc.get('settings', 'settings')).toEqual({ id: 'settings', weightUnit: 'kg' });
  });

  it('does nothing when nothing changed', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    phone.put('workouts', workout('a'));
    await phone.sync(remote);
    const writes = remote.writes;
    const res = await phone.sync(remote);
    expect(res).toMatchObject({ received: 0, pushed: 0 });
    expect(remote.writes).toBe(writes);
  });

  it('rewrites only the shard that changed', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    for (let i = 0; i < 50; i++) phone.put('workouts', workout(`w${i}`));
    await phone.sync(remote);
    phone.put('workouts', workout('new-one'));
    expect((await phone.sync(remote)).pushed).toBe(1);
  });

  it('propagates edits and deletions both ways', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    const pc = new Device();
    phone.put('workouts', workout('a'));
    phone.put('workouts', workout('b'));
    await phone.sync(remote);
    await pc.sync(remote);

    phone.put('workouts', workout('a', { title: 'Renamed on phone' }));
    pc.recs.delete(recKey('workouts', 'b'));
    await phone.sync(remote);
    await pc.sync(remote);
    await phone.sync(remote);

    for (const d of [phone, pc]) {
      expect(d.workoutIds()).toEqual(['workouts:a']);
      expect(d.get('workouts', 'a')?.title).toBe('Renamed on phone');
    }
  });

  it('keeps changes made to different records on both devices', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    const pc = new Device();
    await phone.sync(remote);
    await pc.sync(remote);
    phone.put('workouts', workout('from-phone'));
    pc.put('workouts', workout('from-pc'));
    pc.put('routines', { id: 'r', title: 'Legs', exercises: [] });
    await phone.sync(remote);
    await pc.sync(remote);
    await phone.sync(remote);
    expect(phone.workoutIds()).toEqual(['workouts:from-pc', 'workouts:from-phone']);
    expect(phone.get('routines', 'r')?.title).toBe('Legs');
  });

  it('resolves the same record edited on both devices by the newest change', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    const pc = new Device();
    phone.put('routines', { id: 'r', title: 'Push', exercises: [], updatedAt: 1 });
    await phone.sync(remote);
    await pc.sync(remote);
    phone.put('routines', { id: 'r', title: 'Push (phone)', exercises: [], updatedAt: 5 });
    pc.put('routines', { id: 'r', title: 'Push (pc)', exercises: [], updatedAt: 9 });
    await phone.sync(remote);
    await pc.sync(remote);
    await phone.sync(remote);
    expect(phone.get('routines', 'r')?.title).toBe('Push (pc)');
    expect(pc.get('routines', 'r')?.title).toBe('Push (pc)');
  });

  it('keeps an edited record that the other device deleted', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    const pc = new Device();
    phone.put('workouts', workout('a'));
    await phone.sync(remote);
    await pc.sync(remote);
    phone.recs.delete(recKey('workouts', 'a'));
    pc.put('workouts', workout('a', { title: 'Edited' }));
    await phone.sync(remote);
    await pc.sync(remote);
    await phone.sync(remote);
    expect(phone.get('workouts', 'a')?.title).toBe('Edited');
  });

  it('retries when another device writes mid-sync', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    const pc = new Device();
    phone.put('workouts', workout('a'));
    await phone.sync(remote);
    await pc.sync(remote);

    pc.put('routines', { id: 'r', title: 'From PC', exercises: [] });
    phone.put('routines', { id: 'q', title: 'From phone', exercises: [] });
    remote.interfere = () => pc.sync(remote);
    await phone.sync(remote);
    expect(phone.conflicts).toBe(1);
    await pc.sync(remote);
    expect(phone.get('routines', 'r')?.title).toBe('From PC');
    expect(pc.get('routines', 'q')?.title).toBe('From phone');
  });

  it('can make a device an exact copy of the cloud without pushing its own data', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    phone.put('workouts', workout('a'));
    phone.put('workouts', workout('b', { title: 'Cloud title' }));
    await phone.sync(remote);
    const writes = remote.writes;

    const pc = new Device();
    pc.put('workouts', workout('b', { title: 'Stale local title' }));
    pc.put('workouts', workout('local-only'));
    pc.state = adoptRemoteState(await pc.read());
    const res = await pc.sync(remote);

    expect(res.pushed).toBe(0);
    expect(remote.writes).toBe(writes);
    expect(pc.workoutIds()).toEqual(['workouts:a', 'workouts:b']);
    expect(pc.get('workouts', 'b')?.title).toBe('Cloud title');
  });

  it('leaves the device untouched when the cloud cannot be reached', async () => {
    const pc = new Device();
    pc.put('workouts', workout('keep-me'));
    pc.state = adoptRemoteState(await pc.read());
    const offline: RemoteStore = {
      list: () => Promise.reject(new Error('offline')),
      read: () => Promise.reject(new Error('offline')),
      write: () => Promise.reject(new Error('offline')),
    };
    await expect(pc.sync(offline)).rejects.toThrow('offline');
    expect(pc.workoutIds()).toEqual(['workouts:keep-me']);
  });

  it('does not duplicate history imported separately on two devices', async () => {
    const remote = new MemoryRemote();
    const phone = new Device();
    const pc = new Device();
    // Same Hevy export imported on each device: identical workouts, different ids.
    const fly = (id: string): Rec => ({ id, name: 'Cable Fly Crossovers', source: 'custom' });
    const w = (id: string, ex: string, startTime: number): Rec => ({
      ...workout(id),
      title: 'Chest day',
      startTime,
      exercises: [{ id: `${id}-e`, exerciseId: ex, sets: [] }],
      exerciseIds: [ex],
    });
    phone.put('exercises', fly('cus-phone'));
    phone.put('workouts', w('p1', 'cus-phone', 1000));
    phone.put('workouts', w('p2', 'cus-phone', 2000));
    pc.put('exercises', fly('cus-pc'));
    pc.put('workouts', w('c1', 'cus-pc', 1000));
    pc.put('workouts', w('c2', 'cus-pc', 2000));
    pc.put('workouts', w('c3', 'cus-pc', 3000)); // only on the PC
    pc.put('routines', { id: 'r', title: 'Chest day', exercises: [{ id: 'x', exerciseId: 'cus-pc', sets: [] }] });

    await phone.sync(remote);
    await pc.sync(remote);
    await phone.sync(remote);

    for (const d of [phone, pc]) {
      expect(d.workoutIds()).toEqual(['workouts:c3', 'workouts:p1', 'workouts:p2']);
      expect([...d.recs.keys()].filter((k) => k.startsWith('exercises:'))).toEqual(['exercises:cus-phone']);
      expect(d.get('workouts', 'c3')?.exerciseIds).toEqual(['cus-phone']);
      expect((d.get('routines', 'r')?.exercises as { exerciseId: string }[])[0].exerciseId).toBe('cus-phone');
    }
  });
});
