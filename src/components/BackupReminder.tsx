import { saveBackupFile } from '../lib/backup';
import { BACKUP_SNOOZE, backupDue } from '../lib/backupReminder';
import { useData, useNow } from '../lib/data';
import { fmtRelativeDay } from '../lib/format';
import { setPref, usePref } from '../lib/prefs';
import { useSettings } from '../lib/settings';
import { useSyncStatus } from '../lib/sync';
import { toast } from './dialogs';
import { IconDownload } from './Icons';
import { t } from '../i18n';

/**
 * Home's nudge to save a backup file, per the "Backup reminder" setting. It stays quiet
 * while cloud sync is working, and for a new user until their data is as old as the interval.
 */
export function BackupReminder() {
  const { backupReminder } = useSettings();
  const { workouts } = useData();
  const lastBackupAt = usePref('lastBackupAt');
  const snoozedUntil = usePref('backupSnoozedUntil');
  const sync = useSyncStatus();
  const now = useNow(60_000);

  if (lastBackupAt === undefined || snoozedUntil === undefined) return null;
  const due = backupDue({
    reminder: backupReminder,
    lastBackupAt,
    snoozedUntil,
    oldestWorkoutAt: workouts.at(-1)?.startTime,
    syncHealthy: sync.phase === 'idle' || sync.phase === 'syncing',
    now,
  });
  if (!due) return null;

  return (
    <section className="card backup-card" aria-label={t('backupCard.title')}>
      <div className="backup-text">
        <strong>{t('backupCard.title')}</strong>
        <span>{lastBackupAt ? t('backupCard.since', { when: fmtRelativeDay(lastBackupAt) }) : t('backupCard.never')}</span>
      </div>
      <div className="backup-actions">
        <button className="btn btn-secondary btn-small" onClick={() => setPref('backupSnoozedUntil', now + BACKUP_SNOOZE)}>
          {t('backupCard.later')}
        </button>
        <button
          className="btn btn-primary btn-small"
          onClick={async () => {
            if (await saveBackupFile()) toast(t('bk.saved'));
          }}
        >
          <IconDownload size={16} /> {t('backupCard.now')}
        </button>
      </div>
    </section>
  );
}
