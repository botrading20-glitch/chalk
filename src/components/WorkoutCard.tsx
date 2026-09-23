import { useData } from '../lib/data';
import { fmtDate, fmtDuration, fmtTime, fmtVolume } from '../lib/format';
import { Link } from '../lib/router';
import { fmtSet } from '../lib/sets';
import { useSettings } from '../lib/settings';
import { bestSet, workoutVolume } from '../lib/stats';
import type { Workout } from '../types';
import { IconTrophy } from './Icons';

export function WorkoutCard({ workout }: { workout: Workout }) {
  const { exerciseMap, typeOf, records } = useData();
  const settings = useSettings();
  const prs = records.byWorkout.get(workout.id) ?? 0;
  const shown = workout.exercises.slice(0, 5);

  return (
    <Link to={`/history/${workout.id}`} className="card workout-card">
      <header className="workout-card-head">
        <h3>{workout.title}</h3>
        <span className="muted">
          {fmtDate(workout.startTime)} · {fmtTime(workout.startTime)}
        </span>
      </header>
      <div className="workout-card-stats">
        <span>{fmtDuration((workout.endTime - workout.startTime) / 1000)}</span>
        <span>{fmtVolume(workoutVolume(workout, typeOf), settings.weightUnit)}</span>
        {prs > 0 && (
          <span className="pr-pill">
            <IconTrophy size={14} /> {prs} {prs === 1 ? 'record' : 'records'}
          </span>
        )}
      </div>
      <ul className="workout-card-lines">
        {shown.map((we) => {
          const type = typeOf(we.exerciseId);
          const best = bestSet(we.sets, type);
          return (
            <li key={we.id}>
              <span className="line-sets tabular">{we.sets.length} ×</span>
              <span className="line-name">{exerciseMap.get(we.exerciseId)?.name ?? 'Deleted exercise'}</span>
              <span className="line-best tabular">{best ? fmtSet(best, type, settings) : ''}</span>
            </li>
          );
        })}
      </ul>
      {workout.exercises.length > shown.length && (
        <p className="muted small">+{workout.exercises.length - shown.length} more exercises</p>
      )}
    </Link>
  );
}
