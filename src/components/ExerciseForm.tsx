import { useState } from 'react';
import { db } from '../db';
import { uid } from '../lib/format';
import { EQUIPMENT, EQUIPMENT_LABEL, EXERCISE_TYPES, MUSCLES, MUSCLE_LABEL, TYPE_LABEL } from '../lib/meta';
import type { Equipment, Exercise, ExerciseType, Muscle } from '../types';
import { t } from '../i18n';

export function ExerciseForm({
  initial,
  copyOf,
  defaultName = '',
  onSaved,
  onCancel,
}: {
  initial?: Exercise;
  /** A library exercise to save the user's own version of. */
  copyOf?: Exercise;
  defaultName?: string;
  onSaved: (e: Exercise) => void;
  onCancel: () => void;
}) {
  const from = initial ?? copyOf;
  const [name, setName] = useState(from?.name ?? defaultName);
  const [type, setType] = useState<ExerciseType>(from?.type ?? 'weight_reps');
  const [equipment, setEquipment] = useState<Equipment>(from?.equipment ?? 'machine');
  const [primary, setPrimary] = useState<Muscle>(from?.primaryMuscle ?? 'chest');
  const [secondary, setSecondary] = useState<Muscle[]>(from?.secondaryMuscles ?? []);
  const [error, setError] = useState('');

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('form.nameRequired'));
      return;
    }
    // The library original being replaced may keep its name.
    const replaces = initial?.replaces ?? copyOf?.id;
    const clash = await db.exercises
      .filter((e) => e.name.toLowerCase() === trimmed.toLowerCase() && e.id !== initial?.id && e.id !== replaces)
      .first();
    if (clash) {
      setError(t('form.nameTaken', { name: clash.name }));
      return;
    }
    const exercise: Exercise = {
      id: initial?.id ?? `cus-${uid()}`,
      name: trimmed,
      type,
      equipment,
      primaryMuscle: primary,
      secondaryMuscles: secondary.filter((m) => m !== primary),
      instructions: from?.instructions ?? [],
      images: from?.images ?? [],
      source: 'custom',
      ...(replaces ? { replaces } : {}),
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
        <span>{t('form.name')}</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder={t('form.namePlaceholder')}
          autoFocus={!from}
        />
      </label>
      <label className="field">
        <span>{t('form.whatYouLog')}</span>
        <select value={type} onChange={(e) => setType(e.target.value as ExerciseType)}>
          {EXERCISE_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t('form.equipment')}</span>
        <select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
          {EQUIPMENT.map((q) => (
            <option key={q} value={q}>
              {EQUIPMENT_LABEL[q]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t('form.primaryMuscle')}</span>
        <select value={primary} onChange={(e) => setPrimary(e.target.value as Muscle)}>
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {MUSCLE_LABEL[m]}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field">
        <legend>{t('form.otherMuscles')}</legend>
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
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn btn-primary">
          {initial || copyOf ? t('form.saveChanges') : t('form.create')}
        </button>
      </div>
    </form>
  );
}
