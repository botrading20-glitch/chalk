import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { Empty, PageHeader } from '../components/ui';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { db } from '../db';
import { uid } from '../lib/format';
import { goBack, navigate } from '../lib/router';
import { saveRoutine } from '../lib/workouts';
import type { Routine } from '../types';

export function RoutineEdit({ id }: { id?: string }) {
  const existing = useLiveQuery(async () => (id ? ((await db.routines.get(id)) ?? null) : null), [id]);
  if (existing === undefined) return null;
  if (id && !existing) {
    return (
      <div className="page">
        <PageHeader back="/" title="Routine" />
        <Empty title="This routine doesn't exist">It may have been deleted.</Empty>
      </div>
    );
  }
  return <Editor key={id ?? 'new'} existing={existing} />;
}

function Editor({ existing }: { existing: Routine | null }) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [exercises, setExercises] = useState(existing?.exercises ?? []);
  const [error, setError] = useState('');

  async function save() {
    if (!title.trim()) {
      setError('Name the routine, e.g. "Push day".');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await saveRoutine({ id: existing?.id ?? uid(), title: title.trim(), notes: notes.trim() || undefined, exercises });
    toast(existing ? 'Routine saved' : 'Routine created');
    goBack('/');
  }

  return (
    <div className="page">
      <PageHeader
        back="/"
        title={existing ? 'Edit routine' : 'New routine'}
        actions={
          <button className="btn btn-primary btn-small" onClick={save}>
            Save
          </button>
        }
      />
      <div className="form">
        <label className="field">
          <span>Name</span>
          <input
            value={title}
            placeholder="e.g. Push day"
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            autoFocus={!existing}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <label className="field">
          <span>Notes</span>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </label>
      </div>
      <p className="muted small editor-hint">Numbers you enter here are pre-filled when you start the routine.</p>
      <WorkoutEditor exercises={exercises} onChange={(fn) => setExercises((list) => fn(list))} mode="routine" />
      {existing && (
        <button
          className="btn btn-danger-ghost btn-block"
          onClick={async () => {
            const ok = await confirmDialog({
              title: `Delete "${existing.title}"?`,
              message: 'Workouts you logged with it stay in your history.',
              confirmLabel: 'Delete routine',
              danger: true,
            });
            if (!ok) return;
            await db.routines.delete(existing.id);
            navigate('/', { replace: true });
          }}
        >
          Delete routine
        </button>
      )}
    </div>
  );
}
