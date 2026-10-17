import { useMemo, useState } from 'react';
import { LineChart } from '../components/Charts';
import { ExerciseDemo } from '../components/ExerciseDemo';
import { confirmDialog, toast } from '../components/dialogs';
import { IconEdit, IconTrophy } from '../components/Icons';
import { Empty, ExerciseAvatar, PageHeader, Segmented } from '../components/ui';
import { db } from '../db';
import { useData } from '../lib/data';
import { exerciseUses, reassignExercise } from '../lib/exercises';
import { recordFormat } from '../lib/recordFormat';
import { fmtClock, fmtDate, fmtNum, isolate, kgTo, kmTo } from '../lib/format';
import { COUNTS_VOLUME, EQUIPMENT_LABEL, MUSCLE_LABEL, TYPE_LABEL } from '../lib/meta';
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
import { count, t } from '../i18n';

type Tab = 'progress' | 'history' | 'howto';
type Range = '3m' | '1y' | 'all';

const WEIGHT_METRICS: SessionMetric[] = ['heaviest', 'e1rm', 'bestSetVolume', 'sessionVolume'];

function toDisplay(metric: SessionMetric, raw: number, s: Settings) {
  if (WEIGHT_METRICS.includes(metric)) return kgTo(raw, s.weightUnit);
  if (metric === 'maxDistance') return kmTo(raw, s.distanceUnit);
  return raw;
}

function metricFormatter(metric: SessionMetric, s: Settings) {
  if (WEIGHT_METRICS.includes(metric)) return (v: number) => isolate(`${fmtNum(v, 1)} ${s.weightUnit}`);
  if (metric === 'maxDuration') return (v: number) => fmtClock(v);
  if (metric === 'maxDistance') return (v: number) => isolate(`${fmtNum(v, 2)} ${s.distanceUnit}`);
  return (v: number) => count('rep', v);
}

export function ExerciseDetail({ id }: { id: string }) {
  const { exerciseMap, exercises, workouts, records } = useData();
  const settings = useSettings();
  const ex = exerciseMap.get(id);
  const original = ex?.replaces ? exerciseMap.get(ex.replaces) : undefined;
  const replacedBy = ex?.source === 'library' ? exercises.find((e) => e.replaces === ex.id) : undefined;
  const sessions = useMemo(() => sessionsFor(id, workouts), [id, workouts]);
  const hasHowTo = !!ex && ex.instructions.length > 0;
  const [tab, setTab] = useState<Tab>(sessions.length || !hasHowTo ? 'progress' : 'howto');
  const metrics = ex ? metricsFor(ex.type) : [];
  const [metric, setMetric] = useState<SessionMetric>(metrics[0] ?? 'maxReps');
  const [range, setRange] = useState<Range>('all');

  if (!ex) {
    return (
      <div className="page">
        <PageHeader back="/exercises" title={t('exercise.title')} />
        <Empty title={t('missing.exercise')}>{t('missing.hint')}</Empty>
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
  const bestSession = COUNTS_VOLUME[ex.type] ? Math.max(0, ...sessions.map((s) => sessionMetric('sessionVolume', s.sets))) : 0;
  const tabs: { value: Tab; label: string }[] = [
    { value: 'progress', label: t('exercise.tabProgress') },
    { value: 'history', label: sessions.length ? t('exercise.tabHistoryCount', { n: sessions.length }) : t('exercise.tabHistory') },
    ...(hasHowTo ? [{ value: 'howto' as Tab, label: t('exercise.tabHowTo') }] : []),
  ];

  return (
    <div className="page">
      <PageHeader
        back="/exercises"
        title=""
        actions={
          !replacedBy && (
            <Link to={`/exercises/${id}/edit`} className="icon-btn" aria-label={t('exercise.edit')}>
              <IconEdit />
            </Link>
          )
        }
      />
      <ExerciseDemo exercise={ex} />
      <div className="exercise-hero">
        {!ex.images.length && <ExerciseAvatar exercise={ex} size={64} />}
        <div>
          <h1 className="detail-title">{ex.name}</h1>
          <p className="muted">
            {MUSCLE_LABEL[ex.primaryMuscle]}
            {ex.secondaryMuscles.length > 0 && ` + ${ex.secondaryMuscles.map((m) => MUSCLE_LABEL[m]).join(t('common.comma'))}`}
          </p>
          <p className="muted small">
            {EQUIPMENT_LABEL[ex.equipment]} · {TYPE_LABEL[ex.type]}
            {ex.source === 'custom' && ` · ${original ? t('exercise.yourVersion') : t('exercise.yourExercise')}`}
          </p>
        </div>
      </div>

      {replacedBy && (
        <Link to={`/exercises/${replacedBy.id}`} className="card replaced-note">
          <strong>{t('exercise.replacedTitle')}</strong>
          <span>{t('exercise.replacedText', { name: replacedBy.name })}</span>
        </Link>
      )}

      <Segmented options={tabs} value={tab} onChange={setTab} label={t('exercise.sections')} />

      {tab === 'progress' &&
        (sessions.length === 0 ? (
          <Empty title={t('exercise.notLogged')}>{t('exercise.notLoggedProgress')}</Empty>
        ) : (
          <>
            <section className="card chart-card">
              <div className="chart-head">
                <h2 className="card-title">{SESSION_METRIC_LABEL[metric]}</h2>
                <select className="chip-select" value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label={t('exercise.timeRange')}>
                  <option value="3m">{t('exercise.range3m')}</option>
                  <option value="1y">{t('exercise.range1y')}</option>
                  <option value="all">{t('exercise.rangeAll')}</option>
                </select>
              </div>
              {points.length ? (
                <LineChart
                  points={points}
                  format={metricFormatter(metric, settings)}
                  caption={t('exercise.chartCaption', { metric: SESSION_METRIC_LABEL[metric], name: ex.name })}
                />
              ) : (
                <p className="muted chart-empty">{t('exercise.noSessions')}</p>
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
              <h2 className="card-title">{t('exercise.records')}</h2>
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
                    <dt>{t('exercise.bestSession')}</dt>
                    <dd>
                      <strong className="tabular">{recordFormat('volume', bestSession, settings)}</strong>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>{t('exercise.logged')}</dt>
                  <dd>
                    <strong>{count('session', sessions.length)}</strong>
                    <span className="muted small">{t('exercise.lastOn', { date: fmtDate(sessions[0].workout.startTime) })}</span>
                  </dd>
                </div>
              </dl>
            </section>
          </>
        ))}

      {tab === 'history' &&
        (sessions.length === 0 ? (
          <Empty title={t('exercise.notLogged')}>{t('exercise.notLoggedHistory')}</Empty>
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
                            <IconTrophy size={14} /> {t('exercise.recordTag')}
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
              title: t('exercise.backTitle', { name: original.name }),
              message: t('exercise.backText'),
              confirmLabel: t('exercise.backConfirm'),
              danger: true,
            });
            if (!ok) return;
            await reassignExercise(ex.id, original.id);
            await db.exercises.delete(ex.id);
            navigate(`/exercises/${original.id}`, { replace: true });
          }}
        >
          {t('exercise.backButton')}
        </button>
      )}

      {ex.source === 'custom' && !original && (
        <button
          className="btn btn-danger-ghost btn-block"
          onClick={async () => {
            const uses = await exerciseUses(ex.id);
            if (uses) {
              toast(t('exercise.usedIn', { uses }));
              return;
            }
            const ok = await confirmDialog({ title: t('exercise.deleteTitle', { name: ex.name }), confirmLabel: t('exercise.delete'), danger: true });
            if (!ok) return;
            await db.exercises.delete(ex.id);
            navigate('/exercises', { replace: true });
          }}
        >
          {t('exercise.delete')}
        </button>
      )}
    </div>
  );
}
