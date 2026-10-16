import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { exportBackup } from '../lib/backup';
import { saveFile } from '../lib/csv';
import { count, listJoin, t } from '../i18n';
import { checkData, deleteIssue, describeRecord, KIND_LABEL, KIND_WORD, repairIssue, type CheckResult, type Issue } from '../lib/dataCheck';
import { getSyncConfig } from '../lib/sync';

const issueId = (i: Issue) => `${i.kind}:${String(i.key)}`;
const kindWord = (i: Issue) => KIND_WORD[i.kind];

/**
 * Finds records too damaged for the app to read, and lets the user repair or
 * delete each one. Used in Settings and on the crash screen, so it relies on
 * nothing but the database: no DataProvider, router or dialogs.
 */
export function DataCheck({ afterClean }: { afterClean?: ReactNode }) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [backup, setBackup] = useState<'idle' | 'saving' | 'saved' | string>('idle');
  const [syncOn, setSyncOn] = useState(false);
  const [acted, setActed] = useState(false);
  const summary = useRef<HTMLDivElement>(null);

  const run = useCallback(async () => {
    try {
      setResult(await checkData());
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void run();
    getSyncConfig()
      .then((config) => setSyncOn(!!config))
      .catch(() => {});
  }, [run]);

  async function act(issue: Issue, action: 'repair' | 'delete') {
    setBusy(true);
    setConfirming(null);
    try {
      const outcome = await (action === 'repair' ? repairIssue(issue) : deleteIssue(issue));
      if (outcome === 'done') {
        setActed(true);
        setNotice(t(action === 'repair' ? 'check.repaired' : 'check.deleted', { kind: kindWord(issue), label: issue.label }));
      } else {
        setNotice(t('check.stale'));
      }
      await run();
    } catch (e) {
      setNotice(t(action === 'repair' ? 'check.repairFailed' : 'check.deleteFailed', { message: (e as Error).message }));
    } finally {
      setBusy(false);
      summary.current?.focus();
    }
  }

  async function download() {
    setBackup('saving');
    try {
      await saveFile(`setward-backup-${new Date().toISOString().slice(0, 10)}.json`, await exportBackup(), 'application/json');
      setBackup('saved');
    } catch (e) {
      setBackup(t('recovery.readFailed', { message: (e as Error).message }));
    }
  }

  if (error) {
    return (
      <div className="data-check">
        <p className="form-error" role="alert">
          {t('check.failed', { error })}
        </p>
        <button className="btn btn-secondary" onClick={() => void run()}>
          {t('common.retry')}
        </button>
      </div>
    );
  }
  if (!result) return <p className="muted data-check">{t('check.running')}</p>;

  const { counts, issues } = result;
  const checked = [
    counts.workouts ? count('workout', counts.workouts) : '',
    counts.routines ? count('routine', counts.routines) : '',
    counts.exercises ? count('exerciseOwn', counts.exercises) : '',
    counts.bodyweight ? count('weighIn', counts.bodyweight) : '',
    counts.settings ? t('check.yourSettings') : '',
  ].filter(Boolean);

  return (
    <div className="data-check">
      <div ref={summary} tabIndex={-1} className="data-check-summary">
        {issues.length ? (
          <>
            <strong>{t('check.found', { count: count('problem', issues.length) })}</strong>
            <p className="muted small">{t('check.explain')}</p>
          </>
        ) : (
          <>
            <strong>{acted ? t('check.cleanLeft') : t('check.clean')}</strong>
            <p className="muted small">{checked.length ? t('check.checked', { items: listJoin(checked) }) : t('check.nothing')}</p>
          </>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>
      {notice && (
        <p className="data-check-notice small" aria-hidden="true">
          {notice}
        </p>
      )}

      <div className="data-check-backup">
        <button className="btn btn-secondary" onClick={download} disabled={backup === 'saving'}>
          {t('recovery.download')}
        </button>
        {backup === 'saved' && <span className="muted small">{t('check.backupSaved')}</span>}
        {backup !== 'idle' && backup !== 'saving' && backup !== 'saved' && <span className="form-error">{backup}</span>}
      </div>

      {syncOn && issues.length > 0 && (
        <p className="muted small">{t('check.syncOn')}</p>
      )}

      {issues.length > 0 && (
        <ul className="data-check-list">
          {issues.map((issue) => {
            const id = issueId(issue);
            const name = issue.kind === 'settings' ? t('check.yourSettings') : t('check.named', { kind: kindWord(issue), label: issue.label });
            return (
              <li key={id} className="data-check-item" data-status={issue.status}>
                <div className="data-check-title">
                  <span className="data-check-kind">{KIND_LABEL[issue.kind]}</span>
                  <strong>{issue.label}</strong>
                </div>
                <p className="muted small">
                  {issue.status === 'repairable'
                    ? t('check.canRepair', { fields: listJoin(issue.fields) })
                    : t('check.onlyDelete')}
                  {issue.status === 'damaged' && issue.usedBy && t('check.usedBy', { uses: issue.usedBy, deleted: t('exercise.deleted') })}
                </p>
                <details>
                  <summary>{t('check.show')}</summary>
                  <pre className="data-check-record">{describeRecord(issue.raw)}</pre>
                </details>
                <div className="data-check-actions">
                  {issue.status === 'repairable' && (
                    <button className="btn btn-secondary" disabled={busy} aria-label={t('check.repairLabel', { name })} onClick={() => void act(issue, 'repair')}>
                      {t('check.repair')}
                    </button>
                  )}
                  {issue.status === 'damaged' && confirming !== id && (
                    <button className="btn btn-danger-ghost" disabled={busy} aria-label={t('check.deleteLabel', { name })} onClick={() => setConfirming(id)}>
                      {t('common.delete')}
                    </button>
                  )}
                  {issue.status === 'damaged' && confirming === id && (
                    <div className="data-check-confirm" role="group" aria-label={t('check.confirmLabel', { name })}>
                      <span>{t('check.confirmQuestion', { kind: kindWord(issue) })}</span>
                      <button className="btn btn-danger" disabled={busy} onClick={() => void act(issue, 'delete')}>
                        {t('common.delete')}
                      </button>
                      <button className="btn btn-ghost" autoFocus onClick={() => setConfirming(null)}>
                        {t('check.keep')}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {issues.length === 0 && afterClean}
    </div>
  );
}
