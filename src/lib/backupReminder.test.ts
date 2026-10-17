import { describe, expect, it } from 'vitest';
import { backupDue, type ReminderState } from './backupReminder';

const DAY = 86_400_000;
const now = 100 * DAY;
const base: ReminderState = { reminder: 'weekly', lastBackupAt: now - 8 * DAY, snoozedUntil: 0, oldestWorkoutAt: now - 90 * DAY, syncHealthy: false, now };

describe('backupDue', () => {
  it('is due once the interval has passed', () => {
    expect(backupDue(base)).toBe(true);
    expect(backupDue({ ...base, lastBackupAt: now - 6 * DAY })).toBe(false);
  });

  it('follows the weekly and monthly choices', () => {
    const lastBackupAt = now - 20 * DAY;
    expect(backupDue({ ...base, lastBackupAt, reminder: 'weekly' })).toBe(true);
    expect(backupDue({ ...base, lastBackupAt, reminder: 'monthly' })).toBe(false);
    expect(backupDue({ ...base, lastBackupAt: now - 31 * DAY, reminder: 'monthly' })).toBe(true);
  });

  it('stays quiet when off, with no workouts, with healthy sync, or snoozed', () => {
    expect(backupDue({ ...base, reminder: 'off' })).toBe(false);
    expect(backupDue({ ...base, oldestWorkoutAt: undefined })).toBe(false);
    expect(backupDue({ ...base, syncHealthy: true })).toBe(false);
    expect(backupDue({ ...base, snoozedUntil: now + DAY })).toBe(false);
    expect(backupDue({ ...base, snoozedUntil: now - 1 })).toBe(true);
  });

  it('counts from the oldest workout for someone who never backed up', () => {
    expect(backupDue({ ...base, lastBackupAt: 0, oldestWorkoutAt: now - 3 * DAY })).toBe(false);
    expect(backupDue({ ...base, lastBackupAt: 0, oldestWorkoutAt: now - 8 * DAY })).toBe(true);
  });
});
