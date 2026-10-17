import { useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { SavedCelebration } from '../components/Celebration';
import { IconCopy, IconEdit, IconMore, IconPlay, IconShare, IconTrash, IconTrophy } from '../components/Icons';
import { MuscleMap } from '../components/MuscleMap';
import { ShareWorkoutSheet } from '../components/ShareWorkout';
import { ActionSheet } from '../components/Sheet';
import { Empty, ExerciseAvatar, PageHeader, Stat } from '../components/ui';
import { db } from '../db';
import { useData } from '../lib/data';
import { fmtDateLong, fmtDuration, fmtTime, fmtVolume } from '../lib/format';
import { muscleSets } from '../lib/muscles';
import { Link, navigate } from '../lib/router';
import { fmtSet, setLabels } from '../lib/sets';
import { useSettings } from '../lib/settings';
import { RECORD_LABEL, workoutSets, workoutVolume, type RecordKind } from '../lib/stats';
import { routineFromWorkout, templateFrom } from '../lib/workouts';
import { beginWorkout } from './WorkoutHome';
import { t } from '../i18n';
import { labelMap } from '../i18n/labels';

const RECORD_SHORT = labelMap<RecordKind>('recordShort', ['weight', 'e1rm', 'volume', 'reps', 'duration', 'distance']);

export function WorkoutDetail({ id, justSaved }: { id: string; justSaved: boolean }) {
  const { workouts, exerciseMap, typeOf, records } = useData();
  const settings = useSettings();
  const [menu, setMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const w = workouts.find((x) => x.id === id);

  if (!w) {
    return (
      <div className="page">
        <PageHeader back="/history" title={t('tab.workout')} />
        <Empty title={t('missing.workout')}>{t('missing.hint')}</Empty>
      </div>
    );
  }

  const prs = records.byWorkout.get(w.id) ?? 0;
  const number = workouts.length - workouts.indexOf(w);

  return (
    <div className="page">
      <PageHeader
        back="/history"
        title=""
        actions={
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label={t('detail.options')}>
            <IconMore />
          </button>
        }
      />

      {justSaved && <SavedCelebration number={number} records={prs} onShare={() => setSharing(true)} />}

      <h1 className="detail-title">{w.title}</h1>
      <p className="muted">
        {fmtDateLong(w.startTime)} · {fmtTime(w.startTime)}–{fmtTime(w.endTime)}
      </p>
      {w.description && <p className="description">{w.description}</p>}

      <div className="stat-row">
        <Stat label={t('stat.duration')} value={fmtDuration((w.endTime - w.startTime) / 1000)} />
        <Stat label={t('stat.volume')} value={fmtVolume(workoutVolume(w, typeOf), settings.weightUnit)} />
        <Stat label={t('stat.sets')} value={workoutSets(w)} />
        <Stat label={t('detail.stats.records')} value={prs} />
      </div>

      <div className="stack">
        {w.exercises.map((we) => {
          const ex = exerciseMap.get(we.exerciseId);
          const type = typeOf(we.exerciseId);
          const labels = setLabels(we.sets);
          return (
            <section key={we.id} className="card ex-summary">
              <Link to={`/exercises/${we.exerciseId}`} className="ex-title">
                <ExerciseAvatar exercise={ex} size={38} />
                <span className="ex-name">{ex?.name ?? t('exercise.deleted')}</span>
              </Link>
              {we.notes && <p className="ex-note">{we.notes}</p>}
              <ol className="set-list">
                {we.sets.map((s, i) => {
                  const kinds = records.bySet.get(s.id) ?? [];
                  return (
                    <li key={s.id}>
                      <span className="set-badge static" data-type={s.type}>
                        {labels[i]}
                      </span>
                      <span className="set-value tabular">
                        {fmtSet(s, type, settings)}
                        {s.rpe !== undefined && <span className="muted">{t('detail.rpe', { n: s.rpe })}</span>}
                      </span>
                      {kinds.length > 0 && (
                        <span className="pr-tags" title={kinds.map((k) => RECORD_LABEL[k]).join(', ')}>
                          <IconTrophy size={14} />
                          {kinds.map((k) => RECORD_SHORT[k]).join(' · ')}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <section className="card">
        <h2 className="card-title">{t('muscles.worked')}</h2>
        <MuscleMap totals={muscleSets(w.exercises, exerciseMap)} />
      </section>

      <ShareWorkoutSheet workout={w} open={sharing} onClose={() => setSharing(false)} />

      <ActionSheet
        open={menu}
        onClose={() => setMenu(false)}
        title={w.title}
        actions={[
          { label: t('detail.menu.share'), icon: <IconShare />, onSelect: () => setSharing(true) },
          { label: t('detail.menu.edit'), icon: <IconEdit />, onSelect: () => navigate(`/history/${w.id}/edit`) },
          {
            label: t('detail.menu.again'),
            icon: <IconPlay />,
            onSelect: () => beginWorkout({ title: w.title, exercises: templateFrom(w.exercises) }),
          },
          {
            label: t('detail.menu.saveRoutine'),
            icon: <IconCopy />,
            onSelect: async () => {
              await routineFromWorkout(w);
              toast(t('detail.savedAsRoutine', { title: w.title }));
            },
          },
          {
            label: t('detail.menu.delete'),
            icon: <IconTrash />,
            danger: true,
            onSelect: async () => {
              const ok = await confirmDialog({
                title: t('detail.deleteTitle'),
                message: t('detail.deleteText'),
                confirmLabel: t('detail.menu.delete'),
                danger: true,
              });
              if (!ok) return;
              await db.workouts.delete(w.id);
              toast(t('detail.deleted'));
              navigate('/history', { replace: true });
            },
          },
        ]}
      />
    </div>
  );
}
