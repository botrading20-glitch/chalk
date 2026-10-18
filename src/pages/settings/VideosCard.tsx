import { confirmDialog, toast } from '../../components/dialogs';
import { Stat } from '../../components/ui';
import { fmtNum } from '../../lib/format';
import { fmtSize, removeAllVideos, removeOrphanVideos, useVideoUsage } from '../../lib/media';
import { t } from '../../i18n';
import { Card, Note } from './controls';

/** Settings → Your data → set videos: how many there are, the room they take, and ways to clear them. */
export function VideosCard() {
  const usage = useVideoUsage();
  if (!usage) return null;

  return (
    <Card title={t('video.dataTitle')}>
      {usage.count === 0 ? (
        <Note>{t('video.dataNone')}</Note>
      ) : (
        <>
          <div className="stat-row">
            <Stat label={t('video.dataCount')} value={fmtNum(usage.count, 0)} />
            <Stat label={t('video.dataSize')} value={fmtSize(usage.bytes)} />
          </div>
          {usage.orphans > 0 && (
            <>
              <Note>{t('video.dataUnlinked', { n: usage.orphans })}</Note>
              <button
                className="btn btn-ghost btn-block"
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: t('video.removeUnlinked'),
                    message: t('video.removeUnlinkedText'),
                    confirmLabel: t('video.removeUnlinked'),
                    danger: true,
                  });
                  if (!ok) return;
                  await removeOrphanVideos();
                  toast(t('video.removedMany'));
                }}
              >
                {t('video.removeUnlinked')}
              </button>
            </>
          )}
          <button
            className="btn btn-danger-ghost btn-block"
            onClick={async () => {
              const ok = await confirmDialog({
                title: t('video.removeAllTitle'),
                message: t('video.removeAllText'),
                confirmLabel: t('video.removeAll'),
                danger: true,
              });
              if (!ok) return;
              await removeAllVideos();
              toast(t('video.removedMany'));
            }}
          >
            {t('video.removeAll')}
          </button>
        </>
      )}
      <Note>{t('video.dataNote')}</Note>
    </Card>
  );
}
