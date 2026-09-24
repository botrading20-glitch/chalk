import { useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { IconCopy, IconEdit, IconMore, IconPlay, IconShare, IconTrash, IconTrophy } from '../components/Icons';
import { ShareWorkoutSheet } from '../components/ShareWorkout';
import { ActionSheet } from '../components/Sheet';
import { Empty, ExerciseAvatar, PageHeader, Stat } from '../components/ui';
import { db } from '../db';
import { useData } from '../lib/data';
import { fmtDateLong, fmtDuration, fmtTime, fmtVolume } from '../lib/format';
import { Link, navigate } from '../lib/router';
import { fmtSet, setLabels } from '../lib/sets';
import { useSettings } from '../lib/settings';
import { RECORD_LABEL, workoutSets, workoutVolume } from '../lib/stats';
import { routineFromWorkout, templateFrom } from '../lib/workouts';
import { beginWorkout } from './WorkoutHome';

const RECORD_SHORT = {
  weight: 'Weight',
  e1rm: '1RM',
  volume: 'Volume',
  reps: 'Reps',
  duration: 'Time',
  distance: 'Distance',
} as const;

export function WorkoutDetail({ id, justSaved }: { id: string; justSaved: boolean }) {
  const { workouts, exerciseMap, typeOf, records } = useData();
  const settings = useSettings();
  const [menu, setMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const w = workouts.find((x) => x.id === id);

  if (!w) {
    return (
      <div className="page">
        <PageHeader back="/history" title="Workout" />
        <Empty title="This workout doesn't exist">It may have been deleted.</Empty>
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
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Workout options">
            <IconMore />
          </button>
        }
      />

      {justSaved && (
        <div className="saved-banner" role="status">
          <span className="eyebrow">Workout {number} saved</span>
          <strong className="saved-headline">{prs ? `${prs} new ${prs === 1 ? 'record' : 'records'}` : 'Logged'}</strong>
          {prs > 0 && <span className="muted">Marked with a trophy below.</span>}
          <button className="btn btn-small saved-share" onClick={() => setSharing(true)}>
            <IconShare size={16} /> Share
          </button>
        </div>
      )}

      <h1 className="detail-title">{w.title}</h1>
      <p className="muted">
        {fmtDateLong(w.startTime)} · {fmtTime(w.startTime)}–{fmtTime(w.endTime)}
      </p>
      {w.description && <p className="description">{w.description}</p>}

      <div className="stat-row">
        <Stat label="Duration" value={fmtDuration((w.endTime - w.startTime) / 1000)} />
        <Stat label="Volume" value={fmtVolume(workoutVolume(w, typeOf), settings.weightUnit)} />
        <Stat label="Sets" value={workoutSets(w)} />
        <Stat label="Records" value={prs} />
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
                <span className="ex-name">{ex?.name ?? 'Deleted exercise'}</span>
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
                        {s.rpe !== undefined && <span className="muted"> @ RPE {s.rpe}</span>}
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

      <ShareWorkoutSheet workout={w} open={sharing} onClose={() => setSharing(false)} />

      <ActionSheet
        open={menu}
        onClose={() => setMenu(false)}
        title={w.title}
        actions={[
          { label: 'Share summary', icon: <IconShare />, onSelect: () => setSharing(true) },
          { label: 'Edit workout', icon: <IconEdit />, onSelect: () => navigate(`/history/${w.id}/edit`) },
          {
            label: 'Do this workout again',
            icon: <IconPlay />,
            onSelect: () => beginWorkout({ title: w.title, exercises: templateFrom(w.exercises) }),
          },
          {
            label: 'Save as routine',
            icon: <IconCopy />,
            onSelect: async () => {
              await routineFromWorkout(w);
              toast(`Saved "${w.title}" as a routine`);
            },
          },
          {
            label: 'Delete workout',
            icon: <IconTrash />,
            danger: true,
            onSelect: async () => {
              const ok = await confirmDialog({
                title: 'Delete this workout?',
                message: 'Its sets and records are removed from your history.',
                confirmLabel: 'Delete workout',
                danger: true,
              });
              if (!ok) return;
              await db.workouts.delete(w.id);
              toast('Workout deleted');
              navigate('/history', { replace: true });
            },
          },
        ]}
      />
    </div>
  );
}
