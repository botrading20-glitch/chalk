import { useMemo, type ReactNode } from 'react';
import { IconBack, IconChevron } from '../components/Icons';
import { MuscleMap } from '../components/MuscleMap';
import { RecordList } from '../components/RecordList';
import { Empty, ExerciseAvatar, PageHeader, Stat } from '../components/ui';
import { useData, useNow } from '../lib/data';
import { addDays, firstDayOfWeek, fmtDuration, fmtMonth, fmtNum, fmtWeekdayNarrow, isolate, kgTo, startOfDay, startOfWeek } from '../lib/format';
import { recentRecords } from '../lib/records';
import { addMonths, monthGrid, monthKey, monthReport, monthStart, parseMonthKey } from '../lib/report';
import { Link } from '../lib/router';
import { useSettings } from '../lib/settings';
import type { Workout } from '../types';
import { count, listJoin, t } from '../i18n';

/** `#/profile/report/2026-09`: one month of training, set beside the month before. */
export function ReportPage({ month }: { month?: string }) {
  const { workouts, typeOf, exerciseMap, records } = useData();
  const settings = useSettings();
  const now = useNow(60_000);

  // From the month of the first workout to now (or the newest workout, if the clock is behind it).
  const current = monthStart(now);
  const newest = workouts.length ? monthStart(workouts[0].startTime) : current;
  const last = Math.max(current, newest);
  const first = workouts.length ? monthStart(workouts[workouts.length - 1].startTime) : current;
  const start = Math.min(last, Math.max(first, parseMonthKey(month) ?? current));
  const prev = start > first ? addMonths(start, -1) : undefined;
  const next = start < last ? addMonths(start, 1) : undefined;

  // A month still running is set against the same days of the month before, so the day is all that matters here.
  const today = startOfDay(now);
  const report = useMemo(() => monthReport(workouts, typeOf, exerciseMap, records, start, 5, today), [workouts, typeOf, exerciseMap, records, start, today]);
  const list = useMemo(() => recentRecords(report.list, records, 10), [report.list, records]);

  // The change against the month before, only when that month had workouts to compare with.
  const compared = report.previous.workouts > 0;
  const vs = (delta: number, format: (n: number) => string) =>
    !compared
      ? undefined
      : delta === 0
        ? t(report.partial ? 'report.sameSoFar' : 'report.same')
        : t(report.partial ? 'report.vsLastSoFar' : 'report.vsLast', { change: isolate(`${delta > 0 ? '+' : '−'}${format(Math.abs(delta))}`) });
  const whole = (n: number) => fmtNum(n, 0);
  const unit = settings.weightUnit;
  const volumeDelta = Math.round(kgTo(report.volume, unit)) - Math.round(kgTo(report.previous.volume, unit));

  return (
    <div className="page">
      <PageHeader back="/profile" title={t('report.title')} />

      <nav className="rep-nav" aria-label={t('report.navLabel')}>
        <MonthButton to={prev} label={t('report.prev')} icon={<IconBack className="flip-rtl" />} />
        <h2 className="rep-month" aria-live="polite">
          {fmtMonth(start)}
        </h2>
        <MonthButton to={next} label={t('report.next')} icon={<IconChevron className="flip-rtl" />} />
      </nav>

      {report.workouts === 0 ? (
        <Empty title={t('report.emptyTitle')}>{t('report.emptyText')}</Empty>
      ) : (
        <>
          <section className="card week-card" aria-label={t('progress.workouts')}>
            <div className="week-hero">
              <span className="week-num">{whole(report.workouts)}</span>
              <span className="week-label">{t('progress.workouts')}</span>
            </div>
            {compared && <span className="slant-chip rep-chip">{vs(report.workouts - report.previous.workouts, whole)}</span>}
          </section>

          <div className="stat-grid rep-stats">
            <Stat label={t('stat.duration')} value={fmtDuration(report.seconds)} note={vs(Math.round((report.seconds - report.previous.seconds) / 60) * 60, fmtDuration)} />
            <Stat label={t('stat.volume')} value={
                <>
                  {isolate(fmtNum(Math.round(kgTo(report.volume, unit)), 0))}
                  <span className="stat-unit">{unit}</span>
                </>
              } note={vs(volumeDelta, (n) => isolate(`${fmtNum(n, 0)} ${unit}`))} />
            <Stat label={t('stat.sets')} value={whole(report.sets)} note={vs(report.sets - report.previous.sets, whole)} />
            <Stat label={t('report.reps')} value={whole(report.reps)} note={vs(report.reps - report.previous.reps, whole)} />
            <Stat label={t('detail.stats.records')} value={whole(report.records)} note={vs(report.records - report.previous.records, whole)} />
            <Stat label={t('report.days')} value={whole(report.days)} note={vs(report.days - report.previous.days, whole)} />
          </div>

          <section className="card">
            <MonthCalendar start={start} workouts={report.list} today={today} />
          </section>

          <section className="card">
            <h2 className="card-title">{t('muscles.worked')}</h2>
            <MuscleMap totals={report.muscles} />
          </section>

          {report.top.length > 0 && (
            <section className="card">
              <h2 className="card-title">{t('report.top')}</h2>
              <ul className="top-list">
                {report.top.map((row) => {
                  const exercise = exerciseMap.get(row.exerciseId);
                  return (
                    <li key={row.exerciseId}>
                      <Link to={`/exercises/${row.exerciseId}`} className="top-row">
                        <ExerciseAvatar exercise={exercise} size={36} />
                        <span className="ex-row-name">{exercise?.name ?? t('exercise.deleted')}</span>
                        <span className="muted tabular">{count('set', row.sets)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {list.length > 0 && (
            <section className="card">
              <h2 className="card-title">{t('report.recordsTitle')}</h2>
              <RecordList list={list} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** A previous/next arrow; a month with nothing beyond it shows the arrow dimmed and inert. */
function MonthButton({ to, label, icon }: { to?: number; label: string; icon: ReactNode }) {
  return to === undefined ? (
    <button className="icon-btn" aria-label={label} disabled>
      {icon}
    </button>
  ) : (
    <Link to={`/profile/report/${monthKey(to)}`} className="icon-btn" aria-label={label}>
      {icon}
    </Link>
  );
}

/** The month as weeks of seven days, the days with a workout filled in. */
function MonthCalendar({ start, workouts, today }: { start: number; workouts: Workout[]; today: number }) {
  const { weekStart } = useSettings();
  const trained = useMemo(() => new Set(workouts.map((w) => startOfDay(w.startTime))), [workouts]);
  // weekStart moves the first day of the week, which firstDayOfWeek reads from the shared format context.
  const weeks = useMemo(() => monthGrid(start, firstDayOfWeek()), [start, weekStart]);
  const heads = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(start), i));
  const days = weeks.flat().filter((d): d is number => d !== null && trained.has(d));

  return (
    <div
      className="rep-cal"
      role="img"
      aria-label={t('report.calendarLabel', { month: fmtMonth(start), days: listJoin(days.map((d) => String(new Date(d).getDate()))) })}
    >
      {heads.map((d) => (
        <span key={d} className="rep-cal-head" aria-hidden="true">
          {fmtWeekdayNarrow(d)}
        </span>
      ))}
      {weeks.flat().map((d, i) =>
        d === null ? (
          <span key={`blank-${i}`} aria-hidden="true" />
        ) : (
          <span key={d} className={`rep-cal-day ${trained.has(d) ? 'on' : ''} ${d === today ? 'today' : ''}`} aria-hidden="true">
            {new Date(d).getDate()}
          </span>
        ),
      )}
    </div>
  );
}
