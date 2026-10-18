import type { ReactNode } from 'react';
import { BrandMark } from '../../components/Brand';
import {
  IconAccessibility,
  IconBarbell,
  IconChevron,
  IconCloud,
  IconDatabase,
  IconFlame,
  IconGlobe,
  IconHelp,
  IconInfo,
  IconList,
  IconPalette,
  IconPlate,
  IconPlay,
  IconRuler,
  IconTimer,
  IconTrophy,
} from '../../components/Icons';
import { InstallSettings } from '../../components/InstallPrompt';
import { PageHeader } from '../../components/ui';
import { useNow } from '../../lib/data';
import { fmtDate, fmtRest, startOfDay } from '../../lib/format';
import { usePref } from '../../lib/prefs';
import { Link } from '../../lib/router';
import { warmupSummary } from './WarmupSection';
import { useSettings } from '../../lib/settings';
import { useSyncStatus } from '../../lib/sync';
import { LOCALES } from '../../i18n/locales';
import { resolveLanguage, t } from '../../i18n';
import type { Key } from '../../i18n/catalog';
import type { Settings } from '../../types';

interface Row {
  id: string;
  icon: ReactNode;
  label: Key;
  value: string;
}

const languageName = (code: string) => LOCALES.find((l) => l.code === code)?.name ?? code;

/** The one-line summary under each row, so the list shows how things are set without opening it. */
/** "Backed up 3 days ago", then a date once it is a week or more. */
export function backupSummary(ts: number, now: number) {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days <= 0) return t('set.sum.backedUpToday');
  if (days === 1) return t('set.sum.backedUpYesterday');
  if (days < 7) return t('set.sum.backedUpDays', { n: days });
  return t('set.sum.backedUpOn', { date: fmtDate(ts) });
}

function useSummaries(s: Settings) {
  const sync = useSyncStatus();
  const lastBackupAt = usePref('lastBackupAt');
  const now = useNow(60_000);

  const alert = s.timerSound ? t('set.sum.alertOn', { sound: t(`set.sound.${s.restSound}` as Key) }) : t('set.sum.alertOff');
  const language = s.language === 'auto' ? t('set.sum.auto', { name: languageName(resolveLanguage('auto')) }) : languageName(s.language);

  return {
    workout: s.defaultRest ? t('set.sum.rest', { rest: fmtRest(s.defaultRest) }) : t('set.sum.restOff'),
    warmup: warmupSummary(s),
    timer: alert,
    plates: t('set.sum.plates', { n: (s.weightUnit === 'kg' ? s.platesKg : s.platesLbs).length }),
    goals: s.weeklyGoal ? t('set.sum.goal', { n: s.weeklyGoal }) : t('set.sum.noGoal'),
    units: t('set.sum.units', { weight: t(`common.${s.weightUnit}` as Key), distance: t(`common.${s.distanceUnit}` as Key) }),
    appearance: t('set.sum.look', {
      theme: t(`set.theme.${s.theme}` as Key),
      accent: t(`set.accent.${s.accent}` as Key),
    }),
    access: t('set.sum.text', { size: t(`set.size.${s.textSize}` as Key) }),
    language,
    sync: sync.phase === 'off' ? t('set.sum.syncOff') : sync.phase === 'error' ? t('sync.pillAttention') : t('sync.pillOn'),
    data: lastBackupAt ? backupSummary(lastBackupAt, now) : lastBackupAt === 0 ? t('set.sum.neverBackedUp') : '',
    guide: t('set.sum.guide'),
    routines: t('set.sum.routines'),
    faq: t('set.sum.faq'),
    about: t('set.sum.version', { version: __APP_VERSION__ }),
  };
}

export function SettingsHome() {
  const s = useSettings();
  const sum = useSummaries(s);

  const groups: { title: Key; rows: Row[] }[] = [
    {
      title: 'set.group.training',
      rows: [
        { id: 'workout', icon: <IconBarbell size={20} />, label: 'set.workout', value: sum.workout },
        { id: 'warmup', icon: <IconFlame size={20} />, label: 'set.warmup', value: sum.warmup },
        { id: 'timer', icon: <IconTimer size={20} />, label: 'set.timer', value: sum.timer },
        { id: 'plates', icon: <IconPlate size={20} />, label: 'set.plates', value: sum.plates },
      ],
    },
    {
      title: 'set.group.you',
      rows: [
        { id: 'goals', icon: <IconTrophy size={20} />, label: 'set.goals', value: sum.goals },
        { id: 'units', icon: <IconRuler size={20} />, label: 'set.units', value: sum.units },
      ],
    },
    {
      title: 'set.group.look',
      rows: [
        { id: 'appearance', icon: <IconPalette size={20} />, label: 'set.appearance', value: sum.appearance },
        { id: 'access', icon: <IconAccessibility size={20} />, label: 'set.access', value: sum.access },
        { id: 'language', icon: <IconGlobe size={20} />, label: 'set.language', value: sum.language },
      ],
    },
    {
      title: 'set.group.data',
      rows: [
        { id: 'sync', icon: <IconCloud size={20} />, label: 'set.sync', value: sum.sync },
        { id: 'data', icon: <IconDatabase size={20} />, label: 'set.data', value: sum.data },
      ],
    },
    {
      title: 'set.group.help',
      rows: [
        { id: 'guide', icon: <IconPlay size={20} />, label: 'set.guide', value: sum.guide },
        { id: 'routines', icon: <IconList size={20} />, label: 'home.routines', value: sum.routines },
        { id: 'faq', icon: <IconHelp size={20} />, label: 'set.faq', value: sum.faq },
      ],
    },
    {
      title: 'set.group.about',
      rows: [{ id: 'about', icon: <IconInfo size={20} />, label: 'set.about', value: sum.about }],
    },
  ];

  return (
    <div className="page">
      <PageHeader back="/profile" title={t('set.title')} />
      <InstallSettings />

      {groups.map((g) => (
        <section key={g.title} className="srow-group" aria-label={t(g.title)}>
          <h2 className="srow-title">{t(g.title)}</h2>
          <ul className="srow-card">
            {g.rows.map((r) => (
              <li key={r.id}>
                <Link to={`/settings/${r.id}`} className="srow">
                  <span className="srow-icon">{r.icon}</span>
                  <span className="srow-text">
                    <span className="srow-label">{t(r.label)}</span>
                    <span className="srow-value">{r.value}</span>
                  </span>
                  <IconChevron className="srow-chevron flip-rtl" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="srow-foot">
        <BrandMark width={18} height={20} className="srow-foot-mark" />
        <span>
          {t('app.name')} · {t('app.tagline')}
        </span>
      </p>
    </div>
  );
}
