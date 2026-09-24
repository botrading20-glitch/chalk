import { useMemo, useState } from 'react';
import { LineChart } from '../components/Charts';
import { confirmDialog, toast } from '../components/dialogs';
import { IconEdit, IconTrophy } from '../components/Icons';
import { Empty, ExerciseAvatar, PageHeader, Segmented } from '../components/ui';
import { db } from '../db';
import { useData } from '../lib/data';
import { reassignExercise } from '../lib/exercises';
import { fmtClock, fmtDate, fmtNum, kgTo, kmTo, plural } from '../lib/format';
import { EQUIPMENT_LABEL, IMAGE_BASE, MUSCLE_LABEL, TYPE_LABEL } from '../lib/meta';
import { Link, navigate } from '../lib/router';
import { fmtSet, setLabels } from '../lib/sets';
import { useSettings } from '../lib/settings';
import {
  RECORD_LABEL,
  SESSION_METRIC_LABEL,
  metricsFor,
  sessionMetric,
  sessionsFor,
  type RecordKind,
  type SessionMetric,
} from '../lib/stats';
import type { Settings } from '../types';

type Tab = 'progress' | 'history' | 'howto';
type Range = '3m' | '1y' | 'all';

const WEIGHT_METRICS: SessionMetric[] = ['heaviest', 'e1rm', 'bestSetVolume', 'sessionVolume'];

function toDisplay(metric: SessionMetric, raw: number, s: Settings) {
  if (WEIGHT_METRICS.includes(metric)) return kgTo(raw, s.weightUnit);
  if (metric === 'maxDistance') return kmTo(raw, s.distanceUnit);
  return raw;
}

function metricFormatter(metric: SessionMetric, s: Settings) {
  if (WEIGHT_METRICS.includes(metric)) return (v: number) => `${fmtNum(v, 1)} ${s.weightUnit}`;
  if (metric === 'maxDuration') return (v: number) => fmtClock(v);
  if (metric === 'maxDistance') return (v: number) => `${fmtNum(v, 2)} ${s.distanceUnit}`;
  return (v: number) => `${fmtNum(v, 0)} reps`;
}

function recordFormat(kind: RecordKind, v: number, s: Settings) {
  switch (kind) {
    case 'weight':
    case 'e1rm':
    case 'volume':
      return `${fmtNum(kgTo(v, s.weightUnit), 1)} ${s.weightUnit}`;
    case 'reps':
      return `${fmtNum(v, 0)} reps`;
    case 'duration':
      return fmtClock(v);
    case 'distance':
      return `${fmtNum(kmTo(v, s.distanceUnit), 2)} ${s.distanceUnit}`;
  }
}

export function ExerciseDetail({ id }: { id: string }) {
  const { exerciseMap, exercises, workouts, records } = useData();
  const settings = useSettings();
  const ex = exerciseMap.get(id);
  const original = ex?.replaces ? exerciseMap.get(ex.replaces) : undefined;
  const replacedBy = ex?.source === 'library' ? exercises.find((e) => e.replaces === ex.id) : undefined;
  const sessions = useMemo(() => sessionsFor(id, workouts), [id, workouts]);
  const hasHowTo = !!ex && (ex.instructions.length > 0 || ex.images.length > 0);
  const [tab, setTab] = useState<Tab>(sessions.length || !hasHowTo ? 'progress' : 'howto');
  const metrics = ex ? metricsFor(ex.type) : [];
  const [metric, setMetric] = useState<SessionMetric>(metrics[0] ?? 'maxReps');
  const [range, setRange] = useState<Range>('all');

  if (!ex) {
    return (
      <div className="page">
        <PageHeader back="/exercises" title="Exercise" />
        <Empty title="This exercise doesn't exist">It may have been deleted.</Empty>
      </div>
    );
  }

  const since = range === 'all' ? 0 : Date.now() - (range === '3m' ? 91 : 365) * 86_400_000;
  const points = sessions
    .filter((s) => s.workout.startTime >= since)
    .map((s) => ({ x: s.workout.startTime, y: toDisplay(metric, sessionMetric(metric, s.sets), settings), label: fmtDate(s.workout.startTime) }))
    .filter((p) => p.y > 0)
    .reverse();
  const best = records.best.get(id) ?? {};
  const bestSession = Math.max(0, ...sessions.map((s) => sessionMetric('sessionVolume', s.sets)));
  const tabs: { value: Tab; label: string }[] = [
    { value: 'progress', label: 'Progress' },
    { value: 'history', label: `History${sessions.length ? ` (${sessions.length})` : ''}` },
    ...(hasHowTo ? [{ value: 'howto' as Tab, label: 'How to' }] : []),
  ];

  return (
    <div className="page">
      <PageHeader
        back="/exercises"
        title=""
        actions={
          !replacedBy && (
            <Link to={`/exercises/${id}/edit`} className="icon-btn" aria-label="Edit exercise">
              <IconEdit />
            </Link>
          )
        }
      />
      <div className="exercise-hero">
        <ExerciseAvatar exercise={ex} size={64} />
        <div>
          <h1 className="detail-title">{ex.name}</h1>
          <p className="muted">
            {MUSCLE_LABEL[ex.primaryMuscle]}
            {ex.secondaryMuscles.length > 0 && ` + ${ex.secondaryMuscles.map((m) => MUSCLE_LABEL[m]).join(', ')}`}
          </p>
          <p className="muted small">
            {EQUIPMENT_LABEL[ex.equipment]} · {TYPE_LABEL[ex.type]}
            {ex.source === 'custom' && (original ? ' · Your version' : ' · Your exercise')}
          </p>
        </div>
      </div>

      {replacedBy && (
        <Link to={`/exercises/${replacedBy.id}`} className="card replaced-note">
          <strong>You use your own version of this exercise</strong>
          <span>Your workouts are logged under “{replacedBy.name}”. Tap to open it.</span>
        </Link>
      )}

      <Segmented options={tabs} value={tab} onChange={setTab} label="Exercise sections" />

      {tab === 'progress' &&
        (sessions.length === 0 ? (
          <Empty title="Not logged yet">Your chart and records appear after the first workout with this exercise.</Empty>
        ) : (
          <>
            <section className="card chart-card">
              <div className="chart-head">
                <h2 className="card-title">{SESSION_METRIC_LABEL[metric]}</h2>
                <select className="chip-select" value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Time range">
                  <option value="3m">Last 3 months</option>
                  <option value="1y">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
              {points.length ? (
                <LineChart
                  points={points}
                  format={metricFormatter(metric, settings)}
                  caption={`${SESSION_METRIC_LABEL[metric]} per session for ${ex.name}`}
                />
              ) : (
                <p className="muted chart-empty">No sessions in this range.</p>
              )}
              {metrics.length > 1 && (
                <div className="chips scroll">
                  {metrics.map((m) => (
                    <button key={m} className={`chip ${m === metric ? 'on' : ''}`} onClick={() => setMetric(m)}>
                      {SESSION_METRIC_LABEL[m]}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <h2 className="card-title">Personal records</h2>
              <dl className="records">
                {(Object.entries(best) as [RecordKind, NonNullable<(typeof best)[RecordKind]>][]).map(([kind, entry]) => (
                  <div key={kind}>
                    <dt>{RECORD_LABEL[kind]}</dt>
                    <dd>
                      <strong className="tabular">{recordFormat(kind, entry.value, settings)}</strong>
                      <Link to={`/history/${entry.workoutId}`} className="muted small">
                        {kind === 'e1rm' || kind === 'volume' ? `${fmtSet(entry.set, ex.type, settings)} · ` : ''}
                        {fmtDate(entry.time)}
                      </Link>
                    </dd>
                  </div>
                ))}
                {bestSession > 0 && (
                  <div>
                    <dt>Best session volume</dt>
                    <dd>
                      <strong className="tabular">{recordFormat('volume', bestSession, settings)}</strong>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Logged</dt>
                  <dd>
                    <strong>{plural(sessions.length, 'session')}</strong>
                    <span className="muted small">last on {fmtDate(sessions[0].workout.startTime)}</span>
                  </dd>
                </div>
              </dl>
            </section>
          </>
        ))}

      {tab === 'history' &&
        (sessions.length === 0 ? (
          <Empty title="Not logged yet">Sessions with this exercise will be listed here.</Empty>
        ) : (
          <div className="stack">
            {sessions.map((s) => {
              const labels = setLabels(s.sets);
              return (
                <Link key={s.workout.id} to={`/history/${s.workout.id}`} className="card session-card">
                  <header>
                    <strong>{s.workout.title}</strong>
                    <span className="muted small">{fmtDate(s.workout.startTime)}</span>
                  </header>
                  {s.notes.map((n, i) => (
                    <p key={i} className="ex-note">
                      {n}
                    </p>
                  ))}
                  <ol className="set-list">
                    {s.sets.map((set, i) => (
                      <li key={set.id}>
                        <span className="set-badge static" data-type={set.type}>
                          {labels[i]}
                        </span>
                        <span className="set-value tabular">{fmtSet(set, ex.type, settings)}</span>
                        {records.bySet.has(set.id) && (
                          <span className="pr-tags">
                            <IconTrophy size={14} /> Record
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </Link>
              );
            })}
          </div>
        ))}

      {tab === 'howto' && (
        <section className="howto">
          {ex.images.length > 0 && (
            <div className="howto-images">
              {ex.images.map((img, i) => (
                <img key={img} src={IMAGE_BASE + img} alt={`${ex.name}, ${i === 0 ? 'start' : 'end'} position`} loading="lazy" />
              ))}
            </div>
          )}
          {ex.instructions.length > 0 && (
            <ol className="steps">
              {ex.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
        </section>
      )}

      {original && (
        <button
          className="btn btn-danger-ghost btn-block"
          onClick={async () => {
            const ok = await confirmDialog({
              title: `Go back to “${original.name}”?`,
              message: 'Your workouts and routines switch back to the library exercise, and your version is deleted.',
              confirmLabel: 'Use the original',
              danger: true,
            });
            if (!ok) return;
            await reassignExercise(ex.id, original.id);
            await db.exercises.delete(ex.id);
            navigate(`/exercises/${original.id}`, { replace: true });
          }}
        >
          Go back to the library version
        </button>
      )}

      {ex.source === 'custom' && !original && (
        <button
          className="btn btn-danger-ghost btn-block"
          onClick={async () => {
            if (sessions.length) {
              toast(`Used in ${plural(sessions.length, 'workout')} — remove it from those first`);
              return;
            }
            const ok = await confirmDialog({ title: `Delete "${ex.name}"?`, confirmLabel: 'Delete exercise', danger: true });
            if (!ok) return;
            await db.exercises.delete(ex.id);
            navigate('/exercises', { replace: true });
          }}
        >
          Delete exercise
        </button>
      )}
    </div>
  );
}
