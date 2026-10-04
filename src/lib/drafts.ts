import { useEffect, useRef, useState } from 'react';
import { db, getKV, setKV } from '../db';
import { canonical } from './syncCore';

// Unsaved editor state (routine and past-workout editors), written to kv on
// every change like the live workout, so the back gesture, a link or a killed
// app doesn't lose it. Drafts stay on the device; kv isn't synced. See ADR-001.

const storageKey = (key: string) => `draft:${key}`;

/** The stored draft for `key`: undefined while reading, null when there is none. */
export function useStoredDraft<T>(key: string) {
  const [draft, setDraft] = useState<{ key: string; value: T | null }>();
  useEffect(() => {
    let live = true;
    getKV<T>(storageKey(key)).then(
      (value) => live && setDraft({ key, value: value ?? null }),
      () => live && setDraft({ key, value: null }),
    );
    return () => {
      live = false;
    };
  }, [key]);
  return draft?.key === key ? draft.value : undefined;
}

export function clearDraft(key: string) {
  return db.kv.delete(storageKey(key));
}

/**
 * Editor state that persists itself. Starts from `stored` (a draft from
 * earlier) or `saved`; `dirty` compares against `saved`.
 */
export function useDraft<T>(key: string, saved: T, stored: T | null) {
  const [value, setValue] = useState<T>(() => stored ?? saved);
  // The version the editor opened with; later changes to `saved` don't move it.
  const baseline = useRef({ value: saved, json: canonical(saved) });
  const dirty = canonical(value) !== baseline.current.json;

  useEffect(() => {
    // Back to the saved version: there's nothing to keep.
    if (canonical(value) === baseline.current.json) void clearDraft(key);
    else void setKV(storageKey(key), value);
  }, [key, value]);

  return {
    value,
    update: setValue,
    dirty,
    /** Drops the changes and the stored draft. */
    discard: () => setValue(baseline.current.value),
    /** Forgets the draft once the changes are saved. */
    clear: () => {
      baseline.current = { value, json: canonical(value) };
      return clearDraft(key);
    },
  };
}
