import { useEffect } from 'react';
import { useData } from './data';
import { navigate, useRoute } from './router';
import { getActive, startWorkout } from './workouts';

/**
 * Home-screen shortcuts (the manifest's `shortcuts`) open the app at `#/?action=<name>`:
 * - `start`: begin an empty workout, or go back to the one already running;
 * - `weigh`: open the body-weight screen with its weigh-in sheet ready.
 * Anything else just drops the query, so a stale or mistyped link lands on Home.
 */
export async function runLaunchAction(action: string) {
  if (action === 'start') {
    if (!(await getActive())) await startWorkout();
    navigate('/workout', { replace: true });
  } else if (action === 'weigh') {
    navigate('/profile/bodyweight?log=1', { replace: true });
  } else {
    navigate('/', { replace: true });
  }
}

export function useLaunchAction() {
  const { ready } = useData();
  const { path, query } = useRoute();
  const action = path === '/' ? query.get('action') : null;
  useEffect(() => {
    if (ready && action) void runLaunchAction(action);
  }, [ready, action]);
}
