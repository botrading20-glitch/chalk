import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { confirmDialog } from '../components/dialogs';
import { BufferedText } from '../components/fields';
import { IconDown } from '../components/Icons';
import { Sheet } from '../components/Sheet';
import { Empty, Stat, Toggle } from '../components/ui';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { db } from '../db';
import { useData, useNow } from '../lib/data';
import { fmtClock, fmtDuration, fmtTime, fmtVolume, plural } from '../lib/format';
import { goBack, navigate } from '../lib/router';
import { useSettings } from '../lib/settings';
import { hasValues, workoutSets, workoutVolume } from '../lib/stats';
import { keepAwake } from '../lib/timer';
import { discardActive, finishActive, updateActive, useActiveWorkout } from '../lib/workouts';
import type { ActiveWorkout } from '../types';
import { beginWorkout } from './WorkoutHome';

export function ActiveWorkoutPage() {
  const active = useActiveWorkout();
  const settings = useSettings();
  const { typeOf } = useData();
  const now = useNow(1000, !!active);
  const [finishing, setFinishing] = useState(false);
  const running = !!active;

  useEffect(() => {
    if (!running || !settings.keepAwake) return;
    void keepAwake(true);
    const onVisible = () => document.visibilityState === 'visible' && void keepAwake(true);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void keepAwake(false);
    };
  }, [running, settings.keepAwake]);

  if (active === undefined) return null;
  if (active === null) {
    return (
      <div className="page">
        <Empty
          title="No workout in progress"
          action={
            <button className="btn btn-primary" onClick={() => beginWorkout()}>
              Start empty workout
            </button>
          }
        >
          Start one from the Workout tab, or from any routine.
        </Empty>
      </div>
    );
  }

  const completed = workoutSets(active, true);
  const volume = workoutVolume(active, typeOf, true);

  async function onFinish() {
    const withValues = active!.exercises.some((we) => we.sets.some((s) => s.completed || hasValues(s)));
    if (!withValues) {
      const discard = await confirmDialog({
        title: 'Nothing logged yet',
        message: 'Enter and check off at least one set to save this workout.',
        confirmLabel: 'Discard workout',
        cancelLabel: 'Keep logging',
        danger: true,
      });
      if (discard) {
        await discardActive();
        navigate('/', { replace: true });
      }
      return;
    }
    setFinishing(true);
  }

  return (
    <div className="page workout-page">
      <header className="workout-head">
        <button className="icon-btn" onClick={() => goBack('/')} aria-label="Minimise workout">
          <IconDown />
        </button>
        <div className="workout-clock" aria-label="Elapsed time">
          {fmtClock((now - active.startTime) / 1000)}
        </div>
        <button className="btn btn-primary btn-small" onClick={onFinish}>
          Finish
        </button>
      </header>

      <BufferedText
        className="title-input"
        value={active.title}
        onChange={(title) => updateActive((a) => ({ ...a, title }))}
        aria-label="Workout name"
      />

      <div className="stat-row">
        <Stat label="Volume" value={fmtVolume(volume, settings.weightUnit)} />
        <Stat label="Sets done" value={completed} />
        <Stat label="Started" value={fmtTime(active.startTime)} />
      </div>

      <WorkoutEditor
        exercises={active.exercises}
        onChange={(fn) => updateActive((a) => ({ ...a, exercises: fn(a.exercises) }))}
        mode="live"
        onRest={(seconds) => {
          if (seconds > 0) void updateActive((a) => ({ ...a, restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }));
        }}
      />

      <button
        className="btn btn-danger-ghost btn-block discard"
        onClick={async () => {
          const ok = await confirmDialog({
            title: 'Discard this workout?',
            message: 'Everything logged in it will be lost.',
            confirmLabel: 'Discard workout',
            danger: true,
          });
          if (ok) {
            await discardActive();
            navigate('/', { replace: true });
          }
        }}
      >
        Discard workout
      </button>

      <Sheet open={finishing} onClose={() => setFinishing(false)} title="Save workout">
        <FinishForm active={active} onCancel={() => setFinishing(false)} />
      </Sheet>
    </div>
  );
}

function FinishForm({ active, onCancel }: { active: ActiveWorkout; onCancel: () => void }) {
  const settings = useSettings();
  const { typeOf } = useData();
  const [title, setTitle] = useState(active.title);
  const [description, setDescription] = useState(active.description ?? '');
  const allSets = active.exercises.flatMap((we) => we.sets);
  const done = allSets.filter((s) => s.completed).length;
  const unchecked = allSets.filter((s) => !s.completed && hasValues(s)).length;
  const [keepUnchecked, setKeepUnchecked] = useState(done === 0);
  const [updateRoutine, setUpdateRoutine] = useState(false);
  const routine = useLiveQuery(async () => (active.routineId ? db.routines.get(active.routineId) : undefined), [active.routineId]);
  const [saving, setSaving] = useState(false);
  const savedSets = done + (keepUnchecked ? unchecked : 0);

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (saving || !savedSets) return;
        setSaving(true);
        const w = await finishActive({ title, description, keepUnchecked, updateRoutine });
        navigate(`/history/${w.id}?saved=1`, { replace: true });
      }}
    >
      <div className="stat-row">
        <Stat label="Duration" value={fmtDuration((Date.now() - active.startTime) / 1000)} />
        <Stat label="Volume" value={fmtVolume(workoutVolume(active, typeOf, !keepUnchecked), settings.weightUnit)} />
        <Stat label="Sets" value={savedSets} />
      </div>
      <label className="field">
        <span>Name</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span>Notes</span>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="How did it go?" />
      </label>
      {unchecked > 0 && (
        <Toggle
          checked={keepUnchecked}
          onChange={setKeepUnchecked}
          label={`Also save ${plural(unchecked, 'set')} you didn't check off`}
        />
      )}
      {routine && <Toggle checked={updateRoutine} onChange={setUpdateRoutine} label={`Update "${routine.title}" with today's sets`} />}
      {!savedSets && <p className="form-error">Check off at least one set, or turn on saving unchecked sets.</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Keep logging
        </button>
        <button type="submit" className="btn btn-primary" disabled={!savedSets || saving}>
          Save workout
        </button>
      </div>
    </form>
  );
}
