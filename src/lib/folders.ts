import { useLiveQuery } from 'dexie-react-hooks';
import { db, getKV, setKV } from '../db';
import type { Routine } from '../types';

// Routine folders are just a `folder` name on each routine: no separate
// records to sync, and a folder disappears once nothing is in it.

export interface Folder {
  name: string;
  routines: Routine[];
}

const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/** Folders A–Z, each keeping routine order, plus the routines in no folder. */
export function groupRoutines(routines: Routine[]) {
  const map = new Map<string, Routine[]>();
  const loose: Routine[] = [];
  for (const r of routines) {
    const name = r.folder?.trim();
    if (name) map.set(name, [...(map.get(name) ?? []), r]);
    else loose.push(r);
  }
  const folders: Folder[] = [...map].sort(([a], [b]) => byName(a, b)).map(([name, list]) => ({ name, routines: list }));
  return { folders, loose };
}

/** Reuses an existing folder's spelling when the name only differs in case. */
export function folderName(input: string, existing: string[]) {
  const name = input.trim().replace(/\s+/g, ' ');
  return existing.find((f) => f.toLowerCase() === name.toLowerCase()) ?? name;
}

function withFolder(r: Routine, folder: string | undefined): Routine {
  const { folder: _old, ...rest } = r;
  return { ...rest, ...(folder ? { folder } : {}), updatedAt: Date.now() };
}

/** Puts the given routines in `folder` (undefined: no folder). */
export async function moveToFolder(ids: string[], folder: string | undefined) {
  const routines = (await db.routines.bulkGet(ids)).filter((r): r is Routine => !!r && r.folder !== folder);
  await db.routines.bulkPut(routines.map((r) => withFolder(r, folder)));
}

/**
 * Makes `members` exactly the routines in the folder now called `name`:
 * renames it, adds the new ones and takes out the rest. `previous` is the
 * folder's old name when editing one.
 */
export async function saveFolder(name: string, members: string[], previous?: string) {
  await db.transaction('rw', db.routines, async () => {
    const all = await db.routines.toArray();
    const keep = new Set(members);
    const changed = all.flatMap((r) => {
      if (keep.has(r.id)) return r.folder === name ? [] : [withFolder(r, name)];
      if (previous !== undefined && r.folder === previous) return [withFolder(r, undefined)];
      return [];
    });
    await db.routines.bulkPut(changed);
  });
}

/** Removes the folder; its routines stay, just not in a folder. */
export async function removeFolder(name: string) {
  const inside = await db.routines.filter((r) => r.folder === name).toArray();
  await db.routines.bulkPut(inside.map((r) => withFolder(r, undefined)));
}

// Which folders are collapsed is a per-device view preference, so it lives in
// kv (not synced) rather than in settings.
const COLLAPSED = 'collapsedFolders';

export function useCollapsedFolders() {
  return useLiveQuery(async () => new Set((await getKV<string[]>(COLLAPSED)) ?? []), []) ?? new Set<string>();
}

export async function toggleFolder(name: string) {
  const current = new Set((await getKV<string[]>(COLLAPSED)) ?? []);
  if (current.has(name)) current.delete(name);
  else current.add(name);
  await setKV(COLLAPSED, [...current]);
}
