import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { isolate } from '../lib/format';
import { attachVideo, getVideo, removeVideo, videoFile, type VideoTarget } from '../lib/media';
import { confirmDialog, toast } from './dialogs';
import { IconShare, IconTrash, IconVideo } from './Icons';
import { Sheet } from './Sheet';
import { t } from '../i18n';

/**
 * The video part of a set's menu: add one (the phone's camera, or a file), or watch and remove the
 * one it has. `canAdd` follows the setting; a set that already has a video can always be watched.
 */
export function VideoSection({
  target,
  has,
  canAdd,
  onWatch,
  onDone,
}: {
  target: VideoTarget;
  has: boolean;
  canAdd: boolean;
  onWatch: () => void;
  /** Closes the set menu. */
  onDone: () => void;
}) {
  const recordInput = useRef<HTMLInputElement>(null);
  const chooseInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  if (!has && !canAdd) return null;

  async function add(file: File | undefined) {
    if (!file) return;
    setSaving(true);
    toast(t('video.saving'));
    try {
      await attachVideo(file, target);
      toast(t('video.added'));
      onDone();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    onDone();
    const ok = await confirmDialog({ title: t('video.removeTitle'), message: t('video.removeText'), confirmLabel: t('video.remove'), danger: true });
    if (!ok) return;
    const record = await getVideo(target.setId);
    if (record) await removeVideo(record.id);
    toast(t('video.removed'));
  }

  const picked = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    void add(file);
  };

  return (
    <>
      <h3 className="list-label">{t('video.section')}</h3>
      {has ? (
        <div className="video-actions">
          <button className="btn btn-secondary" onClick={onWatch}>
            <IconVideo size={18} /> {t('video.watch')}
          </button>
          <button className="btn btn-danger-ghost" onClick={() => void remove()}>
            <IconTrash size={18} /> {t('video.remove')}
          </button>
        </div>
      ) : (
        <div className="video-actions">
          <button className="btn btn-secondary" disabled={saving} onClick={() => recordInput.current?.click()}>
            <IconVideo size={18} /> {t('video.record')}
          </button>
          <button className="btn btn-ghost" disabled={saving} onClick={() => chooseInput.current?.click()}>
            {t('video.choose')}
          </button>
          <input ref={recordInput} type="file" accept="video/*" capture="environment" hidden onChange={picked} />
          <input ref={chooseInput} type="file" accept="video/*" hidden onChange={picked} />
        </div>
      )}
    </>
  );
}

const SPEEDS = [0.25, 0.5, 1];

/** Plays the video of a set: muted to start, at a speed you pick, shareable and removable. */
export function VideoSheet({ setId, onClose }: { setId: string | null; onClose: () => void }) {
  const record = useLiveQuery(async () => (setId ? await getVideo(setId) : undefined), [setId]);
  const [url, setUrl] = useState<string>();
  const [rate, setRate] = useState(1);
  const player = useRef<HTMLVideoElement>(null);
  const recordId = record?.id;

  // One object URL per video, released when the sheet closes or the video changes.
  useEffect(() => {
    if (!record) {
      setUrl(undefined);
      return;
    }
    const made = URL.createObjectURL(record.blob);
    setUrl(made);
    return () => URL.revokeObjectURL(made);
  }, [recordId]);

  useEffect(() => {
    if (player.current) player.current.playbackRate = rate;
  }, [rate, url]);

  const file = record && videoFile(record);
  const canShare = !!file && typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [file] });

  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: t('video.title') });
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') toast(t('video.errFailed', { message: (e as Error).message }));
    }
  }

  async function remove() {
    if (!record) return;
    onClose();
    const ok = await confirmDialog({ title: t('video.removeTitle'), message: t('video.removeText'), confirmLabel: t('video.remove'), danger: true });
    if (!ok) return;
    await removeVideo(record.id);
    toast(t('video.removed'));
  }

  return (
    <Sheet open={!!setId} onClose={onClose} title={t('video.title')}>
      {url && (
        <div className="video-sheet">
          <video
            ref={player}
            className="video-player"
            src={url}
            controls
            playsInline
            muted
            preload="metadata"
            aria-label={t('video.title')}
            onLoadedMetadata={(e) => {
              e.currentTarget.playbackRate = rate;
            }}
          />
          <div className="chips" role="group" aria-label={t('video.speed')}>
            {SPEEDS.map((s) => (
              <button key={s} className={`chip ${rate === s ? 'on' : ''}`} aria-pressed={rate === s} onClick={() => setRate(s)}>
                {isolate(`${s}×`)}
              </button>
            ))}
          </div>
          <div className="video-actions">
            {canShare && (
              <button className="btn btn-secondary" onClick={() => void share()}>
                <IconShare size={18} /> {t('video.share')}
              </button>
            )}
            <button className="btn btn-danger-ghost" onClick={() => void remove()}>
              <IconTrash size={18} /> {t('video.remove')}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
