import { confirmDialog } from './dialogs';
import { t } from '../i18n';
import { tRich } from '../i18n/rich';

/** Asks before throwing away unsaved editor changes; resolves true when it's fine to drop them. */
export function confirmDiscard(dirty: boolean) {
  if (!dirty) return Promise.resolve(true);
  return confirmDialog({
    title: t('draft.discardTitle'),
    message: t('draft.discardMessage'),
    confirmLabel: t('draft.discardConfirm'),
    cancelLabel: t('draft.keepEditing'),
    danger: true,
  });
}

/** Shown when an editor opens with changes kept from an earlier visit. */
export function DraftBar({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="draft-bar" role="status">
      <span>{tRich('draft.bar', { b: (text) => <strong>{text}</strong> })}</span>
      <button
        className="btn btn-ghost btn-small"
        onClick={async () => {
          if (await confirmDiscard(true)) onDiscard();
        }}
      >
        {t('common.discard')}
      </button>
    </div>
  );
}
