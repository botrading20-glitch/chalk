import { useState } from 'react';
import { useNow } from '../lib/data';
import { fmtAgo } from '../lib/format';
import { checkRepo, connectSync, disconnectSync, hasLocalData, syncNow, useSyncStatus, type SyncConfig } from '../lib/sync';
import { confirmDialog, toast } from './dialogs';
import { IconCloud } from './Icons';
import { Sheet } from './Sheet';
import { t } from '../i18n';
import { tRich } from '../i18n/rich';

export function SyncSettings() {
  const status = useSyncStatus();
  const now = useNow(30_000);
  const [setup, setSetup] = useState(false);
  const on = status.phase !== 'off';

  return (
    <section className="card settings-group">
      <div className="sync-head">
        <h2 className="card-title">{t('sync.title')}</h2>
        {on && <span className={`sync-pill ${status.phase}`}>{status.phase === 'error' ? t('sync.pillAttention') : t('sync.pillOn')}</span>}
      </div>

      {!on ? (
        <>
          <p className="muted small">{t('sync.intro')}</p>
          <button className="btn btn-secondary btn-block" onClick={() => setSetup(true)}>
            <IconCloud size={18} /> {t('sync.setUp')}
          </button>
        </>
      ) : (
        <>
          <a className="sync-repo" href={`https://github.com/${status.repo}/commits`} target="_blank" rel="noreferrer">
            {status.repo}
          </a>
          <p className={`small ${status.phase === 'error' ? 'form-error' : 'muted'}`} role="status">
            {status.phase === 'syncing'
              ? t('sync.syncing')
              : status.phase === 'error'
                ? status.message
                : status.lastSyncAt
                  ? t('sync.lastSynced', { when: fmtAgo(status.lastSyncAt, now) })
                  : t('sync.waiting')}
          </p>
          <div className="button-pair">
            <button
              className="btn btn-secondary"
              disabled={status.phase === 'syncing'}
              onClick={() => syncNow().catch(() => toast(t('sync.failed')))}
            >
              {t('sync.now')}
            </button>
            <button className="btn btn-ghost" onClick={() => setSetup(true)}>
              {t('sync.changeToken')}
            </button>
          </div>
          <button
            className="btn btn-danger-ghost btn-block"
            onClick={async () => {
              const ok = await confirmDialog({
                title: t('sync.turnOffTitle'),
                message: t('sync.turnOffText'),
                confirmLabel: t('sync.turnOffConfirm'),
              });
              if (ok) await disconnectSync();
            }}
          >
            {t('sync.turnOff')}
          </button>
        </>
      )}

      <Sheet open={setup} onClose={() => setSetup(false)} title={t('sync.setupTitle')}>
        <SyncSetup initialRepo={status.repo} onDone={() => setSetup(false)} />
      </Sheet>
    </section>
  );
}

const bold = (text: string) => <strong>{text}</strong>;
const repoLink = (text: string, href: string) => (
  <a href={href} target="_blank" rel="noreferrer">
    {text}
  </a>
);

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
      toast(t('sync.on'));
    } catch (e) {
      toast(t('sync.firstFailed', { message: (e as Error).message }));
    } finally {
      setBusy(false);
      onDone();
    }
  }

  async function submit() {
    const parsed = parseRepo(repo);
    if (!parsed) return setError(t('sync.repoFormat'));
    if (!token.trim()) return setError(t('sync.tokenRequired'));
    const config = { ...parsed, token: token.trim() };
    setBusy(true);
    setError('');
    try {
      const info = await checkRepo(config);
      if (!info.isPrivate) {
        setError(t('sync.public', { name: info.fullName }));
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
        <p>{tRich('sync.choice', { b: bold }, { repo: `${choice.owner}/${choice.repo}` })}</p>
        <button className="choice-card" disabled={busy} onClick={() => finish(choice, 'replace')}>
          <strong>{t('sync.useCloud')}</strong>
          <span>{t('sync.useCloudText')}</span>
        </button>
        <button className="choice-card" disabled={busy} onClick={() => finish(choice, 'merge')}>
          <strong>{t('sync.mergeBoth')}</strong>
          <span>{t('sync.mergeText')}</span>
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
        <li>{tRich('sync.step1', { b: bold, link: (text) => repoLink(text, 'https://github.com/new?name=setward-data&visibility=private') })}</li>
        <li>
          {tRich('sync.step2', {
            b: bold,
            em: (text) => <em>{text}</em>,
            link: (text) => repoLink(text, 'https://github.com/settings/personal-access-tokens/new'),
          })}
        </li>
        <li>{tRich('sync.step3', { b: bold })}</li>
      </ol>
      <label className="field">
        <span>{t('sync.repository')}</span>
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder={t('sync.repoPlaceholder')}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
      <label className="field">
        <span>{t('sync.accessToken')}</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="github_pat_…"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <p className="muted small">{t('sync.tokenNote')}</p>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t('sync.connecting') : t('sync.connect')}
        </button>
      </div>
    </form>
  );
}
