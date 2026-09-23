import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../lib/data';
import { EQUIPMENT, EQUIPMENT_LABEL, MUSCLES, MUSCLE_LABEL } from '../lib/meta';
import { searchExercises, type ExerciseFilter } from '../lib/search';
import type { Equipment, Exercise, Muscle } from '../types';
import { IconCheck, IconClose, IconSearch } from './Icons';
import { ExerciseAvatar } from './ui';

const PAGE = 60;

export function useUsageCounts() {
  const { workouts } = useData();
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of workouts) for (const id of w.exerciseIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  }, [workouts]);
}

export function ExerciseFilters({
  filter,
  onChange,
  autoFocus = false,
}: {
  filter: ExerciseFilter;
  onChange: (f: ExerciseFilter) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="filters">
      <label className="search">
        <IconSearch size={18} />
        <input
          type="search"
          placeholder="Search 1,000+ exercises"
          value={filter.query}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          aria-label="Search exercises"
          autoFocus={autoFocus}
        />
        {filter.query && (
          <button className="icon-btn small" onClick={() => onChange({ ...filter, query: '' })} aria-label="Clear search">
            <IconClose size={16} />
          </button>
        )}
      </label>
      <div className="filter-row">
        <select
          className={`chip-select ${filter.muscle ? 'on' : ''}`}
          value={filter.muscle ?? ''}
          onChange={(e) => onChange({ ...filter, muscle: (e.target.value || undefined) as Muscle | undefined })}
          aria-label="Filter by muscle"
        >
          <option value="">All muscles</option>
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {MUSCLE_LABEL[m]}
            </option>
          ))}
        </select>
        <select
          className={`chip-select ${filter.equipment ? 'on' : ''}`}
          value={filter.equipment ?? ''}
          onChange={(e) => onChange({ ...filter, equipment: (e.target.value || undefined) as Equipment | undefined })}
          aria-label="Filter by equipment"
        >
          <option value="">All equipment</option>
          {EQUIPMENT.map((q) => (
            <option key={q} value={q}>
              {EQUIPMENT_LABEL[q]}
            </option>
          ))}
        </select>
        <button
          className={`chip ${filter.customOnly ? 'on' : ''}`}
          aria-pressed={!!filter.customOnly}
          onClick={() => onChange({ ...filter, customOnly: !filter.customOnly })}
        >
          Mine
        </button>
      </div>
    </div>
  );
}

export function useFilteredExercises(filter: ExerciseFilter) {
  const { exercises } = useData();
  return useMemo(() => searchExercises(exercises, filter), [exercises, filter]);
}

export function ExerciseRows({
  items,
  selected,
  onSelect,
  usage,
}: {
  items: Exercise[];
  selected?: Set<string>;
  onSelect: (e: Exercise) => void;
  usage: Map<string, number>;
}) {
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => setLimit(PAGE), [items]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + PAGE);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [items, limit]);

  return (
    <ul className="ex-list">
      {items.slice(0, limit).map((e) => {
        const on = selected?.has(e.id);
        const count = usage.get(e.id);
        return (
          <li key={e.id}>
            <button className={`ex-row ${on ? 'on' : ''}`} onClick={() => onSelect(e)} aria-pressed={selected ? on : undefined}>
              <ExerciseAvatar exercise={e} />
              <span className="ex-row-text">
                <span className="ex-row-name">{e.name}</span>
                <span className="ex-row-meta">
                  {MUSCLE_LABEL[e.primaryMuscle]} · {EQUIPMENT_LABEL[e.equipment]}
                  {e.source === 'custom' && ' · Mine'}
                </span>
              </span>
              {count ? <span className="ex-row-count">{count}×</span> : null}
              {on && (
                <span className="ex-row-check">
                  <IconCheck size={18} />
                </span>
              )}
            </button>
          </li>
        );
      })}
      {limit < items.length && <div ref={sentinel} className="sentinel" />}
    </ul>
  );
}
