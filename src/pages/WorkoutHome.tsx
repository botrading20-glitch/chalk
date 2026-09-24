import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type ReactNode } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { IconChevron, IconCopy, IconEdit, IconFolder, IconFolderPlus, IconMore, IconPlay, IconPlus, IconTrash } from '../components/Icons';
import { InstallBanner } from '../components/InstallPrompt';
import { FolderSheet, MoveToFolderSheet } from '../components/RoutineFolders';
import { ActionSheet } from '../components/Sheet';
import { Empty, PageHeader } from '../components/ui';
import { db } from '../db';
import { useData, useNow } from '../lib/data';
import { groupRoutines, removeFolder, toggleFolder, useCollapsedFolders, type Folder } from '../lib/folders';
import { fmtClock, fmtRelativeDay, plural, uid } from '../lib/format';
import { Link, navigate } from '../lib/router';
import { useSyncStatus } from '../lib/sync';
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
  const [folderMenu, setFolderMenu] = useState<Folder | null>(null);
  const [folderSheet, setFolderSheet] = useState<{ folder?: string } | null>(null);
  const [moving, setMoving] = useState<Routine | null>(null);
  const collapsed = useCollapsedFolders();
  const { folders, loose } = groupRoutines(routines ?? []);
  const card = (r: Routine) => <RoutineCard key={r.id} routine={r} onMenu={() => setMenu(r)} />;

  return (
    <div className="page">
      <PageHeader large title="Workout" />

      <SyncWarning />
      {active ? <ResumeCard /> : null}
      <InstallBanner />

      <button className="btn btn-primary btn-block btn-hero" onClick={() => beginWorkout()}>
        <IconPlus /> Start empty workout
      </button>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Routines</h2>
          <div className="section-actions">
            {!!routines?.length && (
              <button className="icon-btn" onClick={() => setFolderSheet({})} aria-label="New folder">
                <IconFolderPlus />
              </button>
            )}
            <Link to="/routines/new" className="btn btn-ghost btn-small">
              <IconPlus size={18} /> New routine
            </Link>
          </div>
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

        {folders.map((f) => (
          <FolderSection key={f.name} folder={f} collapsed={collapsed.has(f.name)} onMenu={() => setFolderMenu(f)}>
            {f.routines.map(card)}
          </FolderSection>
        ))}
        {folders.length > 0 && loose.length > 0 && <h3 className="list-label">Not in a folder</h3>}
        <div className="routine-list">{loose.map(card)}</div>
      </section>

      <ActionSheet
        open={!!menu}
        onClose={() => setMenu(null)}
        title={menu?.title}
        actions={
          menu
            ? [
                { label: 'Edit routine', icon: <IconEdit />, onSelect: () => navigate(`/routines/${menu.id}`) },
                { label: menu.folder ? 'Move to another folder' : 'Move to a folder', icon: <IconFolder />, onSelect: () => setMoving(menu) },
                {
                  label: 'Duplicate',
                  icon: <IconCopy />,
                  onSelect: async () => {
                    await saveRoutine({
                      id: uid(),
                      title: `${menu.title} (copy)`,
                      notes: menu.notes,
                      exercises: cloneExercises(menu.exercises),
                      ...(menu.folder ? { folder: menu.folder } : {}),
                    });
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

      <ActionSheet
        open={!!folderMenu}
        onClose={() => setFolderMenu(null)}
        title={folderMenu?.name}
        actions={
          folderMenu
            ? [
                {
                  label: 'New routine in this folder',
                  icon: <IconPlus />,
                  onSelect: () => navigate(`/routines/new?folder=${encodeURIComponent(folderMenu.name)}`),
                },
                { label: 'Rename or change routines', icon: <IconEdit />, onSelect: () => setFolderSheet({ folder: folderMenu.name }) },
                {
                  label: 'Remove folder',
                  icon: <IconTrash />,
                  danger: true,
                  onSelect: async () => {
                    const ok = await confirmDialog({
                      title: `Remove the folder “${folderMenu.name}”?`,
                      message:
                        folderMenu.routines.length === 1
                          ? 'Its routine stays, just outside a folder.'
                          : `Its ${folderMenu.routines.length} routines stay, just outside a folder.`,
                      confirmLabel: 'Remove folder',
                    });
                    if (ok) await removeFolder(folderMenu.name);
                  },
                },
              ]
            : []
        }
      />

      <FolderSheet open={!!folderSheet} onClose={() => setFolderSheet(null)} folder={folderSheet?.folder} routines={routines ?? []} />
      <MoveToFolderSheet routine={moving} routines={routines ?? []} onClose={() => setMoving(null)} />
    </div>
  );
}

function FolderSection({ folder, collapsed, onMenu, children }: { folder: Folder; collapsed: boolean; onMenu: () => void; children: ReactNode }) {
  return (
    <section className="folder">
      <div className="folder-head">
        <button className="folder-toggle" aria-expanded={!collapsed} onClick={() => toggleFolder(folder.name)}>
          <IconChevron size={18} className={`folder-chevron ${collapsed ? '' : 'open'}`} />
          <span className="folder-name">{folder.name}</span>
          <span className="folder-count">{folder.routines.length}</span>
        </button>
        <button className="icon-btn" onClick={onMenu} aria-label={`Options for folder ${folder.name}`}>
          <IconMore />
        </button>
      </div>
      {!collapsed && <div className="routine-list">{children}</div>}
    </section>
  );
}

function SyncWarning() {
  const sync = useSyncStatus();
  if (!sync.attention) return null;
  return (
    <Link to="/settings" className="card sync-warning">
      <strong>Cloud sync has stopped</strong>
      <span>{sync.message} Tap to fix it in Settings.</span>
    </Link>
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
