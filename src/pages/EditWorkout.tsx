import { useState } from 'react';
import { toast } from '../components/dialogs';
import { Empty, PageHeader } from '../components/ui';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { db } from '../db';
import { useData } from '../lib/data';
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
  if (!original) {
    return (
      <div className="page">
        <PageHeader back="/history" title="Edit workout" />
        <Empty title="This workout doesn't exist">It may have been deleted.</Empty>
      </div>
    );
  }
  return <Editor original={original} />;
}

function Editor({ original }: { original: Workout }) {
  const [draft, setDraft] = useState<ActiveWorkout>(() => ({
    id: original.id,
    editingId: original.id,
    title: original.title,
    description: original.description,
    startTime: original.startTime,
    endTime: original.endTime,
    exercises: original.exercises,
    routineId: original.routineId,
  }));
  const minutes = Math.round(((draft.endTime ?? draft.startTime) - draft.startTime) / 60000);

  async function save() {
    // Without checkboxes in edit mode, any set with numbers in it counts as done.
    const workout = workoutFromDraft(
      { ...draft, exercises: draft.exercises.map((we) => ({ ...we, sets: we.sets.map((s) => ({ ...s, completed: hasValues(s) })) })) },
      false,
    );
    await db.workouts.put(workout);
    toast('Workout updated');
    goBack(`/history/${original.id}`);
  }

  return (
    <div className="page">
      <PageHeader
        back={`/history/${original.id}`}
        title="Edit workout"
        actions={
          <button className="btn btn-primary btn-small" onClick={save}>
            Save
          </button>
        }
      />
      <div className="form">
        <label className="field">
          <span>Name</span>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Started</span>
            <input
              type="datetime-local"
              value={toLocalInput(draft.startTime)}
              onChange={(e) => {
                const start = new Date(e.target.value).getTime();
                if (Number.isNaN(start)) return;
                setDraft({ ...draft, startTime: start, endTime: start + minutes * 60000 });
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
              onChange={(e) => setDraft({ ...draft, endTime: draft.startTime + Math.max(1, Number(e.target.value) || 0) * 60000 })}
            />
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea rows={2} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>
      </div>
      <WorkoutEditor
        exercises={draft.exercises}
        onChange={(fn) => setDraft((d) => ({ ...d, exercises: fn(d.exercises) }))}
        mode="edit"
        previousBefore={original.startTime}
        excludeWorkoutId={original.id}
      />
    </div>
  );
}
