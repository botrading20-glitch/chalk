import { ExerciseForm } from '../components/ExerciseForm';
import { Empty, PageHeader } from '../components/ui';
import { useData } from '../lib/data';
import { goBack, navigate } from '../lib/router';

export function ExerciseEdit({ id }: { id?: string }) {
  const { exerciseMap } = useData();
  const ex = id ? exerciseMap.get(id) : undefined;
  const back = id ? `/exercises/${id}` : '/exercises';

  if (id && ex?.source !== 'custom') {
    return (
      <div className="page">
        <PageHeader back={back} title="Edit exercise" />
        <Empty title="Library exercises can't be edited">Create your own version with the name and muscles you want.</Empty>
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
