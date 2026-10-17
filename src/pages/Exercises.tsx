import { useMemo, useState } from 'react';
import { ExerciseFilters, ExerciseRows, useFilteredExercises, useUsageCounts } from '../components/ExerciseList';
import { IconPlus } from '../components/Icons';
import { PageHeader } from '../components/ui';
import { useData } from '../lib/data';
import { Link, navigate } from '../lib/router';
import type { ExerciseFilter } from '../lib/search';
import type { Exercise } from '../types';
import { count, t } from '../i18n';

// Survives trips to an exercise and back within the session.
let lastFilter: ExerciseFilter = { query: '' };

export function Exercises() {
  const { exercises } = useData();
  const [filter, setFilterState] = useState(lastFilter);
  const setFilter = (f: ExerciseFilter) => setFilterState((lastFilter = f));
  const results = useFilteredExercises(filter);
  const usage = useUsageCounts();
  const browsing = !filter.query && !filter.muscle && !filter.equipment && !filter.customOnly;
  const open = (e: Exercise) => navigate(`/exercises/${e.id}`);

  const mine = useMemo(
    () =>
      exercises
        .filter((e) => usage.has(e.id))
        .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || a.name.localeCompare(b.name)),
    [exercises, usage],
  );

  return (
    <div className="page">
      <PageHeader
        large
        title={t('tab.exercises')}
        actions={
          <Link to="/exercises/new" className="btn btn-ghost btn-small">
            <IconPlus size={18} /> {t('common.new')}
          </Link>
        }
      />
      <div className="sticky-filters">
        <ExerciseFilters filter={filter} onChange={setFilter} />
      </div>
      {browsing && mine.length > 0 && (
        <>
          <h2 className="list-label">{t('exercises.doneByYou')}</h2>
          <ExerciseRows items={mine} onSelect={open} usage={usage} />
          <h2 className="list-label">{t('exercises.allCount', { count: count('exercise', results.length) })}</h2>
        </>
      )}
      {!browsing && <p className="list-label">{count('result', results.length)}</p>}
      <ExerciseRows items={results} onSelect={open} usage={usage} />
      {results.length === 0 && (
        <div className="empty">
          <h3>{t('exercises.nothing')}</h3>
          <p className="muted">{t('exercises.addYourself')}</p>
          <Link to="/exercises/new" className="btn btn-primary">
            {t('picker.create')}
          </Link>
        </div>
      )}
    </div>
  );
}
