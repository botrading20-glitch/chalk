import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Sheet } from './Sheet';

// Imperative confirm() and toast() so any handler can await a decision.

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface Toast {
  id: number;
  message: string;
}

let pending: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null = null;
let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function confirmDialog(opts: ConfirmOptions) {
  pending?.resolve(false);
  return new Promise<boolean>((resolve) => {
    pending = { ...opts, resolve };
    emit();
  });
}

let nextToast = 1;
export function toast(message: string) {
  const id = nextToast++;
  toasts = [...toasts, { id, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

export function DialogHost() {
  const confirm = useSyncExternalStore(subscribe, () => pending);
  const list = useSyncExternalStore(subscribe, () => toasts);
  const toastLayer = useRef<HTMLDivElement>(null);

  // Toasts live in the top layer so they show above an open sheet. Re-showing
  // the popover moves it above whichever dialog opened most recently.
  useEffect(() => {
    const el = toastLayer.current;
    if (!el || typeof el.showPopover !== 'function') return;
    try {
      if (el.matches(':popover-open')) el.hidePopover();
      if (list.length) el.showPopover();
    } catch {
      // Popover API unavailable: the layer stays a plain fixed element.
    }
  }, [list]);

  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    pending = null;
    emit();
  };

  return (
    <>
      <Sheet open={!!confirm} onClose={() => settle(false)} className="confirm">
        {confirm && (
          <div className="confirm-body">
            <h2>{confirm.title}</h2>
            {confirm.message && <p className="muted">{confirm.message}</p>}
            <div className="confirm-actions">
              <button className={`btn ${confirm.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => settle(true)}>
                {confirm.confirmLabel}
              </button>
              <button className="btn btn-ghost" onClick={() => settle(false)}>
                {confirm.cancelLabel ?? 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </Sheet>
      <div ref={toastLayer} popover="manual" className="toasts" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
