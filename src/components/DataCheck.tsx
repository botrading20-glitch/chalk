import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { exportBackup } from '../lib/backup';
import { saveFile } from '../lib/csv';
import { checkData, deleteIssue, describeRecord, KIND_LABEL, repairIssue, type CheckResult, type Issue } from '../lib/dataCheck';
import { listJoin, plural } from '../lib/format';
import { getSyncConfig } from '../lib/sync';

const issueId = (i: Issue) => `${i.kind}:${String(i.key)}`;
const kindWord = (i: Issue) => KIND_LABEL[i.kind].toLowerCase();

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
        setNotice(`${action === 'repair' ? 'Repaired' : 'Deleted'} ${kindWord(issue)}: ${issue.label}.`);
      } else {
        setNotice('That record changed since the check, so it was left alone.');
      }
      await run();
    } catch (e) {
      setNotice(`Couldn't ${action} it: ${(e as Error).message}`);
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
      setBackup(`Couldn't read your data: ${(e as Error).message}`);
    }
  }

  if (error) {
    return (
      <div className="data-check">
        <p className="form-error" role="alert">
          Couldn't check your data: {error}
        </p>
        <button className="btn btn-secondary" onClick={() => void run()}>
          Try again
        </button>
      </div>
    );
  }
  if (!result) return <p className="muted data-check">Checking your data…</p>;

  const { counts, issues } = result;
  const checked = [
    counts.workouts ? plural(counts.workouts, 'workout') : '',
    counts.routines ? plural(counts.routines, 'routine') : '',
    counts.exercises ? plural(counts.exercises, 'exercise of your own', 'exercises of your own') : '',
    counts.bodyweight ? plural(counts.bodyweight, 'weigh-in') : '',
    counts.settings ? 'your settings' : '',
  ].filter(Boolean);

  return (
    <div className="data-check">
      <div ref={summary} tabIndex={-1} className="data-check-summary">
        {issues.length ? (
          <>
            <strong>Found {plural(issues.length, 'problem')}.</strong>
            <p className="muted small">
              These records can't be read the way Setward expects, and one of them can stop the app from opening. Download a backup first; then repair what
              Setward can fix and delete the rest. Nothing changes until you tap a button.
            </p>
          </>
        ) : (
          <>
            <strong>{acted ? 'No problems left.' : 'No problems found.'}</strong>
            <p className="muted small">{checked.length ? `Checked ${listJoin(checked)}.` : 'There is no data to check yet.'}</p>
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
          Download a backup
        </button>
        {backup === 'saved' && <span className="muted small">Backup saved.</span>}
        {backup !== 'idle' && backup !== 'saving' && backup !== 'saved' && <span className="form-error">{backup}</span>}
      </div>

      {syncOn && issues.length > 0 && (
        <p className="muted small">Cloud sync is on, so repairs and deletions here reach your other devices too.</p>
      )}

      {issues.length > 0 && (
        <ul className="data-check-list">
          {issues.map((issue) => {
            const id = issueId(issue);
            const name = issue.kind === 'settings' ? 'your settings' : `${kindWord(issue)} ${issue.label}`;
            return (
              <li key={id} className="data-check-item" data-status={issue.status}>
                <div className="data-check-title">
                  <span className="data-check-kind">{KIND_LABEL[issue.kind]}</span>
                  <strong>{issue.label}</strong>
                </div>
                <p className="muted small">
                  {issue.status === 'repairable'
                    ? `Can be repaired. Setward will fix the ${listJoin(issue.fields)}.`
                    : "Can't be read, so it can only be deleted."}
                  {issue.status === 'damaged' && issue.usedBy && ` It is used in ${issue.usedBy}, which will show “Deleted exercise”.`}
                </p>
                <details>
                  <summary>Show the record</summary>
                  <pre className="data-check-record">{describeRecord(issue.raw)}</pre>
                </details>
                <div className="data-check-actions">
                  {issue.status === 'repairable' && (
                    <button className="btn btn-secondary" disabled={busy} aria-label={`Repair ${name}`} onClick={() => void act(issue, 'repair')}>
                      Repair
                    </button>
                  )}
                  {issue.status === 'damaged' && confirming !== id && (
                    <button className="btn btn-danger-ghost" disabled={busy} aria-label={`Delete ${name}`} onClick={() => setConfirming(id)}>
                      Delete
                    </button>
                  )}
                  {issue.status === 'damaged' && confirming === id && (
                    <div className="data-check-confirm" role="group" aria-label={`Confirm deleting ${name}`}>
                      <span>Delete this {kindWord(issue)} for good?</span>
                      <button className="btn btn-danger" disabled={busy} onClick={() => void act(issue, 'delete')}>
                        Delete
                      </button>
                      <button className="btn btn-ghost" autoFocus onClick={() => setConfirming(null)}>
                        Keep
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
