import { useMemo, useState } from 'react';
import { Empty, PageHeader } from '../components/ui';
import { WorkoutCard } from '../components/WorkoutCard';
import { useData } from '../lib/data';
import { fmtMonth } from '../lib/format';
import { Link } from '../lib/router';
import { beginWorkout } from './WorkoutHome';
import { count, t } from '../i18n';

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
      <PageHeader large title={t('tab.history')} />
      {workouts.length === 0 && (
        <Empty
          title={t('history.empty')}
          action={
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => beginWorkout()}>
                {t('history.start')}
              </button>
              <Link to="/settings" className="btn btn-ghost">
                {t('import.workouts')}
              </Link>
            </div>
          }
        >
          {t('history.emptyText')}
        </Empty>
      )}
      {groups.slice(0, months).map((g) => (
        <section key={g.key} className="month">
          <h2 className="month-label">
            {g.label}
            <span>{count('workout', g.items.length)}</span>
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
          {t('history.showEarlier')}
        </button>
      )}
    </div>
  );
}
