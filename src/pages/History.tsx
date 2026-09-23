import { useMemo, useState } from 'react';
import { Empty, PageHeader } from '../components/ui';
import { WorkoutCard } from '../components/WorkoutCard';
import { useData } from '../lib/data';
import { fmtMonth, plural } from '../lib/format';
import { Link } from '../lib/router';
import { beginWorkout } from './WorkoutHome';

const PAGE_MONTHS = 4;

export function History() {
  const { workouts } = useData();
  const [months, setMonths] = useState(PAGE_MONTHS);

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: typeof workouts }[] = [];
    for (const w of workouts) {
      const d = new Date(w.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let g = out.at(-1);
      if (!g || g.key !== key) {
        g = { key, label: fmtMonth(w.startTime), items: [] };
        out.push(g);
      }
      g.items.push(w);
    }
    return out;
  }, [workouts]);

  return (
    <div className="page">
      <PageHeader large title="History" />
      {workouts.length === 0 && (
        <Empty
          title="No workouts yet"
          action={
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => beginWorkout()}>
                Start a workout
              </button>
              <Link to="/settings" className="btn btn-ghost">
                Import from Hevy
              </Link>
            </div>
          }
        >
          Finished workouts land here, newest first.
        </Empty>
      )}
      {groups.slice(0, months).map((g) => (
        <section key={g.key} className="month">
          <h2 className="month-label">
            {g.label}
            <span>{plural(g.items.length, 'workout')}</span>
          </h2>
          <div className="stack">
            {g.items.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        </section>
      ))}
      {groups.length > months && (
        <button className="btn btn-ghost btn-block" onClick={() => setMonths((m) => m + PAGE_MONTHS)}>
          Show earlier months
        </button>
      )}
    </div>
  );
}
