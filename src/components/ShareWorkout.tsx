import { useEffect, useState } from 'react';
import { downloadFile } from '../lib/csv';
import { useData } from '../lib/data';
import { fmtDateLong, fmtDuration, fmtTime, fmtVolume } from '../lib/format';
import { fmtSet } from '../lib/sets';
import { useSettings } from '../lib/settings';
import { renderWorkoutCard, type CardData } from '../lib/shareCard';
import { bestSet, workoutSets, workoutVolume } from '../lib/stats';
import type { Workout } from '../types';
import { toast } from './dialogs';
import { IconDownload, IconShare } from './Icons';
import { Sheet } from './Sheet';

const cardDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function useCardData(w: Workout): CardData {
  const { exerciseMap, typeOf, records } = useData();
  const settings = useSettings();
  return {
    title: w.title,
    date: cardDate.format(w.startTime),
    when: `${fmtDateLong(w.startTime).replace(/ \d{4}$/, '')} · ${fmtTime(w.startTime)}–${fmtTime(w.endTime)}`,
    stats: [
      { label: 'Time', value: fmtDuration((w.endTime - w.startTime) / 1000) },
      { label: 'Volume', value: fmtVolume(workoutVolume(w, typeOf), settings.weightUnit) },
      { label: 'Sets', value: String(workoutSets(w)) },
    ],
    records: records.byWorkout.get(w.id) ?? 0,
    exercises: w.exercises.map((we) => {
      const type = typeOf(we.exerciseId);
      const best = bestSet(we.sets, type);
      return {
        name: exerciseMap.get(we.exerciseId)?.name ?? 'Deleted exercise',
        sets: we.sets.length,
        best: best ? fmtSet(best, type, settings) : '',
        record: we.sets.some((s) => (records.bySet.get(s.id)?.length ?? 0) > 0),
      };
    }),
  };
}

/** Preview of the summary image, to save or hand to the share sheet. */
export function ShareWorkoutSheet({ workout, open, onClose }: { workout: Workout; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Share workout">
      {open && <SharePreview workout={workout} />}
    </Sheet>
  );
}

function SharePreview({ workout }: { workout: Workout }) {
  const data = useCardData(workout);
  const key = JSON.stringify(data);
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let url = '';
    let cancelled = false;
    renderWorkoutCard(data)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ blob, url });
      })
      .catch((e) => setError((e as Error).message));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // Redraw only when the card's content changes.
  }, [key]);

  const name = `chalk-${workout.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workout'}.png`;
  const file = image && new File([image.blob], name, { type: 'image/png' });
  const canShare = !!file && !!navigator.canShare?.({ files: [file] });

  return (
    <div className="share-preview">
      {error ? (
        <p className="form-error">{error}</p>
      ) : image ? (
        <img src={image.url} alt={`Summary image of ${workout.title}`} width={1080} height={1350} />
      ) : (
        <div className="share-placeholder" aria-busy="true" />
      )}
      <div className="button-pair">
        <button className="btn btn-ghost" disabled={!file} onClick={() => file && downloadFile(file)}>
          <IconDownload size={18} /> Save image
        </button>
        <button
          className="btn btn-primary"
          disabled={!canShare}
          onClick={async () => {
            try {
              await navigator.share({ files: [file!], title: workout.title });
            } catch (e) {
              if ((e as DOMException).name !== 'AbortError') toast('Sharing didn’t work here. Save the image instead.');
            }
          }}
        >
          <IconShare size={18} /> Share
        </button>
      </div>
    </div>
  );
}
