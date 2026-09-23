import { useEffect } from 'react';
import { DialogHost } from './components/dialogs';
import { Dock } from './components/Dock';
import { useData } from './lib/data';
import { useRoute } from './lib/router';
import { useSettings } from './lib/settings';
import { ActiveWorkoutPage } from './pages/ActiveWorkout';
import { EditWorkout } from './pages/EditWorkout';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { ExerciseEdit } from './pages/ExerciseEdit';
import { Exercises } from './pages/Exercises';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { RoutineEdit } from './pages/RoutineEdit';
import { SettingsPage } from './pages/Settings';
import { WorkoutDetail } from './pages/WorkoutDetail';
import { WorkoutHome } from './pages/WorkoutHome';
import { Empty } from './components/ui';
import { Link } from './lib/router';

function useTheme() {
  const { theme } = useSettings();
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#f3f4f6' : '#16181b');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}

export function App() {
  useTheme();
  const { ready } = useData();
  const { path, segments, query } = useRoute();
  const [s0, s1, s2] = segments;

  let page;
  switch (s0) {
    case undefined:
      page = <WorkoutHome />;
      break;
    case 'workout':
      page = <ActiveWorkoutPage />;
      break;
    case 'history':
      page = !s1 ? <History /> : s2 === 'edit' ? <EditWorkout id={s1} /> : <WorkoutDetail id={s1} justSaved={query.has('saved')} />;
      break;
    case 'exercises':
      page = !s1 ? (
        <Exercises />
      ) : s1 === 'new' ? (
        <ExerciseEdit />
      ) : s2 === 'edit' ? (
        <ExerciseEdit id={s1} />
      ) : (
        <ExerciseDetail id={s1} />
      );
      break;
    case 'routines':
      page = <RoutineEdit id={s1 === 'new' ? undefined : s1} />;
      break;
    case 'profile':
      page = <Profile />;
      break;
    case 'settings':
      page = <SettingsPage />;
      break;
    default:
      page = (
        <div className="page">
          <Empty title="Page not found" action={<Link to="/" className="btn btn-primary">Go to Workout</Link>} />
        </div>
      );
  }

  // Editing screens get the full height; the tab bar would only invite losing changes.
  const focused = s0 === 'workout' || s0 === 'routines' || s2 === 'edit' || s1 === 'new';

  return (
    <div className="app">
      <main key={path}>{ready ? page : null}</main>
      <Dock showTabs={!focused} showBanner={s0 !== 'workout'} />
      <DialogHost />
    </div>
  );
}
