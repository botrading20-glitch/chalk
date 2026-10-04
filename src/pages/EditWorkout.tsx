import { toast } from '../components/dialogs';
import { confirmDiscard, DraftBar } from '../components/DraftBar';
import { Empty, PageHeader } from '../components/ui';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { db } from '../db';
import { useData } from '../lib/data';
import { clearDraft, useDraft, useStoredDraft } from '../lib/drafts';
import { goBack } from '../lib/router';
import { hasValues } from '../lib/stats';
import { workoutFromDraft } from '../lib/workouts';
import type { ActiveWorkout, Workout } from '../types';

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
        <PageHeader back="/history" title="Edit workout" />
        <Empty title="This workout doesn't exist">It may have been deleted.</Empty>
      </div>
    );
  }
  if (stored === undefined) return null;
  return <Editor key={draftKey} draftKey={draftKey} original={original} stored={stored} />;
}

function Editor({ draftKey, original, stored }: { draftKey: string; original: Workout; stored: ActiveWorkout | null }) {
  const draft = useDraft<ActiveWorkout>(
    draftKey,
    {
      id: original.id,
      editingId: original.id,
      title: original.title,
      description: original.description,
      startTime: original.startTime,
      endTime: original.endTime,
      exercises: original.exercises,
      routineId: original.routineId,
    },
    stored,
  );
  const w = draft.value;
  const set = (patch: Partial<ActiveWorkout>) => draft.update((d) => ({ ...d, ...patch }));
  const minutes = Math.round(((w.endTime ?? w.startTime) - w.startTime) / 60000);
  const back = `/history/${original.id}`;

  async function save() {
    // Without checkboxes in edit mode, any set with numbers in it counts as done.
    const workout = workoutFromDraft(
      { ...w, exercises: w.exercises.map((we) => ({ ...we, sets: we.sets.map((s) => ({ ...s, completed: hasValues(s) })) })) },
      false,
    );
    await db.workouts.put(workout);
    await draft.clear();
    toast('Workout updated');
    goBack(back);
  }

  return (
    <div className="page">
      <PageHeader
        back={back}
        onBack={async () => {
          if (!(await confirmDiscard(draft.dirty))) return;
          await clearDraft(draftKey);
          goBack(back);
        }}
        title="Edit workout"
        actions={
          <button className="btn btn-primary btn-small" onClick={save}>
            Save
          </button>
        }
      />
      {stored && draft.dirty && <DraftBar onDiscard={draft.discard} />}
      <div className="form">
        <label className="field">
          <span>Name</span>
          <input value={w.title} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Started</span>
            <input
              type="datetime-local"
              value={toLocalInput(w.startTime)}
              onChange={(e) => {
                const start = new Date(e.target.value).getTime();
                if (Number.isNaN(start)) return;
                set({ startTime: start, endTime: start + minutes * 60000 });
              }}
            />
          </label>
          <label className="field field-narrow">
            <span>Minutes</span>
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
          <span>Notes</span>
          <textarea rows={2} value={w.description ?? ''} onChange={(e) => set({ description: e.target.value || undefined })} />
        </label>
      </div>
      <WorkoutEditor
        exercises={w.exercises}
        onChange={(fn) => draft.update((d) => ({ ...d, exercises: fn(d.exercises) }))}
        mode="edit"
        previousBefore={original.startTime}
        excludeWorkoutId={original.id}
      />
    </div>
  );
}
