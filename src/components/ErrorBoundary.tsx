import { Component, useState, type ErrorInfo, type ReactNode } from 'react';
import { exportBackup } from '../lib/backup';
import { saveFile } from '../lib/csv';

/**
 * Last line of defence: a render error anywhere shows this screen instead of a
 * blank page. All data is local, so it always offers a backup; the backup reads
 * IndexedDB directly and doesn't depend on any of the app's React state.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Chalk crashed while rendering', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <RecoveryScreen
        error={this.state.error}
        onHome={() => {
          window.location.hash = '/';
          this.setState({ error: null });
        }}
      />
    );
  }
}

/** Also used when the app can't start at all, so it relies on nothing but the database. */
export function RecoveryScreen({ error, onHome }: { error: unknown; onHome?: () => void }) {
  const [backup, setBackup] = useState<'idle' | 'saving' | 'saved' | string>('idle');
  const message = error instanceof Error ? error.message : String(error);

  async function download() {
    setBackup('saving');
    try {
      await saveFile(`chalk-backup-${new Date().toISOString().slice(0, 10)}.json`, await exportBackup(), 'application/json');
      setBackup('saved');
    } catch (e) {
      setBackup(`Couldn't read your data: ${(e as Error).message}`);
    }
  }

  return (
    <div className="page recovery" role="alert">
      <div className="empty">
        <h3>Something went wrong</h3>
        <p className="muted">Chalk hit an error and couldn't show this screen. Your workouts are still saved on this device.</p>
        <div className="empty-actions">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
          {onHome && (
            <button className="btn btn-secondary" onClick={onHome}>
              Go to Workout
            </button>
          )}
        </div>
        <button className="btn btn-ghost" onClick={download} disabled={backup === 'saving'}>
          Download a backup
        </button>
        {backup === 'saved' && <p className="muted small">Backup saved. Restore it any time from Settings.</p>}
        {backup !== 'idle' && backup !== 'saving' && backup !== 'saved' && <p className="form-error">{backup}</p>}
        <details className="recovery-details">
          <summary>Error details</summary>
          <code>{message}</code>
        </details>
      </div>
    </div>
  );
}
