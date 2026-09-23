import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { IconCopy, IconEdit, IconMore, IconPlay, IconPlus, IconTrash } from '../components/Icons';
import { ActionSheet } from '../components/Sheet';
import { Empty, PageHeader } from '../components/ui';
import { db } from '../db';
import { useData, useNow } from '../lib/data';
import { fmtClock, fmtRelativeDay, plural, uid } from '../lib/format';
import { Link, navigate } from '../lib/router';
import {
  cloneExercises,
  createRoutinesFromHistory,
  discardActive,
  saveRoutine,
  startWorkout,
  useActiveWorkout,
} from '../lib/workouts';
import type { Routine, WorkoutExercise } from '../types';

export async function beginWorkout(opts: { title?: string; exercises?: WorkoutExercise[]; routineId?: string } = {}) {
  const running = await db.kv.get('active');
  if (running) {
    const ok = await confirmDialog({
      title: 'A workout is already running',
      message: 'Starting a new one throws away the workout in progress and everything logged in it.',
      confirmLabel: 'Discard it and start new',
      cancelLabel: 'Keep current workout',
      danger: true,
    });
    if (!ok) return;
  }
  await startWorkout(opts);
  navigate('/workout');
}

export function WorkoutHome() {
  const active = useActiveWorkout();
  const routines = useLiveQuery(() => db.routines.orderBy('order').toArray(), []);
  const { workouts } = useData();
  const [menu, setMenu] = useState<Routine | null>(null);

  return (
    <div className="page">
      <PageHeader large title="Workout" />

      {active ? <ResumeCard /> : null}

      <button className="btn btn-primary btn-block btn-hero" onClick={() => beginWorkout()}>
        <IconPlus /> Start empty workout
      </button>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Routines</h2>
          <Link to="/routines/new" className="btn btn-ghost btn-small">
            <IconPlus size={18} /> New routine
          </Link>
        </div>

        {routines && routines.length === 0 && (
          <Empty
            title="No routines yet"
            action={
              workouts.length > 0 ? (
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    const created = await createRoutinesFromHistory();
                    toast(created.length ? `Created ${plural(created.length, 'routine')}` : 'No workout title repeats often enough to make a routine');
                  }}
                >
                  Create routines from my history
                </button>
              ) : undefined
            }
          >
            A routine is a saved list of exercises and sets. Start one and everything is loaded, ready to log.
          </Empty>
        )}

        <div className="routine-list">
          {routines?.map((r) => (
            <RoutineCard key={r.id} routine={r} onMenu={() => setMenu(r)} />
          ))}
        </div>
      </section>

      <ActionSheet
        open={!!menu}
        onClose={() => setMenu(null)}
        title={menu?.title}
        actions={
          menu
            ? [
                { label: 'Edit routine', icon: <IconEdit />, onSelect: () => navigate(`/routines/${menu.id}`) },
                {
                  label: 'Duplicate',
                  icon: <IconCopy />,
                  onSelect: async () => {
                    await saveRoutine({ id: uid(), title: `${menu.title} (copy)`, notes: menu.notes, exercises: cloneExercises(menu.exercises) });
                    toast('Routine duplicated');
                  },
                },
                {
                  label: 'Delete routine',
                  icon: <IconTrash />,
                  danger: true,
                  onSelect: async () => {
                    const ok = await confirmDialog({
                      title: `Delete "${menu.title}"?`,
                      message: 'Workouts you logged with it stay in your history.',
                      confirmLabel: 'Delete routine',
                      danger: true,
                    });
                    if (ok) await db.routines.delete(menu.id);
                  },
                },
              ]
            : []
        }
      />
    </div>
  );
}

function ResumeCard() {
  const active = useActiveWorkout();
  const now = useNow(1000, !!active);
  if (!active) return null;
  return (
    <div className="card resume-card">
      <div>
        <span className="eyebrow">In progress</span>
        <h2 className="resume-title">{active.title}</h2>
        <span className="muted tabular">{fmtClock((now - active.startTime) / 1000)}</span>
      </div>
      <div className="resume-actions">
        <button
          className="btn btn-ghost btn-small"
          onClick={async () => {
            const ok = await confirmDialog({
              title: 'Discard this workout?',
              message: 'Everything logged in it will be lost.',
              confirmLabel: 'Discard workout',
              danger: true,
            });
            if (ok) await discardActive();
          }}
        >
          Discard
        </button>
        <Link to="/workout" className="btn btn-primary btn-small">
          Resume
        </Link>
      </div>
    </div>
  );
}

function lastDone(ts: number) {
  const rel = fmtRelativeDay(ts);
  return /^(Today|Yesterday)$|ago$/.test(rel) ? rel.toLowerCase() : `on ${rel}`;
}

function RoutineCard({ routine, onMenu }: { routine: Routine; onMenu: () => void }) {
  const { exerciseMap, workouts } = useData();
  const names = routine.exercises.map((we) => exerciseMap.get(we.exerciseId)?.name ?? 'Deleted exercise');
  const setCount = routine.exercises.reduce((n, we) => n + we.sets.length, 0);
  const key = routine.title.trim().toLowerCase();
  const last = workouts.find((w) => w.routineId === routine.id || w.title.trim().toLowerCase() === key);

  return (
    <article className="card routine-card">
      <header className="routine-head">
        <Link to={`/routines/${routine.id}`} className="routine-title">
          {routine.title}
        </Link>
        <button className="icon-btn" onClick={onMenu} aria-label={`Options for ${routine.title}`}>
          <IconMore />
        </button>
      </header>
      <p className="routine-exercises">
        {names.slice(0, 4).join(', ')}
        {names.length > 4 && `, +${names.length - 4} more`}
      </p>
      <p className="routine-meta">
        {plural(routine.exercises.length, 'exercise')} · {plural(setCount, 'set')}
        {last && ` · Last done ${lastDone(last.startTime)}`}
      </p>
      <button
        className="btn btn-secondary btn-block"
        onClick={() => beginWorkout({ title: routine.title, exercises: routine.exercises, routineId: routine.id })}
      >
        <IconPlay size={16} /> Start routine
      </button>
    </article>
  );
}
