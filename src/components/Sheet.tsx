import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './Icons';

/** Bottom sheet on phones, centred panel on wide screens. Built on <dialog> for focus trapping and Esc. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  full = false,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  full?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`sheet ${full ? 'sheet-full' : ''} ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="sheet-body">
          {title !== undefined && (
            <div className="sheet-head">
              <h2>{title}</h2>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <IconClose />
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}

export interface Action {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  hidden?: boolean;
  onSelect: () => void;
}

export function ActionSheet({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: Action[];
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="action-list">
        {actions
          .filter((a) => !a.hidden)
          .map((a) => (
            <button
              key={a.label}
              className={`action-item ${a.danger ? 'danger' : ''}`}
              onClick={() => {
                onClose();
                a.onSelect();
              }}
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
      </div>
    </Sheet>
  );
}
