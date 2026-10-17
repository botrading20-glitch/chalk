import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { confirmDiscard, DraftBar } from '../components/DraftBar';
import { Empty, PageHeader } from '../components/ui';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { db } from '../db';
import { clearDraft, useDraft, useStoredDraft } from '../lib/drafts';
import { uid } from '../lib/format';
import { goBack, navigate } from '../lib/router';
import { saveRoutine } from '../lib/workouts';
import type { Routine, WorkoutExercise } from '../types';
import { t } from '../i18n';

interface RoutineDraft {
  title: string;
  notes: string;
  exercises: WorkoutExercise[];
}

/** `folder` files a new routine straight into that folder. */
export function RoutineEdit({ id, folder }: { id?: string; folder?: string }) {
  const existing = useLiveQuery(async () => (id ? ((await db.routines.get(id)) ?? null) : null), [id]);
  const draftKey = `routine:${id ?? 'new'}`;
  const stored = useStoredDraft<RoutineDraft>(draftKey);
  if (existing === undefined || stored === undefined) return null;
  if (id && !existing) {
    return (
      <div className="page">
        <PageHeader back="/" title={t('routineEdit.title')} />
        <Empty title={t('missing.routine')}>{t('missing.hint')}</Empty>
      </div>
    );
  }
  return <Editor key={draftKey} draftKey={draftKey} existing={existing} stored={stored} folder={folder} />;
}

function Editor({ draftKey, existing, stored, folder }: { draftKey: string; existing: Routine | null; stored: RoutineDraft | null; folder?: string }) {
  const draft = useDraft<RoutineDraft>(
    draftKey,
    { title: existing?.title ?? '', notes: existing?.notes ?? '', exercises: existing?.exercises ?? [] },
    stored,
  );
  const { title, notes, exercises } = draft.value;
  const set = (patch: Partial<RoutineDraft>) => draft.update((d) => ({ ...d, ...patch }));
  const [error, setError] = useState('');

  async function save() {
    if (!title.trim()) {
      setError(t('routineEdit.nameRequired'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await saveRoutine({
      id: existing?.id ?? uid(),
      title: title.trim(),
      notes: notes.trim() || undefined,
      exercises,
      ...(!existing && folder ? { folder } : {}),
    });
    await draft.clear();
    toast(existing ? t('routineEdit.saved') : t('routineEdit.created'));
    goBack('/');
  }

  return (
    <div className="page">
      <PageHeader
        back="/"
        onBack={async () => {
          if (!(await confirmDiscard(draft.dirty))) return;
          await clearDraft(draftKey);
          goBack('/');
        }}
        title={existing ? t('routineEdit.title') : t('routineEdit.new')}
        actions={
          <button className="btn btn-primary btn-small" onClick={save}>
            {t('common.save')}
          </button>
        }
      />
      {stored && draft.dirty && <DraftBar onDiscard={draft.discard} />}
      <div className="form">
        <label className="field">
          <span>{t('form.name')}</span>
          <input
            value={title}
            placeholder={t('routineEdit.namePlaceholder')}
            onChange={(e) => {
              set({ title: e.target.value });
              setError('');
            }}
            autoFocus={!existing && !stored}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <label className="field">
          <span>{t('common.notes')}</span>
          <textarea rows={2} value={notes} onChange={(e) => set({ notes: e.target.value })} placeholder={t('routineEdit.notesPlaceholder')} />
        </label>
      </div>
      <p className="muted small editor-hint">{t('routineEdit.hint')}</p>
      <WorkoutEditor exercises={exercises} onChange={(fn) => draft.update((d) => ({ ...d, exercises: fn(d.exercises) }))} mode="routine" routineId={existing?.id} />
      {existing && (
        <button
          className="btn btn-danger-ghost btn-block"
          onClick={async () => {
            const ok = await confirmDialog({
              title: t('home.deleteTitle', { title: existing.title }),
              message: t('home.deleteText'),
              confirmLabel: t('home.deleteRoutine'),
              danger: true,
            });
            if (!ok) return;
            await db.routines.delete(existing.id);
            await draft.clear();
            navigate('/', { replace: true });
          }}
        >
          {t('home.deleteRoutine')}
        </button>
      )}
    </div>
  );
}
