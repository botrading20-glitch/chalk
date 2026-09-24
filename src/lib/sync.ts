import Dexie from 'dexie';
import { useSyncExternalStore } from 'react';
import { db, getKV, setKV } from '../db';
import { getRepo, GitHubError, githubRemote, type RepoRef } from './github';
import { adoptRemoteState, recKey, splitKey, SyncConflict, syncOnce, type LocalStore, type Rec, type SyncState } from './syncCore';

// Cloud sync to a private GitHub repository. The engine lives in syncCore.ts;
// this file adapts it to IndexedDB and decides when to run it.

export type SyncConfig = RepoRef;

export interface SyncStatus {
  phase: 'off' | 'idle' | 'syncing' | 'error';
  repo?: string;
  lastSyncAt?: number;
  message?: string;
  /** The connection itself is broken (token or repository), so syncing has stopped. */
  attention?: boolean;
}

let status: SyncStatus = { phase: 'off' };
const listeners = new Set<() => void>();
function setStatus(next: SyncStatus) {
  status = next;
  listeners.forEach((l) => l());
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
  );
}

type SyncedTable = Dexie.Table<Rec, string>;

/** IndexedDB side of the sync; exported for in-browser checks. */
export const localStore: LocalStore = {
  async read() {
    const out = new Map<string, Rec>();
    for (const w of await db.workouts.toArray()) out.set(recKey('workouts', w.id), w as unknown as Rec);
    for (const r of await db.routines.toArray()) out.set(recKey('routines', r.id), r as unknown as Rec);
    for (const e of await db.exercises.where('source').equals('custom').toArray()) out.set(recKey('exercises', e.id), e as unknown as Rec);
    for (const b of await db.bodyweight.toArray()) out.set(recKey('bodyweight', b.id), b as unknown as Rec);
    const settings = await getKV<Record<string, unknown>>('settings');
    if (settings) out.set(recKey('settings', 'settings'), { ...settings, id: 'settings' });
    return out;
  },

  async apply(puts, deletes) {
    const tables = {
      workouts: db.workouts as unknown as SyncedTable,
      routines: db.routines as unknown as SyncedTable,
      exercises: db.exercises as unknown as SyncedTable,
      bodyweight: db.bodyweight as unknown as SyncedTable,
    };
    await db.transaction('rw', db.workouts, db.routines, db.exercises, db.bodyweight, db.kv, async () => {
      for (const [key, rec] of puts) {
        const [kind] = splitKey(key);
        if (kind === 'settings') {
          const { id: _id, ...settings } = rec;
          await setKV('settings', settings);
        } else {
          await tables[kind].put(kind === 'exercises' ? { ...rec, source: 'custom' } : rec);
        }
      }
      for (const key of deletes) {
        const [kind, id] = splitKey(key);
        if (kind !== 'settings') await tables[kind].delete(id);
      }
    });
  },
};

export function getSyncConfig() {
  return getKV<SyncConfig>('syncConfig');
}

function deviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'Mac';
  return 'Linux';
}

let running: Promise<void> | null = null;
let again = false;
/** Set after an auth or permission error so background syncs stop until the user fixes the connection. */
let blocked = false;

async function runSync() {
  const config = await getSyncConfig();
  if (!config) {
    setStatus({ phase: 'off' });
    return;
  }
  const repo = `${config.owner}/${config.repo}`;
  setStatus({ ...status, phase: 'syncing', repo, message: undefined });
  try {
    const remote = githubRemote(config);
    for (let attempt = 0; ; attempt++) {
      try {
        const result = await syncOnce(localStore, remote, await getKV<SyncState>('syncState'), `Sync from ${deviceName()}`);
        const lastSyncAt = Date.now();
        await setKV('syncState', { ...result.state, lastSyncAt });
        blocked = false;
        setStatus({ phase: 'idle', repo, lastSyncAt });
        return;
      } catch (e) {
        // Another device wrote at the same moment: start over from its version.
        if (!(e instanceof SyncConflict) || attempt >= 3) throw e;
      }
    }
  } catch (e) {
    if (e instanceof GitHubError && [401, 403, 404].includes(e.status)) blocked = true;
    setStatus({ phase: 'error', repo, lastSyncAt: status.lastSyncAt, message: (e as Error).message, attention: blocked });
    throw e;
  }
}

/** Runs a sync now. A call made while one is running queues a single follow-up run. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = runSync().finally(() => {
    running = null;
    if (again) {
      again = false;
      void syncNow().catch(() => {});
    }
  });
  return running;
}

let timer: ReturnType<typeof setTimeout> | undefined;
let pending = false;

/** Debounced background sync after local changes. */
export function requestSync(delay = 4000) {
  if (blocked || status.phase === 'off') return;
  clearTimeout(timer);
  pending = true;
  timer = setTimeout(() => {
    pending = false;
    void syncNow().catch(() => {});
  }, delay);
}

const SYNCED_TABLES = /\/(workouts|routines|exercises|bodyweight)\//;

export async function startAutoSync() {
  const config = await getSyncConfig();
  const state = await getKV<SyncState>('syncState');
  if (config) setStatus({ phase: 'idle', repo: `${config.owner}/${config.repo}`, lastSyncAt: state?.lastSyncAt });

  Dexie.on('storagemutated', (parts) => {
    if (Object.keys(parts).some((p) => SYNCED_TABLES.test(p))) requestSync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - (status.lastSyncAt ?? 0) > 60_000) requestSync(500);
    // Push pending changes before the app is backgrounded or closed.
    if (document.visibilityState === 'hidden' && pending) requestSync(0);
  });
  window.addEventListener('online', () => requestSync(500));
  if (config) requestSync(500);
}

export async function checkRepo(config: SyncConfig) {
  const repo = await getRepo(config);
  const files = await githubRemote(config).list();
  return { ...repo, hasData: files.size > 0 };
}

export async function hasLocalData() {
  const counts = await Promise.all([
    db.workouts.count(),
    db.routines.count(),
    db.exercises.where('source').equals('custom').count(),
    db.bodyweight.count(),
  ]);
  return counts.some(Boolean);
}

/**
 * Saves the connection and runs the first sync. "replace" makes this device a
 * copy of the cloud; its own records are only removed once the cloud copy
 * has been downloaded.
 */
export async function connectSync(config: SyncConfig, mode: 'merge' | 'replace') {
  const state = mode === 'replace' ? adoptRemoteState(await localStore.read()) : undefined;
  await db.transaction('rw', db.kv, async () => {
    await setKV('syncConfig', config);
    if (state) await setKV('syncState', state);
    else await db.kv.delete('syncState');
  });
  blocked = false;
  setStatus({ phase: 'idle', repo: `${config.owner}/${config.repo}` });
  await syncNow();
}

/** Stops syncing on this device. Local data and the cloud copy are both kept. */
export async function disconnectSync() {
  clearTimeout(timer);
  pending = false;
  await db.kv.bulkDelete(['syncConfig', 'syncState']);
  blocked = false;
  setStatus({ phase: 'off' });
}
