import { useEffect, useRef } from 'react';
import { useNow } from '../lib/data';
import { fmtClock } from '../lib/format';
import { Link, useRoute } from '../lib/router';
import { useSettings } from '../lib/settings';
import { beep, buzz } from '../lib/timer';
import { updateActive, useActiveWorkout } from '../lib/workouts';
import { IconBarbell, IconChart, IconHistory, IconList, IconTimer } from './Icons';

const TABS = [
  { to: '/', key: '', label: 'Workout', icon: IconBarbell },
  { to: '/history', key: 'history', label: 'History', icon: IconHistory },
  { to: '/exercises', key: 'exercises', label: 'Exercises', icon: IconList },
  { to: '/profile', key: 'profile', label: 'Progress', icon: IconChart },
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
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, key, label, icon: Icon }) => (
        <Link key={key} to={to} className={`tab ${current === key || (key === 'profile' && current === 'settings') ? 'on' : ''}`} aria-current={current === key ? 'page' : undefined}>
          <Icon size={22} />
          <span>{label}</span>
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
        <span>In progress · {fmtClock((now - active.startTime) / 1000)}</span>
      </span>
      <span className="active-banner-cta">Resume</span>
    </Link>
  );
}

function RestTimer() {
  const active = useActiveWorkout();
  const settings = useSettings();
  const endsAt = active?.restEndsAt;
  const now = useNow(250, !!endsAt);
  const fired = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!endsAt || now < endsAt || fired.current === endsAt) return;
    fired.current = endsAt;
    // Skip the alert when the app was closed long past the end of the rest.
    if (now - endsAt < 5000) {
      if (settings.timerSound) beep();
      if (settings.timerVibrate) buzz();
    }
    void updateActive((a) => (a.restEndsAt === endsAt ? { ...a, restEndsAt: undefined, restTotal: undefined } : a));
  }, [now, endsAt, settings.timerSound, settings.timerVibrate]);

  if (!active || !endsAt) return null;
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  if (remaining <= 0) return null;
  const total = Math.max(active.restTotal ?? remaining, remaining);

  const adjust = (delta: number) =>
    updateActive((a) => {
      if (!a.restEndsAt) return a;
      const next = Math.max(Date.now() + 1000, a.restEndsAt + delta * 1000);
      return { ...a, restEndsAt: next, restTotal: Math.max(1, (a.restTotal ?? 0) + delta) };
    });

  return (
    <div className="rest-bar" role="timer" aria-label={`Rest: ${fmtClock(remaining)} left`}>
      <div className="rest-progress" style={{ transform: `scaleX(${remaining / total})` }} />
      <IconTimer size={18} />
      <span className="rest-time">{fmtClock(remaining)}</span>
      <div className="rest-actions">
        <button onClick={() => adjust(-15)} aria-label="15 seconds less">
          −15
        </button>
        <button onClick={() => adjust(15)} aria-label="15 seconds more">
          +15
        </button>
        <button className="rest-skip" onClick={() => updateActive((a) => ({ ...a, restEndsAt: undefined, restTotal: undefined }))}>
          Skip
        </button>
      </div>
    </div>
  );
}
