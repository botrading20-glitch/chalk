import { useEffect, useRef } from 'react';
import { useNow } from '../lib/data';
import { fmtClock } from '../lib/format';
import { Link, useRoute } from '../lib/router';
import { useSettings } from '../lib/settings';
import { ringRest, startRestAlert, stopRestAlert } from '../lib/restAlert';
import { beep, buzz, tick } from '../lib/timer';
import { updateActive, useActiveWorkout } from '../lib/workouts';
import { IconBarbell, IconChart, IconHistory, IconList, IconTimer } from './Icons';
import { t } from '../i18n';
import type { Key } from '../i18n/catalog';

const TABS: { to: string; key: string; label: Key; icon: typeof IconBarbell }[] = [
  { to: '/', key: '', label: 'tab.workout', icon: IconBarbell },
  { to: '/history', key: 'history', label: 'tab.history', icon: IconHistory },
  { to: '/exercises', key: 'exercises', label: 'tab.exercises', icon: IconList },
  { to: '/profile', key: 'profile', label: 'tab.progress', icon: IconChart },
];

/** Fixed bottom stack: rest timer, "workout in progress" bar and tab bar. */
export function Dock({ showTabs, showBanner }: { showTabs: boolean; showBanner: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--dock-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="dock" ref={ref}>
      <RestTimer />
      {showBanner && <ActiveBanner />}
      {showTabs && <TabBar />}
    </div>
  );
}

function TabBar() {
  const { segments } = useRoute();
  const current = segments[0] ?? '';
  return (
    <nav className="tabbar" aria-label={t('nav.main')}>
      {TABS.map(({ to, key, label, icon: Icon }) => (
        <Link key={key} to={to} className={`tab ${current === key || (key === 'profile' && current === 'settings') ? 'on' : ''}`} aria-current={current === key ? 'page' : undefined}>
          <Icon size={22} />
          <span>{t(label)}</span>
        </Link>
      ))}
    </nav>
  );
}

function ActiveBanner() {
  const active = useActiveWorkout();
  const now = useNow(1000, !!active);
  if (!active) return null;
  return (
    <Link to="/workout" className="active-banner">
      <span className="pulse" aria-hidden="true" />
      <span className="active-banner-text">
        <strong>{active.title}</strong>
        <span>{t('banner.inProgress', { time: fmtClock((now - active.startTime) / 1000) })}</span>
      </span>
      <span className="active-banner-cta">{t('banner.resume')}</span>
    </Link>
  );
}

const adjustRest = (delta: number) =>
  updateActive((a) => {
    if (!a.restEndsAt) return a;
    const next = Math.max(Date.now() + 1000, a.restEndsAt + delta * 1000);
    return { ...a, restEndsAt: next, restTotal: Math.max(1, (a.restTotal ?? 0) + delta) };
  });

const skipRest = () => updateActive((a) => ({ ...a, restEndsAt: undefined, restTotal: undefined }));

function RestTimer() {
  const active = useActiveWorkout();
  const settings = useSettings();
  const endsAt = active?.restEndsAt;
  const now = useNow(250, !!endsAt);
  const fired = useRef<number | undefined>(undefined);
  const ticked = useRef('');
  const lockScreen = settings.timerSound && settings.timerLockScreen;
  const left = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;

  // The 3-2-1 countdown: one short tick as each of the last three seconds starts.
  useEffect(() => {
    if (!endsAt || !settings.restCountdown || !settings.timerSound || left < 1 || left > 3) return;
    const key = `${endsAt}:${left}`;
    if (ticked.current === key) return;
    ticked.current = key;
    tick();
  }, [endsAt, left, settings.restCountdown, settings.timerSound]);

  useEffect(() => {
    if (endsAt && lockScreen) startRestAlert(endsAt, { skip: skipRest, adjust: adjustRest });
    else stopRestAlert();
  }, [endsAt, lockScreen]);

  useEffect(() => {
    if (!endsAt || now < endsAt || fired.current === endsAt) return;
    fired.current = endsAt;
    // Skip the alert when the app was closed long past the end of the rest.
    if (now - endsAt < 5000) {
      // Whichever notices first, this or the alert's own timer, rings; the other is a no-op.
      if (settings.timerSound) {
        if (lockScreen) ringRest(endsAt);
        else beep();
      }
      if (settings.timerVibrate) buzz();
    }
    void updateActive((a) => (a.restEndsAt === endsAt ? { ...a, restEndsAt: undefined, restTotal: undefined } : a));
  }, [now, endsAt, settings.timerSound, settings.timerVibrate, lockScreen]);

  if (!active || !endsAt) return null;
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  if (remaining <= 0) return null;
  const total = Math.max(active.restTotal ?? remaining, remaining);
  const adjust = adjustRest;

  return (
    <div className="rest-bar" role="timer" aria-label={t('rest.timer', { time: fmtClock(remaining) })}>
      <div className="rest-progress" style={{ transform: `scaleX(${remaining / total})` }} />
      <IconTimer size={18} />
      <span className="rest-time">{fmtClock(remaining)}</span>
      <div className="rest-actions">
        <button onClick={() => adjust(-15)} aria-label={t('rest.less')}>
          −15
        </button>
        <button onClick={() => adjust(15)} aria-label={t('rest.more')}>
          +15
        </button>
        <button className="rest-skip" onClick={skipRest}>
          {t('common.skip')}
        </button>
      </div>
    </div>
  );
}
