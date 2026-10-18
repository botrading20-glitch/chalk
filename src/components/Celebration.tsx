import { useEffect, useState, type CSSProperties } from 'react';
import { count, t } from '../i18n';
import { motionOff } from '../lib/motion';
import { IconShare } from './Icons';

/** Fourteen slanted shards, one burst: angle (deg), travel (px) and delay (ms). */
const SHARDS = Array.from({ length: 14 }, (_, i) => ({
  angle: i * (360 / 14) + (i % 2 ? 6 : -4),
  distance: 78 + ((i * 37) % 7) * 12,
  delay: (i % 4) * 45,
  long: i % 3 === 0,
}));

/** Counts 0 → target once, easing out; jumps straight to the target when motion is off. */
function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(() => (target > 0 && !motionOff() ? 0 : target));
  useEffect(() => {
    if (target <= 0 || motionOff()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return value;
}

/** The moment after saving a workout: the biggest type in the app, and a burst when there are records. */
export function SavedCelebration({ number, records, onShare }: { number: number; records: number; onShare: () => void }) {
  const shown = useCountUp(records);

  return (
    <div className={`celebration ${records ? 'has-records' : ''}`}>
      {records > 0 && (
        <div className="burst" aria-hidden="true">
          {SHARDS.map((s, i) => (
            <i
              key={i}
              className={s.long ? 'long' : ''}
              style={{ '--a': `${s.angle}deg`, '--d': `${s.distance}px`, '--w': `${s.delay}ms` } as CSSProperties}
            />
          ))}
        </div>
      )}
      <span className="eyebrow">{t('detail.saved', { n: number })}</span>
      <p className="sr-only" role="status">
        {records ? count('newRecord', records) : t('detail.logged')}
      </p>
      {records > 0 ? (
        <div className="celebration-hero" aria-hidden="true">
          <span className="celebration-num">{shown}</span>
          <span className="celebration-label">{t('celebrate.records', { n: records })}</span>
        </div>
      ) : (
        <strong className="celebration-hero celebration-logged" aria-hidden="true">
          {t('detail.logged')}
        </strong>
      )}
      {records > 0 && <span className="celebration-note">{t('detail.trophy')}</span>}
      <button className="btn btn-small celebration-share" onClick={onShare}>
        <IconShare size={16} /> {t('detail.share')}
      </button>
    </div>
  );
}
