import { useState } from 'react';
import { toast } from '../components/dialogs';
import { confirmDiscard, DraftBar } from '../components/DraftBar';
import { Empty, PageHeader } from '../components/ui';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { db } from '../db';
import { useData } from '../lib/data';
import { clearDraft, useDraft, useStoredDraft } from '../lib/drafts';
import { defaultWorkoutTitle, uid } from '../lib/format';
import { removeVideosForWorkout, setIdsOf } from '../lib/media';
import { goBack, navigate } from '../lib/router';
import { hasValues } from '../lib/stats';
import { workoutFromDraft } from '../lib/workouts';
import type { ActiveWorkout, Workout } from '../types';
import { t } from '../i18n';

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditWorkout({ id }: { id: string }) {
  const { workouts } = useData();
  const original = workouts.find((w) => w.id === id);
  const draftKey = `workout:${id}`;
  const stored = useStoredDraft<ActiveWorkout>(draftKey);
  if (!original) {
    return (
      <div className="page">
        <PageHeader back="/history" title={t('editWorkout.title')} />
        <Empty title={t('missing.workout')}>{t('missing.hint')}</Empty>
      </div>
    );
  }
  if (stored === undefined) return null;
  return <Editor key={draftKey} draftKey={draftKey} original={original} stored={stored} />;
}

/** `#/history/new`: a workout done earlier, entered by hand. Same editor, with its own draft slot. */
export function NewWorkout() {
  const stored = useStoredDraft<ActiveWorkout>(NEW_KEY);
  // The blank workout is made once, so its id stays put while the draft changes.
  const [blank] = useState<ActiveWorkout>(() => {
    const start = Math.floor((Date.now() - 60 * 60000) / 60000) * 60000;
    return { id: uid(), title: '', startTime: start, endTime: start + 60 * 60000, exercises: [] };
  });
  if (stored === undefined) return null;
  return <Editor key={NEW_KEY} draftKey={NEW_KEY} blank={blank} stored={stored} />;
}

const NEW_KEY = 'workout:new';

function Editor({
  draftKey,
  original,
  blank,
  stored,
}: {
  draftKey: string;
  original?: Workout;
  /** The starting point for a workout that doesn't exist yet. */
  blank?: ActiveWorkout;
  stored: ActiveWorkout | null;
}) {
  const draft = useDraft<ActiveWorkout>(
    draftKey,
    original
      ? {
          id: original.id,
          editingId: original.id,
          title: original.title,
          description: original.description,
          startTime: original.startTime,
          endTime: original.endTime,
          exercises: original.exercises,
          routineId: original.routineId,
        }
      : blank!,
    stored,
  );
  const w = draft.value;
  const set = (patch: Partial<ActiveWorkout>) => draft.update((d) => ({ ...d, ...patch }));
  const minutes = Math.round(((w.endTime ?? w.startTime) - w.startTime) / 60000);
  const back = original ? `/history/${original.id}` : '/history';

  /** Writes the workout; videos on sets the editor dropped go with them. */
  const saveWorkout = (workout: Workout) =>
    db.transaction('rw', db.workouts, db.media, async () => {
      await db.workouts.put(workout);
      await removeVideosForWorkout(workout.id, setIdsOf(workout));
    });

  /** Throws away what this edit added: videos on sets the saved workout doesn't have (all of them for a new one). */
  const dropAddedVideos = () => removeVideosForWorkout(w.id, original ? setIdsOf(original) : []);

  async function save() {
    // Without checkboxes in edit mode, any set with numbers in it counts as done.
    const workout = workoutFromDraft(
      { ...w, exercises: w.exercises.map((we) => ({ ...we, sets: we.sets.map((s) => ({ ...s, completed: hasValues(s) })) })) },
      false,
    );
    if (!original) {
      if (!workout.exercises.length) {
        toast(t('logPast.needSets'));
        return;
      }
      await saveWorkout(workout);
      await draft.clear();
      navigate(`/history/${workout.id}?saved=1`, { replace: true });
      return;
    }
    await saveWorkout(workout);
    await draft.clear();
    toast(t('editWorkout.updated'));
    goBack(back);
  }

  return (
    <div className="page">
      <PageHeader
        back={back}
        onBack={async () => {
          if (!(await confirmDiscard(draft.dirty))) return;
          await clearDraft(draftKey);
          await dropAddedVideos();
          goBack(back);
        }}
        title={original ? t('editWorkout.title') : t('logPast.title')}
        actions={
          <button className="btn btn-primary btn-small" onClick={save}>
            {t('common.save')}
          </button>
        }
      />
      {stored && draft.dirty && (
        <DraftBar
          onDiscard={() => {
            draft.discard();
            void dropAddedVideos();
          }}
        />
      )}
      <div className="form">
        <label className="field">
          <span>{t('form.name')}</span>
          <input value={w.title} placeholder={original ? undefined : defaultWorkoutTitle(w.startTime)} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>{t('editWorkout.started')}</span>
            <input
              type="datetime-local"
              value={toLocalInput(w.startTime)}
              max={original ? undefined : toLocalInput(Date.now())}
              onChange={(e) => {
                const start = new Date(e.target.value).getTime();
                if (Number.isNaN(start)) return;
                set({ startTime: start, endTime: start + minutes * 60000 });
              }}
            />
          </label>
          <label className="field field-narrow">
            <span>{t('editWorkout.minutes')}</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={minutes}
              onChange={(e) => set({ endTime: w.startTime + Math.max(1, Number(e.target.value) || 0) * 60000 })}
            />
          </label>
        </div>
        <label className="field">
          <span>{t('common.notes')}</span>
          <textarea rows={2} value={w.description ?? ''} onChange={(e) => set({ description: e.target.value || undefined })} />
        </label>
      </div>
      <WorkoutEditor
        exercises={w.exercises}
        onChange={(fn) => draft.update((d) => ({ ...d, exercises: fn(d.exercises) }))}
        mode="edit"
        previousBefore={original?.startTime ?? w.startTime}
        excludeWorkoutId={original?.id}
        routineId={original?.routineId}
        videoWorkoutId={w.id}
      />
    </div>
  );
}
