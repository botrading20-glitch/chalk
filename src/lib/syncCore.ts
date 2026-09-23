// Storage-agnostic sync engine. Records are merged three ways against the
// snapshot taken at the last successful sync ("base"), so deletions need no
// tombstones: a record missing on one side that was present in the base was
// deleted there.
//
// Remote layout: one JSON file per shard. Workouts are spread over 16 shards
// by a hash of their id so a sync only rewrites a small file; routines,
// custom exercises and settings each get one file.

export type Kind = 'workouts' | 'routines' | 'exercises' | 'settings';
export type Rec = { id: string } & Record<string, unknown>;

const KINDS: Kind[] = ['workouts', 'routines', 'exercises', 'settings'];
const FORMAT = 'chalk-sync/1';

export const recKey = (kind: Kind, id: string) => `${kind}:${id}`;

export function splitKey(key: string): [Kind, string] {
  const i = key.indexOf(':');
  return [key.slice(0, i) as Kind, key.slice(i + 1)];
}

/** JSON with object keys sorted at every level, so equal data always serialises identically. */
export function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
      : v,
  );
}

/** cyrb53: fast 53-bit string hash, plenty for change detection. */
export function hashText(s: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function shardOf(kind: Kind, id: string) {
  if (kind !== 'workouts') return kind;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return `workouts-${((h >>> 0) & 15).toString(16)}`;
}

export function kindOfShard(shard: string): Kind | undefined {
  const kind = shard.startsWith('workouts-') ? 'workouts' : shard;
  return KINDS.includes(kind as Kind) ? (kind as Kind) : undefined;
}

/** One record per line keeps the files readable and the commit diffs small. */
export function serializeShard(records: Rec[]) {
  const sorted = [...records].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return `{"format":"${FORMAT}","records":[\n${sorted.map(canonical).join(',\n')}\n]}\n`;
}

export function parseShard(text: string): Rec[] {
  const data = JSON.parse(text);
  if (data?.format !== FORMAT || !Array.isArray(data.records)) {
    throw new Error('The sync repository contains a file Chalk does not recognise.');
  }
  return data.records.filter((r: Rec) => r && typeof r.id === 'string');
}

const stamp = (r: Rec) => Number(r.updatedAt ?? r.endTime ?? r.startTime ?? 0);

export interface MergeInput {
  local: Map<string, Rec>;
  base: Record<string, string>;
  /** Current records of every remote shard not listed in `unchanged`. */
  remote: Map<string, Rec>;
  /** Shards whose remote content is the same as at the last sync, so it equals the base. */
  unchanged: Set<string>;
}

export function merge3({ local, base, remote, unchanged }: MergeInput) {
  const merged = new Map<string, Rec>();
  const puts = new Map<string, Rec>();
  const deletes: string[] = [];
  const keys = new Set([...local.keys(), ...Object.keys(base), ...remote.keys()]);

  for (const key of keys) {
    const [kind, id] = splitKey(key);
    const b = base[key];
    const l = local.get(key);
    const lh = l && hashText(canonical(l));
    const known = !unchanged.has(shardOf(kind, id));
    const r = known ? remote.get(key) : undefined;
    const rh = known ? r && hashText(canonical(r)) : b;
    const localChanged = lh !== b;
    const remoteChanged = rh !== b;

    let useRemote: boolean;
    if (!remoteChanged) useRemote = false;
    else if (!localChanged) useRemote = true;
    else if (lh === rh) useRemote = false;
    // Edited on one device, deleted on the other: keep the edit.
    else if (l && !r) useRemote = false;
    else if (!l && r) useRemote = true;
    else useRemote = stamp(r!) >= stamp(l!);

    if (!useRemote) {
      if (l) merged.set(key, l);
    } else if (r) {
      merged.set(key, r);
      puts.set(key, r);
    } else if (l) {
      deletes.push(key);
    }
  }
  return { merged, puts, deletes };
}

const normName = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * First sync on a device that already has data while the cloud has data too,
 * typically because the same Hevy export was imported on both. Workouts that
 * match by start time and title keep the cloud copy, and custom exercises
 * with the same name are merged onto the cloud id.
 */
export function reconcileFirstSync(local: Map<string, Rec>, remote: Map<string, Rec>) {
  const out = new Map(local);
  const puts = new Map<string, Rec>();
  const deletes: string[] = [];

  const remoteExercise = new Map<string, string>();
  const remoteWorkouts = new Set<string>();
  for (const [key, r] of remote) {
    const [kind] = splitKey(key);
    if (kind === 'exercises') remoteExercise.set(normName(r.name), r.id);
    if (kind === 'workouts') remoteWorkouts.add(`${r.startTime}|${normName(r.title)}`);
  }

  const remap = new Map<string, string>();
  for (const [key, l] of local) {
    const [kind] = splitKey(key);
    if (kind === 'exercises') {
      const rid = remoteExercise.get(normName(l.name));
      if (rid && rid !== l.id) {
        remap.set(l.id, rid);
        out.delete(key);
        deletes.push(key);
      }
    }
    if (kind === 'workouts' && !remote.has(key) && remoteWorkouts.has(`${l.startTime}|${normName(l.title)}`)) {
      out.delete(key);
      deletes.push(key);
    }
  }

  if (remap.size) {
    for (const [key, l] of out) {
      const [kind] = splitKey(key);
      if (kind !== 'workouts' && kind !== 'routines') continue;
      const exercises = l.exercises as { exerciseId: string }[];
      if (!exercises.some((we) => remap.has(we.exerciseId))) continue;
      const updated: Rec = {
        ...l,
        exercises: exercises.map((we) => (remap.has(we.exerciseId) ? { ...we, exerciseId: remap.get(we.exerciseId) } : we)),
      };
      if (kind === 'workouts') {
        updated.exerciseIds = [...new Set((updated.exercises as { exerciseId: string }[]).map((we) => we.exerciseId))];
      }
      out.set(key, updated);
      puts.set(key, updated);
    }
  }
  return { local: out, puts, deletes };
}

/**
 * A starting state that treats every local record as already synced. The next
 * sync then takes the cloud's version of everything, and deletes local
 * records the cloud doesn't have, but only once the cloud copy has been
 * downloaded, so a failed connection leaves the device untouched.
 */
export function adoptRemoteState(local: Map<string, Rec>): SyncState {
  return { shards: {}, base: Object.fromEntries([...local].map(([k, r]) => [k, hashText(canonical(r))])) };
}

// ---------------------------------------------------------------------------

export interface LocalStore {
  read(): Promise<Map<string, Rec>>;
  apply(puts: Map<string, Rec>, deletes: string[]): Promise<void>;
}

export interface RemoteStore {
  /** shard name → content sha */
  list(): Promise<Map<string, string>>;
  read(shard: string): Promise<string>;
  /** Writes only if the remote still has `sha`; returns the new sha or throws SyncConflict. */
  write(shard: string, text: string, sha: string | undefined, message: string): Promise<string>;
}

export interface SyncState {
  shards: Record<string, { sha: string; hash: string }>;
  base: Record<string, string>;
  lastSyncAt?: number;
}

export class SyncConflict extends Error {
  constructor() {
    super('The cloud copy changed during sync.');
  }
}

export interface SyncResult {
  state: SyncState;
  /** Local records created, changed or removed by the sync. */
  received: number;
  /** Files written to the remote. */
  pushed: number;
}

export async function syncOnce(local: LocalStore, remote: RemoteStore, prev: SyncState | undefined, message: string): Promise<SyncResult> {
  const state = prev ?? { shards: {}, base: {} };
  const first = !Object.keys(state.base).length && !Object.keys(state.shards).length;

  const listing = new Map([...(await remote.list())].filter(([shard]) => kindOfShard(shard)));
  // Shards missing from the listing are simply empty; only shards whose sha
  // matches the last sync can be skipped.
  const unchanged = new Set<string>();
  const remoteRecs = new Map<string, Rec>();
  const remoteHash: Record<string, string> = {};

  for (const [shard, sha] of listing) {
    if (state.shards[shard]?.sha === sha) {
      unchanged.add(shard);
      continue;
    }
    const kind = kindOfShard(shard)!;
    const recs = parseShard(await remote.read(shard));
    for (const r of recs) remoteRecs.set(recKey(kind, r.id), r);
    remoteHash[shard] = hashText(serializeShard(recs));
  }

  let localRecs = await local.read();
  const puts = new Map<string, Rec>();
  const deletes = new Set<string>();
  if (first && localRecs.size && remoteRecs.size) {
    const rec = reconcileFirstSync(localRecs, remoteRecs);
    localRecs = rec.local;
    rec.puts.forEach((r, k) => puts.set(k, r));
    rec.deletes.forEach((k) => deletes.add(k));
  }

  const result = merge3({ local: localRecs, base: state.base, remote: remoteRecs, unchanged });
  result.puts.forEach((r, k) => {
    puts.set(k, r);
    deletes.delete(k);
  });
  result.deletes.forEach((k) => {
    deletes.add(k);
    puts.delete(k);
  });
  if (puts.size || deletes.size) await local.apply(puts, [...deletes]);

  const byShard = new Map<string, Rec[]>();
  for (const [key, r] of result.merged) {
    const [kind, id] = splitKey(key);
    const shard = shardOf(kind, id);
    byShard.set(shard, [...(byShard.get(shard) ?? []), r]);
  }

  const next: SyncState = { shards: {}, base: {} };
  let pushed = 0;
  for (const shard of new Set([...listing.keys(), ...Object.keys(state.shards), ...byShard.keys()])) {
    const records = byShard.get(shard) ?? [];
    const text = serializeShard(records);
    const hash = hashText(text);
    const sha = listing.get(shard);
    const knownHash = unchanged.has(shard) ? state.shards[shard].hash : remoteHash[shard];
    if (sha && hash === knownHash) {
      next.shards[shard] = { sha, hash };
      continue;
    }
    if (!sha && !records.length) continue;
    next.shards[shard] = { sha: await remote.write(shard, text, sha, message), hash };
    pushed++;
  }
  for (const [key, r] of result.merged) next.base[key] = hashText(canonical(r));

  return { state: next, received: puts.size + deletes.size, pushed };
}
