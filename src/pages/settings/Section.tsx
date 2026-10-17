import type { ReactElement } from 'react';
import { Empty, PageHeader } from '../../components/ui';
import { Link } from '../../lib/router';
import { t } from '../../i18n';
import type { Key } from '../../i18n/catalog';
import { AboutSection } from './AboutSection';
import { DataSection } from './DataSection';
import { WarmupSection } from './WarmupSection';
import {
  AccessSection,
  AppearanceSection,
  GoalsSection,
  LanguageSection,
  PlatesSection,
  SyncSection,
  TimerSection,
  UnitsSection,
  WorkoutSection,
} from './sections';

/** `#/settings/<id>`: the page for one row of the Settings home. */
const SECTIONS: Record<string, { title: Key; page: () => ReactElement }> = {
  workout: { title: 'set.workout', page: WorkoutSection },
  warmup: { title: 'set.warmup', page: WarmupSection },
  timer: { title: 'set.timer', page: TimerSection },
  plates: { title: 'set.plates', page: PlatesSection },
  goals: { title: 'set.goals', page: GoalsSection },
  units: { title: 'set.units', page: UnitsSection },
  appearance: { title: 'set.appearance', page: AppearanceSection },
  access: { title: 'set.access', page: AccessSection },
  language: { title: 'set.language', page: LanguageSection },
  sync: { title: 'set.sync', page: SyncSection },
  data: { title: 'set.data', page: DataSection },
  about: { title: 'set.about', page: AboutSection },
};

export function SettingsSection({ id }: { id: string }) {
  const section = SECTIONS[id];
  if (!section) {
    return (
      <div className="page">
        <PageHeader back="/settings" title={t('set.title')} />
        <Empty
          title={t('notFound.title')}
          action={
            <Link to="/settings" className="btn btn-primary">
              {t('set.title')}
            </Link>
          }
        />
      </div>
    );
  }
  const Page = section.page;
  return (
    <div className="page">
      <PageHeader back="/settings" title={t(section.title)} />
      <Page />
    </div>
  );
}
