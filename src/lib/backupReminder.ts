import type { BackupReminder } from '../types';

const DAY = 86_400_000;

export const BACKUP_SNOOZE = 3 * DAY;

export interface ReminderState {
  reminder: BackupReminder;
  /** Epoch ms of the last backup file this device saved; 0 for never. */
  lastBackupAt: number;
  /** Don't remind before this time. */
  snoozedUntil: number;
  /** Start of the oldest workout, or undefined when there are none. */
  oldestWorkoutAt?: number;
  /** Cloud sync is on and working, which makes a file backup less pressing. */
  syncHealthy: boolean;
  now: number;
}

/**
 * Whether Home should nudge for a backup. Quiet when switched off, with no data, while sync is
 * working, or snoozed; for someone who never backed up, the clock starts at their oldest workout,
 * so a new user isn't nagged in the first week.
 */
export function backupDue(s: ReminderState) {
  if (s.reminder === 'off' || s.oldestWorkoutAt === undefined || s.syncHealthy) return false;
  if (s.now < s.snoozedUntil) return false;
  const interval = (s.reminder === 'weekly' ? 7 : 30) * DAY;
  return s.now - (s.lastBackupAt || s.oldestWorkoutAt) >= interval;
}
