import { useMemo, useState, type CSSProperties } from 'react';
import { useData, usePreviousSets } from '../lib/data';
import { fmtRest, kgTo, kmTo, toKg, toKm, uid } from '../lib/format';
import { SET_TYPE_LABEL, type Field } from '../lib/meta';
import { Link } from '../lib/router';
import { fieldHeader, fieldsFor, fmtSet, setLabels } from '../lib/sets';
import { useSettings } from '../lib/settings';
import { unlockAudio } from '../lib/timer';
import { emptySet } from '../lib/workouts';
import type { SetType, WorkoutExercise, WorkoutSet } from '../types';
import { toast } from './dialogs';
import { ExercisePicker } from './ExercisePicker';
import { BufferedTextarea, DurationField, NumberField } from './fields';
import {
  IconArrowDown,
  IconCheck,
  IconLink,
  IconMore,
  IconNote,
  IconPlate,
  IconPlus,
  IconSwap,
  IconTimer,
  IconTrash,
  IconUp,
} from './Icons';
import { PlateSheet } from './PlateCalculator';
import { ActionSheet, Sheet } from './Sheet';
import { ExerciseAvatar } from './ui';

export type EditorMode = 'live' | 'edit' | 'routine';

const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const RPE_OPTIONS = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const SET_TYPES: SetType[] = ['warmup', 'normal', 'failure', 'dropset'];

type Update = (fn: (list: WorkoutExercise[]) => WorkoutExercise[]) => void;

export function WorkoutEditor({
  exercises,
  onChange,
  mode,
  previousBefore,
  excludeWorkoutId,
  onRest,
}: {
  exercises: WorkoutExercise[];
  onChange: Update;
  mode: EditorMode;
  /** Only sessions that started before this time count as "previous". */
  previousBefore?: number;
  excludeWorkoutId?: string;
  /** Live mode: called with the rest length after a set is checked off. */
  onRest?: (seconds: number) => void;
}) {
  const { workouts, exerciseMap } = useData();
  const settings = useSettings();
  const previous = usePreviousSets(
    exercises.map((e) => e.exerciseId),
    { before: previousBefore, excludeId: excludeWorkoutId },
  );
  const [picker, setPicker] = useState<{ replace?: string } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [setMenu, setSetMenu] = useState<{ ex: string; set: string } | null>(null);
  const [restFor, setRestFor] = useState<string | null>(null);
  const [platesFor, setPlatesFor] = useState<string | null>(null);

  const supersetLetters = useMemo(() => {
    const map = new Map<number, string>();
    for (const we of exercises) {
      if (we.supersetId !== undefined && !map.has(we.supersetId)) map.set(we.supersetId, String.fromCharCode(65 + map.size));
    }
    return map;
  }, [exercises]);

  const updateEx = (id: string, fn: (we: WorkoutExercise) => WorkoutExercise) =>
    onChange((list) => list.map((we) => (we.id === id ? fn(we) : we)));
  const updateSet = (exId: string, setId: string, patch: Partial<WorkoutSet>) =>
    updateEx(exId, (we) => ({ ...we, sets: we.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }));

  function lastBlocks(exerciseId: string) {
    for (const w of workouts) {
      if (w.id === excludeWorkoutId || (previousBefore !== undefined && w.startTime >= previousBefore)) continue;
      const blocks = w.exercises.filter((we) => we.exerciseId === exerciseId);
      if (blocks.length) return blocks;
    }
    return undefined;
  }

  function newBlock(exerciseId: string): WorkoutExercise {
    const prev = lastBlocks(exerciseId);
    const prevSets = prev?.flatMap((b) => b.sets);
    const sets = prevSets?.length
      ? prevSets.map((s) => emptySet(s.type))
      : Array.from({ length: mode === 'routine' ? 3 : 1 }, () => emptySet());
    return { id: uid(), exerciseId, sets, restSeconds: prev?.[0]?.restSeconds };
  }

  function addExercises(ids: string[]) {
    if (picker?.replace) {
      const target = picker.replace;
      updateEx(target, (we) => ({ ...we, exerciseId: ids[0] }));
    } else onChange((list) => [...list, ...ids.map(newBlock)]);
  }

  /** Previous-session set that lines up with this one (warm-ups align with warm-ups). */
  function prevFor(we: WorkoutExercise, index: number) {
    const list = previous.get(we.exerciseId);
    if (!list) return undefined;
    const warm = we.sets[index].type === 'warmup';
    const k = we.sets.slice(0, index).filter((s) => (s.type === 'warmup') === warm).length;
    return list.filter((s) => (s.type === 'warmup') === warm)[k];
  }

  function placeholderFor(we: WorkoutExercise, index: number): Partial<WorkoutSet> | undefined {
    const prev = prevFor(we, index);
    if (prev) return prev;
    for (let i = index - 1; i >= 0; i--) {
      const s = we.sets[i];
      if ([s.weight, s.reps, s.distance, s.duration].some((v) => v !== undefined)) return s;
    }
    return undefined;
  }

  function restAfter(we: WorkoutExercise) {
    if (we.supersetId !== undefined) {
      const group = exercises.filter((x) => x.supersetId === we.supersetId);
      if (group.at(-1)?.id !== we.id) return 0;
    }
    return we.restSeconds ?? settings.defaultRest;
  }

  function toggleDone(we: WorkoutExercise, index: number) {
    const s = we.sets[index];
    if (s.completed) {
      updateSet(we.id, s.id, { completed: false });
      return;
    }
    const fields = fieldsFor(exerciseMap.get(we.exerciseId)?.type ?? 'weight_reps');
    const ph = placeholderFor(we, index);
    const filled: Partial<WorkoutSet> = {};
    for (const f of fields) if (s[f] === undefined && ph?.[f] !== undefined) filled[f] = ph[f];
    if (!fields.some((f) => (filled[f] ?? s[f]) !== undefined)) {
      toast(`Enter ${fields.includes('reps') ? 'reps' : fields.includes('duration') ? 'a time' : 'a value'} first`);
      return;
    }
    unlockAudio();
    updateSet(we.id, s.id, { ...filled, completed: true });
    onRest?.(restAfter(we));
  }

  function move(id: string, dir: -1 | 1) {
    onChange((list) => {
      const i = list.findIndex((we) => we.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function supersetWithNext(id: string) {
    onChange((list) => {
      const i = list.findIndex((we) => we.id === id);
      const next = list[i + 1];
      if (!next) return list;
      const groupId = list[i].supersetId ?? next.supersetId ?? Math.max(0, ...list.map((we) => (we.supersetId ?? -1) + 1));
      return list.map((we, k) => (k === i || k === i + 1 ? { ...we, supersetId: groupId } : we));
    });
  }

  function leaveSuperset(id: string) {
    onChange((list) => {
      const groupId = list.find((we) => we.id === id)?.supersetId;
      const rest = list.filter((we) => we.id !== id && we.supersetId === groupId);
      return list.map((we) =>
        we.id === id || (rest.length < 2 && we.supersetId === groupId) ? { ...we, supersetId: undefined } : we,
      );
    });
  }

  const menuEx = exercises.find((we) => we.id === menuFor);
  const menuIndex = menuEx ? exercises.indexOf(menuEx) : -1;
  const setMenuEx = exercises.find((we) => we.id === setMenu?.ex);
  const setMenuSet = setMenuEx?.sets.find((s) => s.id === setMenu?.set);
  const restEx = exercises.find((we) => we.id === restFor);
  const platesEx = exercises.find((we) => we.id === platesFor);
  const plates = platesEx && plateTarget(platesEx);

  /** The set the plate calculator loads for: the next one to do, else the last one. */
  function plateTarget(we: WorkoutExercise) {
    const next = mode === 'live' ? we.sets.findIndex((s) => !s.completed) : we.sets.findIndex((s) => s.weight === undefined);
    const i = next === -1 ? we.sets.length - 1 : next;
    const set = we.sets[i];
    return set && { set, label: setLabels(we.sets)[i], kg: set.weight ?? placeholderFor(we, i)?.weight };
  }

  return (
    <div className="editor">
      {exercises.length === 0 && (
        <div className="empty editor-empty">
          <h3>No exercises yet</h3>
          <p className="muted">Add the exercises you're doing. Your last numbers show up next to each set.</p>
        </div>
      )}

      {exercises.map((we) => {
        const ex = exerciseMap.get(we.exerciseId);
        const type = ex?.type ?? 'weight_reps';
        const fields = fieldsFor(type);
        const labels = setLabels(we.sets);
        const letter = we.supersetId !== undefined ? supersetLetters.get(we.supersetId) : undefined;
        const cols = `2.5rem minmax(0,1fr) ${fields.map(() => '4.25rem').join(' ')}${mode === 'live' ? ' 2.75rem' : ''}`;

        return (
          <section key={we.id} className={`ex-block ${letter ? 'in-superset' : ''}`}>
            <header className="ex-head">
              <Link to={`/exercises/${we.exerciseId}`} className="ex-title">
                <ExerciseAvatar exercise={ex} size={38} />
                <span>
                  {letter && <span className="superset-tag">Superset {letter}</span>}
                  <span className="ex-name">{ex?.name ?? 'Deleted exercise'}</span>
                </span>
              </Link>
              <button className="icon-btn" onClick={() => setMenuFor(we.id)} aria-label={`Options for ${ex?.name}`}>
                <IconMore />
              </button>
            </header>

            {we.notes !== undefined && (
              <BufferedTextarea
                className="ex-notes"
                rows={1}
                placeholder="Add a note: seat height, grip, how it felt…"
                value={we.notes}
                onChange={(notes) => updateEx(we.id, (x) => ({ ...x, notes }))}
              />
            )}

            {mode !== 'edit' && (
              <button className="rest-chip" onClick={() => setRestFor(we.id)}>
                <IconTimer size={16} /> Rest {fmtRest(we.restSeconds ?? settings.defaultRest)}
              </button>
            )}

            <div className="set-table" style={{ '--cols': cols } as CSSProperties}>
              <div className="set-row set-head" aria-hidden="true">
                <span>Set</span>
                <span className="prev-col">Previous</span>
                {fields.map((f) => (
                  <span key={f}>{fieldHeader(f, type, settings)}</span>
                ))}
                {mode === 'live' && (
                  <span>
                    <IconCheck size={16} />
                  </span>
                )}
              </div>
              {we.sets.map((s, i) => {
                const prev = prevFor(we, i);
                const ph = placeholderFor(we, i);
                return (
                  <div key={s.id} className={`set-row ${s.completed && mode === 'live' ? 'done' : ''}`}>
                    <button
                      className="set-badge"
                      data-type={s.type}
                      onClick={() => setSetMenu({ ex: we.id, set: s.id })}
                      aria-label={`Set ${labels[i]}, ${SET_TYPE_LABEL[s.type]}. Change set type`}
                    >
                      {labels[i]}
                      {s.rpe !== undefined && <sup>@{s.rpe}</sup>}
                    </button>
                    <button
                      className="prev-col prev"
                      disabled={!prev}
                      onClick={() => {
                        if (!prev) return;
                        const patch: Partial<WorkoutSet> = {};
                        for (const f of fields) patch[f] = prev[f];
                        updateSet(we.id, s.id, patch);
                      }}
                      aria-label={prev ? `Copy previous: ${fmtSet(prev, type, settings)}` : 'No previous set'}
                    >
                      {prev ? fmtSet(prev, type, settings) : '—'}
                    </button>
                    {fields.map((f) => (
                      <SetInput
                        key={f}
                        field={f}
                        set={s}
                        placeholder={ph}
                        label={`Set ${labels[i]} ${f}`}
                        onChange={(patch) => updateSet(we.id, s.id, patch)}
                      />
                    ))}
                    {mode === 'live' && (
                      <button
                        className={`check ${s.completed ? 'on' : ''}`}
                        onClick={() => toggleDone(we, i)}
                        aria-pressed={s.completed}
                        aria-label={`Mark set ${labels[i]} done`}
                      >
                        <IconCheck size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              className="add-set"
              onClick={() => {
                const last = we.sets.at(-1);
                updateEx(we.id, (x) => ({ ...x, sets: [...x.sets, emptySet(last?.type === 'warmup' ? 'normal' : last?.type)] }));
              }}
            >
              <IconPlus size={16} /> Add set
            </button>
          </section>
        );
      })}

      <button className="btn btn-accent-outline btn-block" onClick={() => setPicker({})}>
        <IconPlus size={18} /> Add exercise
      </button>

      <ExercisePicker
        open={!!picker}
        onClose={() => setPicker(null)}
        onPick={addExercises}
        multi={!picker?.replace}
        title={picker?.replace ? 'Replace exercise' : 'Add exercises'}
      />

      <ActionSheet
        open={!!menuEx}
        onClose={() => setMenuFor(null)}
        title={menuEx ? exerciseMap.get(menuEx.exerciseId)?.name : ''}
        actions={
          menuEx
            ? [
                {
                  label: 'Add a note',
                  icon: <IconNote />,
                  hidden: menuEx.notes !== undefined,
                  onSelect: () => updateEx(menuEx.id, (x) => ({ ...x, notes: '' })),
                },
                {
                  label: 'Plate calculator',
                  icon: <IconPlate />,
                  hidden: !fieldsFor(exerciseMap.get(menuEx.exerciseId)?.type ?? 'weight_reps').includes('weight'),
                  onSelect: () => setPlatesFor(menuEx.id),
                },
                { label: 'Replace exercise', icon: <IconSwap />, onSelect: () => setPicker({ replace: menuEx.id }) },
                { label: 'Move up', icon: <IconUp />, hidden: menuIndex <= 0, onSelect: () => move(menuEx.id, -1) },
                {
                  label: 'Move down',
                  icon: <IconArrowDown />,
                  hidden: menuIndex >= exercises.length - 1,
                  onSelect: () => move(menuEx.id, 1),
                },
                {
                  label: 'Superset with next exercise',
                  icon: <IconLink />,
                  hidden:
                    menuIndex >= exercises.length - 1 ||
                    (menuEx.supersetId !== undefined && exercises[menuIndex + 1]?.supersetId === menuEx.supersetId),
                  onSelect: () => supersetWithNext(menuEx.id),
                },
                {
                  label: 'Remove from superset',
                  icon: <IconLink />,
                  hidden: menuEx.supersetId === undefined,
                  onSelect: () => leaveSuperset(menuEx.id),
                },
                {
                  label: 'Remove exercise',
                  icon: <IconTrash />,
                  danger: true,
                  onSelect: () => onChange((list) => list.filter((x) => x.id !== menuEx.id)),
                },
              ]
            : []
        }
      />

      <PlateSheet
        open={!!platesEx}
        onClose={() => setPlatesFor(null)}
        exercise={platesEx && exerciseMap.get(platesEx.exerciseId)}
        initialKg={plates?.kg}
        use={
          platesEx && plates
            ? {
                label: `Use {weight} for set ${plates.label}`,
                current: plates.set.weight,
                apply: (kg) => updateSet(platesEx.id, plates.set.id, { weight: kg }),
              }
            : undefined
        }
      />

      <Sheet open={!!setMenuSet} onClose={() => setSetMenu(null)} title="Set type">
        {setMenuEx && setMenuSet && (
          <div className="set-menu">
            <div className="set-type-grid">
              {SET_TYPES.map((t) => (
                <button
                  key={t}
                  className={`set-type-option ${setMenuSet.type === t ? 'on' : ''}`}
                  onClick={() => {
                    updateSet(setMenuEx.id, setMenuSet.id, { type: t });
                    setSetMenu(null);
                  }}
                >
                  <span className="set-badge" data-type={t}>
                    {t === 'normal' ? '1' : t[0].toUpperCase()}
                  </span>
                  {SET_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            {mode !== 'routine' && (
              <>
                <h3 className="list-label">RPE — how hard was it?</h3>
                <div className="chips wrap">
                  <button
                    className={`chip ${setMenuSet.rpe === undefined ? 'on' : ''}`}
                    onClick={() => updateSet(setMenuEx.id, setMenuSet.id, { rpe: undefined })}
                  >
                    None
                  </button>
                  {RPE_OPTIONS.map((r) => (
                    <button
                      key={r}
                      className={`chip ${setMenuSet.rpe === r ? 'on' : ''}`}
                      onClick={() => updateSet(setMenuEx.id, setMenuSet.id, { rpe: r })}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button
              className="btn btn-danger-ghost btn-block"
              onClick={() => {
                updateEx(setMenuEx.id, (x) => ({ ...x, sets: x.sets.filter((s) => s.id !== setMenuSet.id) }));
                setSetMenu(null);
              }}
            >
              <IconTrash size={18} /> Remove set
            </button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!restEx} onClose={() => setRestFor(null)} title="Rest after each set">
        {restEx && (
          <div className="chips wrap rest-grid">
            {REST_OPTIONS.map((r) => (
              <button
                key={r}
                className={`chip ${(restEx.restSeconds ?? settings.defaultRest) === r ? 'on' : ''}`}
                onClick={() => {
                  updateEx(restEx.id, (x) => ({ ...x, restSeconds: r }));
                  setRestFor(null);
                }}
              >
                {fmtRest(r)}
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function SetInput({
  field,
  set,
  placeholder,
  label,
  onChange,
}: {
  field: Field;
  set: WorkoutSet;
  placeholder?: Partial<WorkoutSet>;
  label: string;
  onChange: (patch: Partial<WorkoutSet>) => void;
}) {
  const { weightUnit, distanceUnit } = useSettings();
  const ph = placeholder?.[field];
  switch (field) {
    case 'weight':
      return (
        <NumberField
          className="set-input"
          aria-label={label}
          decimals={weightUnit === 'kg' ? 2 : 1}
          value={set.weight !== undefined ? kgTo(set.weight, weightUnit) : undefined}
          placeholder={ph !== undefined ? String(Number(kgTo(ph, weightUnit).toFixed(weightUnit === 'kg' ? 2 : 1))) : '0'}
          onChange={(v) => onChange({ weight: v === undefined ? undefined : toKg(v, weightUnit) })}
        />
      );
    case 'reps':
      return (
        <NumberField
          className="set-input"
          aria-label={label}
          integer
          value={set.reps}
          placeholder={ph !== undefined ? String(ph) : '0'}
          onChange={(v) => onChange({ reps: v })}
        />
      );
    case 'distance':
      return (
        <NumberField
          className="set-input"
          aria-label={label}
          value={set.distance !== undefined ? kmTo(set.distance, distanceUnit) : undefined}
          placeholder={ph !== undefined ? String(Number(kmTo(ph, distanceUnit).toFixed(2))) : '0'}
          onChange={(v) => onChange({ distance: v === undefined ? undefined : toKm(v, distanceUnit) })}
        />
      );
    case 'duration':
      return (
        <DurationField
          className="set-input"
          aria-label={label}
          value={set.duration}
          placeholder={ph !== undefined ? `${Math.floor(ph / 60)}:${String(ph % 60).padStart(2, '0')}` : '0:00'}
          onChange={(v) => onChange({ duration: v })}
        />
      );
  }
}
