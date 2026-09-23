import { useMemo, useState } from 'react';
import { ExerciseFilters, ExerciseRows, useFilteredExercises, useUsageCounts } from '../components/ExerciseList';
import { IconPlus } from '../components/Icons';
import { PageHeader } from '../components/ui';
import { useData } from '../lib/data';
import { plural } from '../lib/format';
import { Link, navigate } from '../lib/router';
import type { ExerciseFilter } from '../lib/search';
import type { Exercise } from '../types';

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
        title="Exercises"
        actions={
          <Link to="/exercises/new" className="btn btn-ghost btn-small">
            <IconPlus size={18} /> New
          </Link>
        }
      />
      <div className="sticky-filters">
        <ExerciseFilters filter={filter} onChange={setFilter} />
      </div>
      {browsing && mine.length > 0 && (
        <>
          <h2 className="list-label">Done by you · most frequent first</h2>
          <ExerciseRows items={mine} onSelect={open} usage={usage} />
          <h2 className="list-label">All exercises · {plural(results.length, 'exercise')}</h2>
        </>
      )}
      {!browsing && <p className="list-label">{plural(results.length, 'result')}</p>}
      <ExerciseRows items={results} onSelect={open} usage={usage} />
      {results.length === 0 && (
        <div className="empty">
          <h3>Nothing matches</h3>
          <p className="muted">Can't find it? Add it yourself — it takes ten seconds.</p>
          <Link to="/exercises/new" className="btn btn-primary">
            Create exercise
          </Link>
        </div>
      )}
    </div>
  );
}
