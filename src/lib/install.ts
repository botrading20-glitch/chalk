import { useSyncExternalStore } from 'react';

// "Add to home screen" support. Chrome and Edge fire beforeinstallprompt once the
// page qualifies as installable; holding on to it lets our own button open the
// browser's install dialog. Safari and Firefox have no such event, so those get
// written instructions instead. The listeners attach when this module is first
// evaluated, which happens at startup through the static import chain from App.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallPlatform = 'ios' | 'android' | 'other';

export const installPlatform: InstallPlatform = (() => {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; the touch screen gives it away.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
})();

function runningInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

interface InstallState {
  installed: boolean;
  /** The browser handed us its install dialog to open. */
  canPrompt: boolean;
}

let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = { installed: runningInstalled(), canPrompt: false };
const listeners = new Set<() => void>();
function setState(patch: Partial<InstallState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

window.addEventListener('beforeinstallprompt', (e) => {
  // Stops Chrome's own mini-infobar; the banner offers the same dialog.
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  setState({ canPrompt: true });
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  setState({ installed: true, canPrompt: false });
});

export function useInstall() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

/** Opens the browser's install dialog. Resolves to whether the user accepted. */
export async function promptInstall() {
  const e = deferred;
  if (!e) return false;
  // Each event can prompt only once; Chrome sends a fresh one on a later visit.
  deferred = null;
  setState({ canPrompt: false });
  await e.prompt();
  return (await e.userChoice).outcome === 'accepted';
}
