import { useMemo } from 'react';
import { useData, useNow } from '../lib/data';
import { addDays, fmtWeekdayNarrow, startOfDay, startOfWeek } from '../lib/format';
import { Link } from '../lib/router';
import { useSettings } from '../lib/settings';
import { weekStreak } from '../lib/stats';
import { t } from '../i18n';

/** A progress bar with the split-S slant at both ends. */
export function SlantBar({ value, max, label, className = '' }: { value: number; max: number; label: string; className?: string }) {
  const pct = max > 0 ? Math.min(1, value / max) * 100 : 0;
  return (
    <div
      className={`slant-bar ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <span className="slant-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function greeting(now: number, name: string) {
  const h = new Date(now).getHours();
  const hello = t(h < 5 ? 'week.night' : h < 12 ? 'week.morning' : h < 18 ? 'week.afternoon' : 'week.evening');
  return name && h >= 5 ? t('week.hello', { greeting: hello, name }) : hello;
}

/** Home's hero: this week's workouts against the goal, the days trained and the streak. */
export function WeekCard() {
  const { workouts } = useData();
  const { profileName, weeklyGoal, weekStart } = useSettings();
  const now = useNow(60_000);
  const goal = weeklyGoal;

  const { days, trained, done, streak } = useMemo(() => {
    const first = startOfWeek(now);
    const thisWeek = workouts.filter((w) => startOfWeek(w.startTime) === first);
    return {
      days: Array.from({ length: 7 }, (_, i) => addDays(first, i)),
      trained: new Set(thisWeek.map((w) => startOfDay(w.startTime))),
      done: thisWeek.length,
      streak: weekStreak(workouts, now),
    };
    // weekStart moves the first day of the week, which startOfWeek reads from the shared format context.
  }, [workouts, now, weekStart]);

  const today = startOfDay(now);
  const met = goal > 0 && done >= goal;

  return (
    <section className={`card week-card ${met ? 'met' : ''}`} aria-label={t('week.title')}>
      <div className="week-top">
        <p className="week-greet">{greeting(now, profileName.trim())}</p>
        {streak > 0 && <span className="slant-chip">{t('week.streak', { n: streak })}</span>}
      </div>

      <div className="week-hero">
        <span className="week-num">{done}</span>
        {goal > 0 && <span className="week-of">{t('week.ofGoal', { goal })}</span>}
        <span className="week-label">{t('week.thisWeek', { n: goal > 0 ? goal : done })}</span>
      </div>

      {goal > 0 && <SlantBar value={done} max={goal} label={t('week.progressLabel', { done, goal })} />}

      <ol className="week-days" aria-hidden="true">
        {days.map((d) => (
          <li key={d} className={`week-day ${trained.has(d) ? 'on' : ''} ${d === today ? 'today' : ''}`}>
            <span className="week-dot" />
            <span>{fmtWeekdayNarrow(d)}</span>
          </li>
        ))}
      </ol>

      <p className="week-note">
        {goal > 0 ? (
          t(met ? 'week.goalMet' : 'week.toGo', { n: goal - done })
        ) : (
          <>
            {done === 0 && <span>{t('week.none')} </span>}
            <Link to="/settings" className="week-link">
              {t('week.noGoal')}
            </Link>
          </>
        )}
      </p>
    </section>
  );
}
