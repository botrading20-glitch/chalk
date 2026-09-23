import { useState } from 'react';
import { useNow } from '../lib/data';
import { fmtAgo } from '../lib/format';
import { checkRepo, connectSync, disconnectSync, hasLocalData, syncNow, useSyncStatus, type SyncConfig } from '../lib/sync';
import { confirmDialog, toast } from './dialogs';
import { IconCloud } from './Icons';
import { Sheet } from './Sheet';

export function SyncSettings() {
  const status = useSyncStatus();
  const now = useNow(30_000);
  const [setup, setSetup] = useState(false);
  const on = status.phase !== 'off';

  return (
    <section className="card settings-group">
      <div className="sync-head">
        <h2 className="card-title">Cloud sync</h2>
        {on && <span className={`sync-pill ${status.phase}`}>{status.phase === 'error' ? 'Needs attention' : 'On'}</span>}
      </div>

      {!on ? (
        <>
          <p className="muted small">
            Keep a copy of everything in a private GitHub repository and use Chalk on more than one device. Every sync is saved
            in the repository’s history, so you can always go back to an earlier version.
          </p>
          <button className="btn btn-secondary btn-block" onClick={() => setSetup(true)}>
            <IconCloud size={18} /> Set up sync
          </button>
        </>
      ) : (
        <>
          <a className="sync-repo" href={`https://github.com/${status.repo}/commits`} target="_blank" rel="noreferrer">
            {status.repo}
          </a>
          <p className={`small ${status.phase === 'error' ? 'form-error' : 'muted'}`} role="status">
            {status.phase === 'syncing'
              ? 'Syncing…'
              : status.phase === 'error'
                ? status.message
                : status.lastSyncAt
                  ? `Last synced ${fmtAgo(status.lastSyncAt, now)}`
                  : 'Waiting for the first sync'}
          </p>
          <div className="button-pair">
            <button
              className="btn btn-secondary"
              disabled={status.phase === 'syncing'}
              onClick={() => syncNow().catch(() => toast('Sync failed. See the message above.'))}
            >
              Sync now
            </button>
            <button className="btn btn-ghost" onClick={() => setSetup(true)}>
              Change token
            </button>
          </div>
          <button
            className="btn btn-danger-ghost btn-block"
            onClick={async () => {
              const ok = await confirmDialog({
                title: 'Turn off sync on this device?',
                message: 'Your workouts stay on this device and in the cloud. Changes just stop syncing from here.',
                confirmLabel: 'Turn off sync',
              });
              if (ok) await disconnectSync();
            }}
          >
            Turn off sync on this device
          </button>
        </>
      )}

      <Sheet open={setup} onClose={() => setSetup(false)} title="Set up cloud sync">
        <SyncSetup initialRepo={status.repo} onDone={() => setSetup(false)} />
      </Sheet>
    </section>
  );
}

function parseRepo(input: string) {
  const m = input
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/(\.git)?\/?$/, '')
    .match(/^([\w.-]+)\/([\w.-]+)$/);
  return m ? { owner: m[1], repo: m[2] } : undefined;
}

function SyncSetup({ initialRepo, onDone }: { initialRepo?: string; onDone: () => void }) {
  const [repo, setRepo] = useState(initialRepo ?? '');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [choice, setChoice] = useState<SyncConfig | null>(null);

  async function finish(config: SyncConfig, mode: 'merge' | 'replace') {
    setBusy(true);
    try {
      await connectSync(config, mode);
      toast('Sync is on');
    } catch (e) {
      toast(`Connected, but the first sync failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      onDone();
    }
  }

  async function submit() {
    const parsed = parseRepo(repo);
    if (!parsed) return setError('Enter the repository as owner/name, for example yourname/chalk-data.');
    if (!token.trim()) return setError('Paste the access token.');
    const config = { ...parsed, token: token.trim() };
    setBusy(true);
    setError('');
    try {
      const info = await checkRepo(config);
      if (!info.isPrivate) {
        setError(`${info.fullName} is public, so anyone could read your workouts. Make it private in its GitHub settings, then try again.`);
        return;
      }
      if (info.hasData && (await hasLocalData())) {
        setChoice(config);
        return;
      }
      await finish(config, 'merge');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (choice) {
    return (
      <div className="sync-choice">
        <p>
          This device and <strong>{choice.owner}/{choice.repo}</strong> both have Chalk data already. What should happen?
        </p>
        <button className="choice-card" disabled={busy} onClick={() => finish(choice, 'replace')}>
          <strong>Use the cloud data on this device</strong>
          <span>Best when adding a phone or computer. This device’s workouts, routines and exercises are replaced by the cloud copy.</span>
        </button>
        <button className="choice-card" disabled={busy} onClick={() => finish(choice, 'merge')}>
          <strong>Merge both</strong>
          <span>Keeps everything from both sides. Workouts that exist on both, like a Hevy history imported twice, are kept once.</span>
        </button>
      </div>
    );
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <ol className="setup-steps">
        <li>
          <strong>Create a private repository</strong> to hold your data.{' '}
          <a href="https://github.com/new?name=chalk-data&visibility=private" target="_blank" rel="noreferrer">
            Create it on GitHub
          </a>
        </li>
        <li>
          <strong>Create an access token</strong> that can only reach that repository.{' '}
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
            Create a token
          </a>
          . Under <em>Repository access</em> choose <em>Only select repositories</em> and pick it. Under <em>Permissions</em>, set{' '}
          <em>Contents</em> to <em>Read and write</em>.
        </li>
        <li>
          <strong>Paste both here</strong>, and do the same on every device you use.
        </li>
      </ol>
      <label className="field">
        <span>Repository</span>
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="yourname/chalk-data"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
      <label className="field">
        <span>Access token</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="github_pat_…"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <p className="muted small">The token is stored on this device and only ever sent to GitHub.</p>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Connecting…' : 'Connect'}
        </button>
      </div>
    </form>
  );
}
