import { useMemo, useState } from 'react';
import { useData } from '../lib/data';
import type { ExerciseFilter } from '../lib/search';
import type { Exercise } from '../types';
import { ExerciseFilters, ExerciseRows, useFilteredExercises, useUsageCounts } from './ExerciseList';
import { ExerciseForm } from './ExerciseForm';
import { IconPlus } from './Icons';
import { Sheet } from './Sheet';

export function ExercisePicker({
  open,
  onClose,
  onPick,
  multi = true,
  title = 'Add exercises',
}: {
  open: boolean;
  onClose: () => void;
  onPick: (ids: string[]) => void;
  multi?: boolean;
  title?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} full>
      <PickerBody onClose={onClose} onPick={onPick} multi={multi} />
    </Sheet>
  );
}

function PickerBody({ onClose, onPick, multi }: { onClose: () => void; onPick: (ids: string[]) => void; multi: boolean }) {
  const { workouts, exerciseMap } = useData();
  const [filter, setFilter] = useState<ExerciseFilter>({ query: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const usage = useUsageCounts();
  const results = useFilteredExercises(filter);
  const browsing = !filter.query && !filter.muscle && !filter.equipment && !filter.customOnly;

  const recent = useMemo(() => {
    const ids: string[] = [];
    for (const w of workouts.slice(0, 20)) for (const id of w.exerciseIds) if (!ids.includes(id)) ids.push(id);
    return ids
      .slice(0, 12)
      .map((id) => exerciseMap.get(id))
      .filter((e): e is Exercise => !!e);
  }, [workouts, exerciseMap]);

  const selectedSet = new Set(selected);
  const toggle = (e: Exercise) => {
    if (!multi) {
      onPick([e.id]);
      onClose();
      return;
    }
    setSelected((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]));
  };

  if (creating) {
    return (
      <div className="picker-create">
        <h3 className="section-title">New exercise</h3>
        <ExerciseForm
          defaultName={filter.query.trim()}
          onCancel={() => setCreating(false)}
          onSaved={(e) => {
            setCreating(false);
            toggle(e);
          }}
        />
      </div>
    );
  }

  return (
    <div className="picker">
      <div className="picker-top">
        {/* Typing straight away suits a keyboard; on phones it would hide the list behind the keyboard. */}
        <ExerciseFilters filter={filter} onChange={setFilter} autoFocus={matchMedia('(pointer: fine)').matches} />
        <button className="btn btn-ghost btn-small" onClick={() => setCreating(true)}>
          <IconPlus size={18} /> Create exercise
        </button>
      </div>
      <div className="picker-scroll">
        {browsing && recent.length > 0 && (
          <>
            <h3 className="list-label">Recent</h3>
            <ExerciseRows items={recent} selected={selectedSet} onSelect={toggle} usage={usage} />
            <h3 className="list-label">All exercises</h3>
          </>
        )}
        {results.length ? (
          <ExerciseRows items={results} selected={selectedSet} onSelect={toggle} usage={usage} />
        ) : (
          <div className="empty">
            <h3>No exercise matches "{filter.query}"</h3>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              Create "{filter.query.trim() || 'new exercise'}"
            </button>
          </div>
        )}
      </div>
      {multi && selected.length > 0 && (
        <div className="picker-footer">
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              onPick(selected);
              onClose();
            }}
          >
            Add {selected.length === 1 ? 'exercise' : `${selected.length} exercises`}
          </button>
        </div>
      )}
    </div>
  );
}
