import { confirmDialog } from './dialogs';

/** Asks before throwing away unsaved editor changes; resolves true when it's fine to drop them. */
export function confirmDiscard(dirty: boolean) {
  if (!dirty) return Promise.resolve(true);
  return confirmDialog({
    title: 'Discard your changes?',
    message: 'They haven’t been saved.',
    confirmLabel: 'Discard changes',
    cancelLabel: 'Keep editing',
    danger: true,
  });
}

/** Shown when an editor opens with changes kept from an earlier visit. */
export function DraftBar({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="draft-bar" role="status">
      <span>
        <strong>Unsaved changes</strong> kept from when you left. Save to keep them.
      </span>
      <button
        className="btn btn-ghost btn-small"
        onClick={async () => {
          if (await confirmDiscard(true)) onDiscard();
        }}
      >
        Discard
      </button>
    </div>
  );
}
