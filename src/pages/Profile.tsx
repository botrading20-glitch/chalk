import { useMemo, useState } from 'react';
import { BodyWeightCard } from '../components/BodyWeight';
import { BarChart, HBars } from '../components/Charts';
import { useUsageCounts } from '../components/ExerciseList';
import { IconSettings, IconTrophy } from '../components/Icons';
import { MuscleMap } from '../components/MuscleMap';
import { Empty, ExerciseAvatar, PageHeader, Segmented, Stat } from '../components/ui';
import { useData } from '../lib/data';
import { addDays, fmtDate, fmtDayMonth, fmtDuration, fmtMonthShort, fmtNum, fmtRelativeDay, fmtWeekdayDate, fmtWeekdayShort, isolate, kgTo, startOfDay, startOfWeek } from '../lib/format';
import { mergeMuscleSets, muscleSets } from '../lib/muscles';
import { recentRecords } from '../lib/records';
import { recordFormat } from '../lib/recordFormat';
import { MUSCLE_LABEL } from '../lib/meta';
import { Link } from '../lib/router';
import { useSettings } from '../lib/settings';
import { RECORD_LABEL, weekStreak, weeklyBuckets, workoutSets, type WeekBucket } from '../lib/stats';
import type { Muscle } from '../types';
import { count as count_, t } from '../i18n';

type WeekMetric = 'duration' | 'volume' | 'sets';
const WEEKS = 12;
const CAL_WEEKS = 17;

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
    if (rest) rows.push({ label: t('progress.everythingElse'), value: rest });
    return rows;
  }, [workouts, exerciseMap]);

  // The same 30 days as the bars, for the figure: a helper muscle counts half a set.
  const muscleTotals = useMemo(() => {
    const since = Date.now() - 30 * 86_400_000;
    return mergeMuscleSets(workouts.filter((w) => w.startTime >= since).map((w) => muscleSets(w.exercises, exerciseMap)));
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
        <PageHeader large title={t('tab.progress')} actions={<SettingsLink />} />
        <Empty
          title={t('progress.emptyTitle')}
          action={
            <Link to="/settings" className="btn btn-secondary">
              {t('import.workouts')}
            </Link>
          }
        >
          {t('progress.emptyText')}
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
        ? isolate(`${fmtNum(Math.round(v), 0)} ${settings.weightUnit}`)
        : count_('set', Math.round(v));
  const titles: Record<WeekMetric, string> = {
    duration: t('progress.titleTime'),
    volume: t('progress.titleVolume', { unit: settings.weightUnit }),
    sets: t('progress.titleSets'),
  };
  const thisWeek = buckets.at(-1)!;

  return (
    <div className="page">
      <PageHeader large title={t('tab.progress')} actions={<SettingsLink />} />

      <div className="stat-grid">
        <Stat label={t('progress.workouts')} value={fmtNum(workouts.length, 0)} />
        <Stat label={t('progress.thisWeek')} value={fmtNum(thisWeek.workouts, 0)} />
        <Stat label={t('progress.streak')} value={fmtNum(streak, 0)} />
        <Stat label={t('progress.timeTrained')} value={t('progress.hours', { n: Math.round(totalSeconds / 3600) })} />
      </div>

      <RecentRecords />

      <BodyWeightCard />

      <section className="card chart-card">
        <h2 className="card-title">{titles[metric]}</h2>
        <BarChart
          data={buckets.map((b) => ({
            tick: fmtDayMonth(b.start),
            label: t('progress.weekOf', { date: fmtDate(b.start) }),
            value: value(b),
          }))}
          format={format}
          caption={titles[metric]}
        />
        <Segmented
          label={t('progress.weeklyMetric')}
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'duration', label: t('progress.metricTime') },
            { value: 'volume', label: t('progress.metricVolume') },
            { value: 'sets', label: t('progress.metricSets') },
          ]}
        />
      </section>

      <section className="card">
        <h2 className="card-title">{t('progress.consistency', { n: CAL_WEEKS })}</h2>
        <Calendar />
      </section>

      <section className="card">
        <h2 className="card-title">{t('progress.muscles')}</h2>
        {muscleRows.length ? (
          <>
            <MuscleMap totals={muscleTotals} table={false} />
            <HBars rows={muscleRows} format={(v) => fmtNum(v, 0)} />
          </>
        ) : (
          <p className="muted">{t('progress.noMuscles')}</p>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">{t('progress.mostLogged')}</h2>
        <ul className="top-list">
          {top.map(({ exercise, id, count }) => (
            <li key={id}>
              <Link to={`/exercises/${id}`} className="top-row">
                <ExerciseAvatar exercise={exercise} size={36} />
                <span className="ex-row-name">{exercise?.name ?? t('exercise.deleted')}</span>
                <span className="muted tabular">{count_('session', count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** The latest personal records, each linking to the workout that set it. */
function RecentRecords() {
  const { workouts, records, exerciseMap } = useData();
  const settings = useSettings();
  const list = useMemo(() => recentRecords(workouts, records), [workouts, records]);
  if (!list.length) return null;

  return (
    <section className="card">
      <h2 className="card-title">{t('progress.recent')}</h2>
      <ul className="top-list">
        {list.map((r) => {
          const exercise = exerciseMap.get(r.exerciseId);
          return (
            <li key={`${r.workoutId}:${r.exerciseId}`}>
              <Link to={`/history/${r.workoutId}`} className="rec-row">
                <ExerciseAvatar exercise={exercise} size={36} />
                <span className="rec-text">
                  <span className="rec-head">
                    <span className="ex-row-name">{exercise?.name ?? t('exercise.deleted')}</span>
                    <span className="muted small">{fmtRelativeDay(r.time)}</span>
                  </span>
                  <span className="rec-items">
                    <span className="pr-pill">
                      <IconTrophy size={13} /> {RECORD_LABEL[r.items[0].kind]} {recordFormat(r.items[0].kind, r.items[0].value, settings)}
                    </span>
                    {r.items.length > 1 && <span className="muted small">{t('progress.recentExtra', { n: r.items.length - 1 })}</span>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SettingsLink() {
  return (
    <Link to="/settings" className="icon-btn" aria-label={t('progress.settings')}>
      <IconSettings />
    </Link>
  );
}

function Calendar() {
  const { workouts } = useData();
  const { days, levelOf } = useMemo(() => {
    const map = new Map<number, { titles: string[]; sets: number }>();
    for (const w of workouts) {
      const d = startOfDay(w.startTime);
      const day = map.get(d) ?? { titles: [], sets: 0 };
      day.titles.push(w.title);
      day.sets += workoutSets(w);
      map.set(d, day);
    }
    // Quartiles of the busy days, so the shades spread however much (or little) the user trains.
    const sorted = [...map.values()].map((d) => d.sets).sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
    const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
    const levelOf = (sets: number) => (sets <= q1 ? 1 : sets <= q2 ? 2 : sets <= q3 ? 3 : 4);
    return { days: map, levelOf };
  }, [workouts]);

  const today = startOfDay(Date.now());
  const first = addDays(startOfWeek(today), -7 * (CAL_WEEKS - 1));
  const weeks = Array.from({ length: CAL_WEEKS }, (_, i) => addDays(first, i * 7));
  const trained = weeks.reduce((n, wk) => n + Array.from({ length: 7 }, (_, d) => days.has(addDays(wk, d))).filter(Boolean).length, 0);

  return (
    <div className="calendar" role="img" aria-label={t('progress.calendarLabel', { days: count_('trainingDay', trained), n: CAL_WEEKS })}>
      <div className="cal-months" style={{ gridTemplateColumns: `repeat(${CAL_WEEKS}, minmax(0, 1fr))` }}>
        {weeks.map((wk, i) => {
          const prev = i ? new Date(weeks[i - 1]).getMonth() : -1;
          return <span key={wk}>{new Date(wk).getMonth() !== prev ? fmtMonthShort(wk) : ''}</span>;
        })}
      </div>
      <div className="cal-body">
        <div className="cal-days">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>{i % 2 === 0 ? fmtWeekdayShort(addDays(first, i)) : ''}</span>
          ))}
        </div>
        <div className="cal-grid" style={{ gridTemplateColumns: `repeat(${CAL_WEEKS}, minmax(0, 1fr))` }}>
          {weeks.map((wk) => (
            <div key={wk} className="cal-week">
              {Array.from({ length: 7 }, (_, d) => {
                const day = addDays(wk, d);
                const info = days.get(day);
                const future = day > today;
                return (
                  <span
                    key={d}
                    className={`cal-cell ${day === today ? 'today' : ''} ${future ? 'future' : ''}`}
                    data-level={info ? levelOf(info.sets) : undefined}
                    title={`${fmtWeekdayDate(day)}${info ? ` — ${info.titles.join(t('common.comma'))} (${count_('set', info.sets)})` : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="muted small cal-foot">{t('progress.calendarFoot', { days: count_('trainingDay', trained) })}</p>
      <div className="cal-legend" aria-hidden="true">
        <span>{t('progress.less')}</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} data-level={l || undefined} />
        ))}
        <span>{t('progress.more')}</span>
      </div>
    </div>
  );
}
