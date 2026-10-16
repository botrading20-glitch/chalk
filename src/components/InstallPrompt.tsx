import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { getKV, setKV } from '../db';
import { useData } from '../lib/data';
import { installPlatform, promptInstall, useInstall } from '../lib/install';
import { toast } from './dialogs';
import { IconClose, IconMoreVertical, IconShare } from './Icons';
import { Sheet } from './Sheet';
import { count, t } from '../i18n';
import { tRich } from '../i18n/rich';

const bold = (text: string) => <strong>{text}</strong>;

// A dismissal is per device, so it lives in kv next to other local-only state
// rather than in the synced settings.
const DISMISSED = 'installDismissed';

/** Whether there's anything to offer: not already installed, and a phone or a browser with its own install dialog. */
function useInstallOffer() {
  const { installed, canPrompt } = useInstall();
  return !installed && (installPlatform !== 'other' || canPrompt);
}

/** Smart-app-style banner for the Workout screen when Setward is open in a browser tab. */
export function InstallBanner() {
  const offer = useInstallOffer();
  const dismissed = useLiveQuery(async () => (await getKV<boolean>(DISMISSED)) ?? false, []);
  if (!offer || dismissed !== false) return null;

  return (
    <section className="card install-card" aria-label={t('install.title')}>
      <img className="install-icon" src={`${import.meta.env.BASE_URL}icon-192.png`} width={44} height={44} alt="" />
      <div className="install-text">
        <strong>{t('install.title')}</strong>
        <span>{t('install.text')}</span>
      </div>
      <InstallButton className="btn btn-accent-outline btn-small" />
      <button
        className="icon-btn small"
        aria-label={t('install.dismiss')}
        onClick={() => {
          void setKV(DISMISSED, true);
          toast(t('install.later'));
        }}
      >
        <IconClose size={18} />
      </button>
    </section>
  );
}

/** Settings entry, kept after the banner is dismissed. */
export function InstallSettings() {
  const offer = useInstallOffer();
  if (!offer) return null;
  return (
    <section className="card settings-group">
      <h2 className="card-title">{t('install.settingsTitle')}</h2>
      <p className="muted small">{t('install.settingsText')}</p>
      <InstallButton className="btn btn-secondary btn-block" />
    </section>
  );
}

/** Opens the browser's install dialog when it offers one, otherwise the how-to sheet. */
function InstallButton({ className }: { className: string }) {
  const { canPrompt } = useInstall();
  const [howTo, setHowTo] = useState(false);

  return (
    <>
      <button
        className={className}
        onClick={async () => {
          if (!canPrompt) return setHowTo(true);
          if (await promptInstall()) toast(t('install.started'));
        }}
      >
        {t('install.button')}
      </button>
      <InstallSheet open={howTo} onClose={() => setHowTo(false)} />
    </>
  );
}

function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { workouts } = useData();

  return (
    <Sheet open={open} onClose={onClose} title={t('install.title')}>
      <div className="install-how">
        {installPlatform === 'ios' ? (
          <>
            <ol className="setup-steps">
              <li>{tRich('install.ios1', { icon: <IconShare size={18} className="inline-icon" />, b: bold })}</li>
              <li>{tRich('install.ios2', { b: bold })}</li>
              <li>{t('install.ios3')}</li>
            </ol>
            <p className="muted small">{t('install.iosMissing')}</p>
            {workouts.length > 0 && (
              <p className="install-note">
                {t('install.iosData', { workouts: count('workout', workouts.length) })}
              </p>
            )}
          </>
        ) : installPlatform === 'android' ? (
          <ol className="setup-steps">
            <li>{tRich('install.and1', { icon: <IconMoreVertical size={18} className="inline-icon" /> })}</li>
            <li>{tRich('install.and2', { b: bold })}</li>
            <li>{t('install.and3')}</li>
          </ol>
        ) : (
          <p className="muted">{t('install.other')}</p>
        )}
        <button className="btn btn-secondary btn-block" onClick={onClose}>
          {t('install.gotIt')}
        </button>
      </div>
    </Sheet>
  );
}
