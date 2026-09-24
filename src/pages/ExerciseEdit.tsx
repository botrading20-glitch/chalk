import { toast } from '../components/dialogs';
import { ExerciseForm } from '../components/ExerciseForm';
import { Empty, PageHeader } from '../components/ui';
import { useData } from '../lib/data';
import { reassignExercise } from '../lib/exercises';
import { goBack, navigate } from '../lib/router';

export function ExerciseEdit({ id }: { id?: string }) {
  const { exerciseMap, exercises } = useData();
  const ex = id ? exerciseMap.get(id) : undefined;
  const back = id ? `/exercises/${id}` : '/exercises';

  if (id && !ex) {
    return (
      <div className="page">
        <PageHeader back="/exercises" title="Edit exercise" />
        <Empty title="This exercise doesn't exist">It may have been deleted.</Empty>
      </div>
    );
  }

  // Library exercises are shared, so editing one saves the user's own version
  // and moves their history onto it.
  if (ex?.source === 'library') {
    const mine = exercises.find((e) => e.replaces === ex.id);
    return (
      <div className="page">
        <PageHeader back={back} title="Edit exercise" />
        {mine ? (
          <Empty title="You already have your own version" action={<button className="btn btn-primary" onClick={() => navigate(`/exercises/${mine.id}/edit`, { replace: true })}>Edit {mine.name}</button>} />
        ) : (
          <>
            <p className="muted small">
              Chalk saves this as your own version. Your past workouts and routines switch to it, and the original leaves the exercise
              list. You can go back to the original at any time.
            </p>
            <ExerciseForm
              copyOf={ex}
              onSaved={async (mineNow) => {
                await reassignExercise(ex.id, mineNow.id);
                toast('Saved as your own version');
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
      <PageHeader back={back} title={id ? 'Edit exercise' : 'New exercise'} />
      <ExerciseForm initial={ex} onSaved={(e) => navigate(`/exercises/${e.id}`, { replace: true })} onCancel={() => goBack(back)} />
    </div>
  );
}
