import { useState } from 'react';
import { IMAGE_BASE } from '../lib/meta';
import type { Exercise } from '../types';
import { IconPause, IconPlay } from './Icons';
import { t } from '../i18n';

/**
 * Loops an exercise's start and end photos (public-domain free-exercise-db
 * shots) so the movement reads like a short clip. Reduced-motion settings
 * leave it on the start position.
 */
export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [start, end] = exercise.images;
  if (!start || failed) return null;

  return (
    <figure className={`demo ${paused ? 'paused' : ''}`}>
      <img src={IMAGE_BASE + start} alt={t('demo.alt', { name: exercise.name })} onError={() => setFailed(true)} />
      {end && <img className="demo-end" src={IMAGE_BASE + end} alt="" />}
      {end && (
        <button className="demo-toggle" onClick={() => setPaused((p) => !p)} aria-label={paused ? t('demo.play') : t('demo.pause')}>
          {paused ? <IconPlay size={16} /> : <IconPause size={16} />}
        </button>
      )}
    </figure>
  );
}
