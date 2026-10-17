import { useData } from '../lib/data';
import { fmtRelativeDay } from '../lib/format';
import { recordFormat } from '../lib/recordFormat';
import type { RecentRecord } from '../lib/records';
import { Link } from '../lib/router';
import { useSettings } from '../lib/settings';
import { RECORD_LABEL } from '../lib/stats';
import { t } from '../i18n';
import { IconTrophy } from './Icons';
import { ExerciseAvatar } from './ui';

/** Records as rows, each linking to the workout that set it (Progress and the monthly report). */
export function RecordList({ list }: { list: RecentRecord[] }) {
  const { exerciseMap } = useData();
  const settings = useSettings();
  return (
    <ul className="top-list">
      {list.map((r) => {
        const exercise = exerciseMap.get(r.exerciseId);
        return (
          <li key={`${r.workoutId}:${r.exerciseId}`}>
            <Link to={`/history/${r.workoutId}`} className="rec-row">
              <ExerciseAvatar exercise={exercise} size={36} />
              <span className="rec-text">
                <span className="rec-head">
                  <span className="ex-row-name">{exercise?.name ?? t('exercise.deleted')}</span>
                  <span className="muted small">{fmtRelativeDay(r.time)}</span>
                </span>
                <span className="rec-items">
                  <span className="pr-pill">
                    <IconTrophy size={13} /> {RECORD_LABEL[r.items[0].kind]} {recordFormat(r.items[0].kind, r.items[0].value, settings)}
                  </span>
                  {r.items.length > 1 && <span className="muted small">{t('progress.recentExtra', { n: r.items.length - 1 })}</span>}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
