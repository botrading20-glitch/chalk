import { toast } from '../components/dialogs';
import { ExerciseForm } from '../components/ExerciseForm';
import { Empty, PageHeader } from '../components/ui';
import { useData } from '../lib/data';
import { reassignExercise } from '../lib/exercises';
import { goBack, navigate } from '../lib/router';
import { t } from '../i18n';

export function ExerciseEdit({ id }: { id?: string }) {
  const { exerciseMap, exercises } = useData();
  const ex = id ? exerciseMap.get(id) : undefined;
  const back = id ? `/exercises/${id}` : '/exercises';

  if (id && !ex) {
    return (
      <div className="page">
        <PageHeader back="/exercises" title={t('exerciseEdit.title')} />
        <Empty title={t('missing.exercise')}>{t('missing.hint')}</Empty>
      </div>
    );
  }

  // Library exercises are shared, so editing one saves the user's own version
  // and moves their history onto it.
  if (ex?.source === 'library') {
    const mine = exercises.find((e) => e.replaces === ex.id);
    return (
      <div className="page">
        <PageHeader back={back} title={t('exerciseEdit.title')} />
        {mine ? (
          <Empty title={t('exerciseEdit.haveMine')} action={<button className="btn btn-primary" onClick={() => navigate(`/exercises/${mine.id}/edit`, { replace: true })}>{t('exerciseEdit.editMine', { name: mine.name })}</button>} />
        ) : (
          <>
            <p className="muted small">
              {t('exerciseEdit.copyNote')}
            </p>
            <ExerciseForm
              copyOf={ex}
              onSaved={async (mineNow) => {
                await reassignExercise(ex.id, mineNow.id);
                toast(t('exerciseEdit.saved'));
                navigate(`/exercises/${mineNow.id}`, { replace: true });
              }}
              onCancel={() => goBack(back)}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader back={back} title={id ? t('exerciseEdit.title') : t('exerciseEdit.new')} />
      <ExerciseForm initial={ex} onSaved={(e) => navigate(`/exercises/${e.id}`, { replace: true })} onCancel={() => goBack(back)} />
    </div>
  );
}
