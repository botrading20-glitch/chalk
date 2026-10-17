import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Key } from '../i18n/catalog';
import { useData } from './data';
import { setPref, usePref } from './prefs';

/** What changed in each release the user should hear about: a title key and a text key per entry. */
export const WHATS_NEW: Record<string, [Key, Key][]> = {
  '1.0.0': [
    ['new.look.title', 'new.look.text'],
    ['new.languages.title', 'new.languages.text'],
    ['new.settings.title', 'new.settings.text'],
    ['new.start.title', 'new.start.text'],
    ['new.past.title', 'new.past.text'],
    ['new.records.title', 'new.records.text'],
  ],
};

export type WhatsNewAction = 'show' | 'remember' | 'none';

/**
 * What to do about "What's new" for this version.
 * - `none`: already shown, or the version was recorded.
 * - `remember`: nothing to tell, or a brand-new install (the welcome screen covers it): just record the version.
 * - `show`: an update with news. A device with data and no recorded version is one updating from before the list existed.
 */
export function whatsNewAction(s: { seen: string; version: string; hasData: boolean }, entries: Record<string, unknown> = WHATS_NEW): WhatsNewAction {
  if (s.seen === s.version) return 'none';
  if (!entries[s.version]) return 'remember';
  if (s.seen === '' && !s.hasData) return 'remember';
  return 'show';
}

/** Whether to offer the list now, and how to close it. Silent until the data has loaded. */
export function useWhatsNew() {
  const { workouts, ready } = useData();
  const routineCount = useLiveQuery(() => db.routines.count(), []);
  const seen = usePref('lastSeenVersion');
  const [closed, setClosed] = useState(false);
  const loaded = ready && routineCount !== undefined && seen !== undefined;
  const action = loaded ? whatsNewAction({ seen, version: __APP_VERSION__, hasData: workouts.length + routineCount > 0 }) : 'none';

  useEffect(() => {
    if (action === 'remember') void setPref('lastSeenVersion', __APP_VERSION__);
  }, [action]);

  return {
    show: action === 'show' && !closed,
    close: () => {
      setClosed(true);
      void setPref('lastSeenVersion', __APP_VERSION__);
    },
  };
}
