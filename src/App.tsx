import { lazy, Suspense } from 'react';
import { DialogHost } from './components/dialogs';
import { t } from './i18n';
import { Dock } from './components/Dock';
import { WhatsNewSheet } from './components/WhatsNew';
import { WidePanel } from './components/WidePanel';
import { useData } from './lib/data';
import { useLaunchAction } from './lib/launch';
import { useRoute } from './lib/router';
import { useAppearance, useFormatKey } from './lib/appearance';
import { ActiveWorkoutPage } from './pages/ActiveWorkout';
import { BodyWeightPage } from './pages/BodyWeight';
import { EditWorkout, NewWorkout } from './pages/EditWorkout';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { ExerciseEdit } from './pages/ExerciseEdit';
import { Exercises } from './pages/Exercises';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { RoutineEdit } from './pages/RoutineEdit';
import { WorkoutDetail } from './pages/WorkoutDetail';
import { WorkoutHome } from './pages/WorkoutHome';
import { Empty } from './components/ui';
import { Link } from './lib/router';

// Settings is rarely open and brings the import, sync and data-check code with it, so it loads on demand
// (the service worker precaches the chunk, so it still works offline).
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })));
// The welcome screen and the starter programs (with their exercise lists) are the same kind of rarely-used code.
const WelcomePage = lazy(() => import('./pages/Welcome').then((m) => ({ default: m.WelcomePage })));
const ProgramsPage = lazy(() => import('./pages/Programs').then((m) => ({ default: m.ProgramsPage })));
// The monthly report is read once a month, so it loads on demand too.
const ReportPage = lazy(() => import('./pages/Report').then((m) => ({ default: m.ReportPage })));

export function App() {
  useAppearance();
  useLaunchAction();
  const formatKey = useFormatKey();
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
      page = !s1 ? (
        <History />
      ) : s1 === 'new' ? (
        <NewWorkout />
      ) : s2 === 'edit' ? (
        <EditWorkout id={s1} />
      ) : (
        <WorkoutDetail id={s1} justSaved={query.has('saved')} />
      );
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
      page = <RoutineEdit id={s1 === 'new' ? undefined : s1} folder={query.get('folder') ?? undefined} />;
      break;
    case 'programs':
      page = <ProgramsPage />;
      break;
    case 'welcome':
      page = <WelcomePage />;
      break;
    case 'profile':
      page = s1 === 'bodyweight' ? <BodyWeightPage /> : s1 === 'report' ? <ReportPage month={s2} /> : <Profile />;
      break;
    case 'settings':
      page = <SettingsPage section={s1} />;
      break;
    default:
      page = (
        <div className="page">
          <Empty title={t('notFound.title')} action={<Link to="/" className="btn btn-primary">{t('notFound.action')}</Link>} />
        </div>
      );
  }

  // Editing screens get the full height; the tab bar would only invite losing changes.
  const focused = s0 === 'workout' || s0 === 'routines' || s0 === 'welcome' || s2 === 'edit' || s1 === 'new';

  return (
    <div className="app" key={formatKey}>
      <main key={path}>{ready ? <Suspense fallback={null}>{page}</Suspense> : null}</main>
      <Dock showTabs={!focused} showBanner={s0 !== 'workout'} />
      <WidePanel />
      <WhatsNewSheet />
      <DialogHost />
    </div>
  );
}
