import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { getKV, setKV } from '../db';
import { useData } from '../lib/data';
import { plural } from '../lib/format';
import { installPlatform, promptInstall, useInstall } from '../lib/install';
import { toast } from './dialogs';
import { IconClose, IconMoreVertical, IconShare } from './Icons';
import { Sheet } from './Sheet';

// A dismissal is per device, so it lives in kv next to other local-only state
// rather than in the synced settings.
const DISMISSED = 'installDismissed';

/** Whether there's anything to offer: not already installed, and a phone or a browser with its own install dialog. */
function useInstallOffer() {
  const { installed, canPrompt } = useInstall();
  return !installed && (installPlatform !== 'other' || canPrompt);
}

/** Smart-app-style banner for the Workout screen when Chalk is open in a browser tab. */
export function InstallBanner() {
  const offer = useInstallOffer();
  const dismissed = useLiveQuery(async () => (await getKV<boolean>(DISMISSED)) ?? false, []);
  if (!offer || dismissed !== false) return null;

  return (
    <section className="card install-card" aria-label="Install Chalk">
      <img className="install-icon" src={`${import.meta.env.BASE_URL}icon-192.png`} width={44} height={44} alt="" />
      <div className="install-text">
        <strong>Install Chalk</strong>
        <span>Opens from your home screen, full-screen and offline.</span>
      </div>
      <InstallButton className="btn btn-accent-outline btn-small" />
      <button
        className="icon-btn small"
        aria-label="Dismiss"
        onClick={() => {
          void setKV(DISMISSED, true);
          toast('You can install Chalk later from Settings');
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
      <h2 className="card-title">Install app</h2>
      <p className="muted small">Add Chalk to your home screen. It gets its own icon, opens full-screen and works without a connection.</p>
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
          if (await promptInstall()) toast('Installing — open Chalk from your home screen');
        }}
      >
        Install
      </button>
      <InstallSheet open={howTo} onClose={() => setHowTo(false)} />
    </>
  );
}

function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { workouts } = useData();

  return (
    <Sheet open={open} onClose={onClose} title="Install Chalk">
      <div className="install-how">
        {installPlatform === 'ios' ? (
          <>
            <ol className="setup-steps">
              <li>
                Tap <IconShare size={18} className="inline-icon" /> <strong>Share</strong> in Safari’s toolbar.
              </li>
              <li>
                Scroll down, tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
              </li>
              <li>Open Chalk from its new icon on your home screen.</li>
            </ol>
            <p className="muted small">Not in the list? Open this page in Safari and try again.</p>
            {workouts.length > 0 && (
              <p className="install-note">
                The installed app keeps its own data, separate from Safari. Your {plural(workouts.length, 'workout')} here won’t move
                over by themselves: set up cloud sync or back up your data first, then sync or restore inside the app.
              </p>
            )}
          </>
        ) : installPlatform === 'android' ? (
          <ol className="setup-steps">
            <li>
              Tap the <IconMoreVertical size={18} className="inline-icon" /> menu in the top corner of your browser.
            </li>
            <li>
              Tap <strong>Install app</strong> (some phones say <strong>Add to Home screen</strong>), then confirm.
            </li>
            <li>Open Chalk from its new icon on your home screen. Everything you’ve logged here comes along.</li>
          </ol>
        ) : (
          <p className="muted">
            Open this page on your phone to add it to your home screen. On a computer, look for an install icon in the address bar or an
            “Install” item in the browser menu.
          </p>
        )}
        <button className="btn btn-secondary btn-block" onClick={onClose}>
          Got it
        </button>
      </div>
    </Sheet>
  );
}
