import { useMemo, useState } from 'react';
import { BodyWeightCard } from '../components/BodyWeight';
import { BarChart, HBars } from '../components/Charts';
import { useUsageCounts } from '../components/ExerciseList';
import { IconSettings } from '../components/Icons';
import { Empty, ExerciseAvatar, PageHeader, Segmented, Stat } from '../components/ui';
import { useData } from '../lib/data';
import { addDays, fmtDate, fmtDuration, fmtNum, kgTo, plural, startOfDay, startOfWeek } from '../lib/format';
import { MUSCLE_LABEL } from '../lib/meta';
import { Link } from '../lib/router';
import { useSettings } from '../lib/settings';
import { weekStreak, weeklyBuckets, type WeekBucket } from '../lib/stats';
import type { Muscle } from '../types';

type WeekMetric = 'duration' | 'volume' | 'sets';
const WEEKS = 12;
const CAL_WEEKS = 17;

const tickFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export function Profile() {
  const { workouts, typeOf, exerciseMap } = useData();
  const settings = useSettings();
  const usage = useUsageCounts();
  const [metric, setMetric] = useState<WeekMetric>('duration');

  const buckets = useMemo(() => weeklyBuckets(workouts, typeOf, WEEKS), [workouts, typeOf]);
  const streak = useMemo(() => weekStreak(workouts), [workouts]);
  const totalSeconds = useMemo(() => workouts.reduce((n, w) => n + (w.endTime - w.startTime) / 1000, 0), [workouts]);

  const muscleRows = useMemo(() => {
    const since = Date.now() - 30 * 86_400_000;
    const counts = new Map<Muscle, number>();
    for (const w of workouts) {
      if (w.startTime < since) break;
      for (const we of w.exercises) {
        const m = exerciseMap.get(we.exerciseId)?.primaryMuscle ?? 'other';
        counts.set(m, (counts.get(m) ?? 0) + we.sets.filter((s) => s.type !== 'warmup').length);
      }
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const rows = sorted.slice(0, 8).map(([m, v]) => ({ label: MUSCLE_LABEL[m], value: v }));
    const rest = sorted.slice(8).reduce((n, [, v]) => n + v, 0);
    if (rest) rows.push({ label: 'Everything else', value: rest });
    return rows;
  }, [workouts, exerciseMap]);

  const top = useMemo(
    () =>
      [...usage.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ exercise: exerciseMap.get(id), id, count })),
    [usage, exerciseMap],
  );

  if (workouts.length === 0) {
    return (
      <div className="page">
        <PageHeader large title="Progress" actions={<SettingsLink />} />
        <Empty
          title="Your progress shows up here"
          action={
            <Link to="/settings" className="btn btn-secondary">
              Import workouts from Hevy
            </Link>
          }
        >
          Weekly training time, volume, muscle split and consistency — all from the workouts you log.
        </Empty>
        <BodyWeightCard />
      </div>
    );
  }

  const value = (b: WeekBucket) =>
    metric === 'duration' ? b.duration / 3600 : metric === 'volume' ? kgTo(b.volume, settings.weightUnit) : b.sets;
  const format = (v: number) =>
    metric === 'duration'
      ? fmtDuration(v * 3600)
      : metric === 'volume'
        ? `${fmtNum(Math.round(v), 0)} ${settings.weightUnit}`
        : plural(Math.round(v), 'set');
  const titles: Record<WeekMetric, string> = {
    duration: 'Training time per week (hours)',
    volume: `Volume per week (${settings.weightUnit})`,
    sets: 'Sets per week',
  };
  const thisWeek = buckets.at(-1)!;

  return (
    <div className="page">
      <PageHeader large title="Progress" actions={<SettingsLink />} />

      <div className="stat-grid">
        <Stat label="Workouts" value={fmtNum(workouts.length, 0)} />
        <Stat label="This week" value={fmtNum(thisWeek.workouts, 0)} />
        <Stat label="Week streak" value={fmtNum(streak, 0)} />
        <Stat label="Time trained" value={`${fmtNum(Math.round(totalSeconds / 3600), 0)} h`} />
      </div>

      <BodyWeightCard />

      <section className="card chart-card">
        <h2 className="card-title">{titles[metric]}</h2>
        <BarChart
          data={buckets.map((b) => ({
            tick: tickFmt.format(b.start),
            label: `Week of ${fmtDate(b.start)}`,
            value: value(b),
          }))}
          format={format}
          caption={titles[metric]}
        />
        <Segmented
          label="Weekly metric"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'duration', label: 'Time' },
            { value: 'volume', label: 'Volume' },
            { value: 'sets', label: 'Sets' },
          ]}
        />
      </section>

      <section className="card">
        <h2 className="card-title">Consistency · last {CAL_WEEKS} weeks</h2>
        <Calendar />
      </section>

      <section className="card">
        <h2 className="card-title">Working sets per muscle · last 30 days</h2>
        {muscleRows.length ? (
          <HBars rows={muscleRows} format={(v) => fmtNum(v, 0)} />
        ) : (
          <p className="muted">No workouts in the last 30 days.</p>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Most logged exercises</h2>
        <ul className="top-list">
          {top.map(({ exercise, id, count }) => (
            <li key={id}>
              <Link to={`/exercises/${id}`} className="top-row">
                <ExerciseAvatar exercise={exercise} size={36} />
                <span className="ex-row-name">{exercise?.name ?? 'Deleted exercise'}</span>
                <span className="muted tabular">{plural(count, 'session')}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SettingsLink() {
  return (
    <Link to="/settings" className="icon-btn" aria-label="Settings">
      <IconSettings />
    </Link>
  );
}

const DAY_NAMES = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'short' });
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

function Calendar() {
  const { workouts } = useData();
  const days = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const w of workouts) {
      const d = startOfDay(w.startTime);
      map.set(d, [...(map.get(d) ?? []), w.title]);
    }
    return map;
  }, [workouts]);

  const today = startOfDay(Date.now());
  const first = addDays(startOfWeek(today), -7 * (CAL_WEEKS - 1));
  const weeks = Array.from({ length: CAL_WEEKS }, (_, i) => addDays(first, i * 7));
  const trained = weeks.reduce((n, wk) => n + Array.from({ length: 7 }, (_, d) => days.has(addDays(wk, d))).filter(Boolean).length, 0);

  return (
    <div className="calendar" role="img" aria-label={`${plural(trained, 'training day')} in the last ${CAL_WEEKS} weeks`}>
      <div className="cal-months" style={{ gridTemplateColumns: `repeat(${CAL_WEEKS}, 1fr)` }}>
        {weeks.map((wk, i) => {
          const prev = i ? new Date(weeks[i - 1]).getMonth() : -1;
          return <span key={wk}>{new Date(wk).getMonth() !== prev ? monthFmt.format(wk) : ''}</span>;
        })}
      </div>
      <div className="cal-body">
        <div className="cal-days">
          {DAY_NAMES.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="cal-grid" style={{ gridTemplateColumns: `repeat(${CAL_WEEKS}, 1fr)` }}>
          {weeks.map((wk) => (
            <div key={wk} className="cal-week">
              {Array.from({ length: 7 }, (_, d) => {
                const day = addDays(wk, d);
                const titles = days.get(day);
                const future = day > today;
                return (
                  <span
                    key={d}
                    className={`cal-cell ${titles ? 'on' : ''} ${day === today ? 'today' : ''} ${future ? 'future' : ''}`}
                    title={`${dayFmt.format(day)}${titles ? ` — ${titles.join(', ')}` : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="muted small cal-foot">{plural(trained, 'training day')} · filled squares are days you trained</p>
    </div>
  );
}
