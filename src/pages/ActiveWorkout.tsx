import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { BufferedText } from '../components/fields';
import { IconDown } from '../components/Icons';
import { Sheet } from '../components/Sheet';
import { Empty, Stat, Toggle } from '../components/ui';
import { SlantBar } from '../components/WeekCard';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { db } from '../db';
import { useData, useNow } from '../lib/data';
import { fmtClock, fmtDuration, fmtTime, fmtVolume } from '../lib/format';
import { goBack, navigate } from '../lib/router';
import { useSettings } from '../lib/settings';
import { hasValues, workoutSets, workoutVolume } from '../lib/stats';
import { keepAwake } from '../lib/timer';
import { discardActive, finishActive, updateActive, useActiveWorkout } from '../lib/workouts';
import type { ActiveWorkout } from '../types';
import { beginWorkout } from './WorkoutHome';
import { t } from '../i18n';

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
          title={t('live.noneTitle')}
          action={
            <button className="btn btn-primary" onClick={() => beginWorkout()}>
              {t('live.startEmpty')}
            </button>
          }
        >
          {t('live.noneText')}
        </Empty>
      </div>
    );
  }

  const completed = workoutSets(active, true);
  const volume = workoutVolume(active, typeOf, true);
  const planned = active.exercises.reduce((n, we) => n + we.sets.length, 0);

  async function onFinish() {
    const withValues = active!.exercises.some((we) => we.sets.some((s) => s.completed || hasValues(s)));
    if (!withValues) {
      const discard = await confirmDialog({
        title: t('live.nothingTitle'),
        message: t('live.nothingText'),
        confirmLabel: t('live.discardWorkout'),
        cancelLabel: t('live.keepLogging'),
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
        <button className="icon-btn" onClick={() => goBack('/')} aria-label={t('live.minimise')}>
          <IconDown />
        </button>
        <div className="workout-clock-cell">
          <div className="workout-clock" aria-label={t('live.elapsed')}>
            {fmtClock((now - active.startTime) / 1000)}
          </div>
          {planned > 0 && <span className="workout-sets">{t('live.setsProgress', { done: completed, total: planned })}</span>}
        </div>
        <button className="btn btn-glow btn-small" onClick={onFinish}>
          {t('live.finish')}
        </button>
        {planned > 0 && (
          <SlantBar
            className="workout-progress"
            value={completed}
            max={planned}
            label={t('live.setsProgressLabel', { done: completed, total: planned })}
          />
        )}
      </header>

      <BufferedText
        className="title-input"
        value={active.title}
        onChange={(title) => updateActive((a) => ({ ...a, title }))}
        aria-label={t('live.nameLabel')}
      />

      <div className="stat-row">
        <Stat label={t('stat.volume')} value={fmtVolume(volume, settings.weightUnit)} />
        <Stat label={t('stat.setsDone')} value={completed} />
        <Stat label={t('stat.started')} value={fmtTime(active.startTime)} />
      </div>

      <WorkoutEditor
        exercises={active.exercises}
        onChange={(fn) => updateActive((a) => ({ ...a, exercises: fn(a.exercises) }))}
        mode="live"
        routineId={active.routineId}
        onRest={(seconds) => {
          if (seconds > 0) void updateActive((a) => ({ ...a, restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }));
        }}
        stopwatch={active.stopwatch}
        // Starting a timed set ends the rest, so its beep can't go off mid-set.
        onStopwatch={(stopwatch) =>
          void updateActive((a) => ({ ...a, stopwatch, ...(stopwatch ? { restEndsAt: undefined, restTotal: undefined } : {}) }))
        }
      />

      <button
        className="btn btn-danger-ghost btn-block discard"
        onClick={async () => {
          const ok = await confirmDialog({
            title: t('live.discardTitle'),
            message: t('live.discardText'),
            confirmLabel: t('live.discardWorkout'),
            danger: true,
          });
          if (ok) {
            await discardActive();
            navigate('/', { replace: true });
          }
        }}
      >
        {t('live.discardWorkout')}
      </button>

      <Sheet open={finishing} onClose={() => setFinishing(false)} title={t('live.saveTitle')}>
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
        try {
          const w = await finishActive({ title, description, keepUnchecked, updateRoutine });
          navigate(`/history/${w.id}?saved=1`, { replace: true });
        } catch (err) {
          setSaving(false);
          toast(t('live.saveFailed', { message: (err as Error).message }));
        }
      }}
    >
      <div className="stat-row">
        <Stat label={t('stat.duration')} value={fmtDuration((Date.now() - active.startTime) / 1000)} />
        <Stat label={t('stat.volume')} value={fmtVolume(workoutVolume(active, typeOf, !keepUnchecked), settings.weightUnit)} />
        <Stat label={t('stat.sets')} value={savedSets} />
      </div>
      <label className="field">
        <span>{t('form.name')}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span>{t('common.notes')}</span>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('live.notesPlaceholder')} />
      </label>
      {unchecked > 0 && (
        <Toggle
          checked={keepUnchecked}
          onChange={setKeepUnchecked}
          label={t('live.alsoSave', { n: unchecked })}
        />
      )}
      {routine && <Toggle checked={updateRoutine} onChange={setUpdateRoutine} label={t('live.updateRoutine', { title: routine.title })} />}
      {!savedSets && <p className="form-error">{t('live.needSet')}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t('live.keepLogging')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={!savedSets || saving}>
          {t('live.saveTitle')}
        </button>
      </div>
    </form>
  );
}
