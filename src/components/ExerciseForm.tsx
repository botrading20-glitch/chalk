import { useState } from 'react';
import { db } from '../db';
import { uid } from '../lib/format';
import { EQUIPMENT, EQUIPMENT_LABEL, EXERCISE_TYPES, MUSCLES, MUSCLE_LABEL, TYPE_LABEL } from '../lib/meta';
import type { Equipment, Exercise, ExerciseType, Muscle } from '../types';

export function ExerciseForm({
  initial,
  defaultName = '',
  onSaved,
  onCancel,
}: {
  initial?: Exercise;
  defaultName?: string;
  onSaved: (e: Exercise) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? defaultName);
  const [type, setType] = useState<ExerciseType>(initial?.type ?? 'weight_reps');
  const [equipment, setEquipment] = useState<Equipment>(initial?.equipment ?? 'machine');
  const [primary, setPrimary] = useState<Muscle>(initial?.primaryMuscle ?? 'chest');
  const [secondary, setSecondary] = useState<Muscle[]>(initial?.secondaryMuscles ?? []);
  const [error, setError] = useState('');

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the exercise a name.');
      return;
    }
    const clash = await db.exercises.filter((e) => e.name.toLowerCase() === trimmed.toLowerCase() && e.id !== initial?.id).first();
    if (clash) {
      setError(`"${clash.name}" already exists. Pick a different name.`);
      return;
    }
    const exercise: Exercise = {
      id: initial?.id ?? `cus-${uid()}`,
      name: trimmed,
      type,
      equipment,
      primaryMuscle: primary,
      secondaryMuscles: secondary.filter((m) => m !== primary),
      instructions: initial?.instructions ?? [],
      images: initial?.images ?? [],
      source: 'custom',
    };
    await db.exercises.put(exercise);
    onSaved(exercise);
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label className="field">
        <span>Name</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="e.g. Pendulum Squat (Machine)"
          autoFocus={!initial}
        />
      </label>
      <label className="field">
        <span>What you log</span>
        <select value={type} onChange={(e) => setType(e.target.value as ExerciseType)}>
          {EXERCISE_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Equipment</span>
        <select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
          {EQUIPMENT.map((q) => (
            <option key={q} value={q}>
              {EQUIPMENT_LABEL[q]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Primary muscle</span>
        <select value={primary} onChange={(e) => setPrimary(e.target.value as Muscle)}>
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {MUSCLE_LABEL[m]}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field">
        <legend>Other muscles worked</legend>
        <div className="chips wrap">
          {MUSCLES.filter((m) => m !== primary && m !== 'cardio' && m !== 'other').map((m) => {
            const on = secondary.includes(m);
            return (
              <button
                type="button"
                key={m}
                className={`chip ${on ? 'on' : ''}`}
                aria-pressed={on}
                onClick={() => setSecondary(on ? secondary.filter((x) => x !== m) : [...secondary, m])}
              >
                {MUSCLE_LABEL[m]}
              </button>
            );
          })}
        </div>
      </fieldset>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initial ? 'Save changes' : 'Create exercise'}
        </button>
      </div>
    </form>
  );
}
