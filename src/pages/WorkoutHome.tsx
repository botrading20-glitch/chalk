import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState, type ReactNode } from 'react';
import { Brand } from '../components/Brand';
import { confirmDialog, toast } from '../components/dialogs';
import { IconChevron, IconCopy, IconEdit, IconFolder, IconFolderPlus, IconGrip, IconMore, IconPlay, IconPlus, IconTrash } from '../components/Icons';
import { BackupReminder } from '../components/BackupReminder';
import { InstallBanner } from '../components/InstallPrompt';
import { FolderSheet, MoveToFolderSheet, ReorderSheet } from '../components/RoutineFolders';
import { ActionSheet } from '../components/Sheet';
import { Empty, PageHeader } from '../components/ui';
import { ReportCard } from '../components/ReportCard';
import { WeekCard } from '../components/WeekCard';
import { db } from '../db';
import { useData, useNow } from '../lib/data';
import { groupRoutines, removeFolder, toggleFolder, useCollapsedFolders, type Folder } from '../lib/folders';
import { fmtClock, fmtDate, startOfDay, uid } from '../lib/format';
import { Link, navigate, useRoute } from '../lib/router';
import { useSettings } from '../lib/settings';
import { useWelcomeGate } from '../lib/welcome';
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
import { count, t } from '../i18n';

export async function beginWorkout(opts: { title?: string; exercises?: WorkoutExercise[]; routineId?: string } = {}) {
  const running = await db.kv.get('active');
  if (running) {
    const ok = await confirmDialog({
      title: t('home.runningTitle'),
      message: t('home.runningText'),
      confirmLabel: t('home.runningConfirm'),
      cancelLabel: t('home.runningCancel'),
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
  /** The folder being reordered; `folder` is absent for the routines in no folder. */
  const [reorder, setReorder] = useState<{ folder?: string } | null>(null);
  const collapsed = useCollapsedFolders();
  const welcome = useWelcomeGate();
  // A home-screen shortcut (`#/?action=start`) is on its way somewhere else: let it go first.
  const launching = useRoute().query.has('action');
  // A brand-new install opens on the welcome screen; anyone with data never sees it.
  useEffect(() => {
    if (welcome && !launching) navigate('/welcome', { replace: true });
  }, [welcome, launching]);
  const { folders, loose } = groupRoutines(routines ?? []);
  const groupOf = (folder?: string) => (folder ? (folders.find((f) => f.name === folder)?.routines ?? []) : loose);
  const card = (r: Routine) => <RoutineCard key={r.id} routine={r} onMenu={() => setMenu(r)} />;

  if (welcome === undefined || welcome || launching) return null;

  return (
    <div className="page">
      <PageHeader large title={t('tab.workout')} actions={<Brand />} />

      <SyncWarning />
      <BackupReminder />
      {active ? <ResumeCard /> : null}
      <WeekCard />
      <ReportCard />
      <InstallBanner />

      <button className="btn btn-glow btn-block btn-hero" onClick={() => beginWorkout()}>
        <IconPlus /> {t('live.startEmpty')}
      </button>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{t('home.routines')}</h2>
          <div className="section-actions">
            {!!routines?.length && (
              <button className="icon-btn" onClick={() => setFolderSheet({})} aria-label={t('folder.new')}>
                <IconFolderPlus />
              </button>
            )}
            <Link to="/routines/new" className="btn btn-ghost btn-small">
              <IconPlus size={18} /> {t('home.newRoutine')}
            </Link>
          </div>
        </div>

        {routines && routines.length === 0 && (
          <Empty
            title={t('home.noRoutines')}
            action={
              <div className="empty-actions">
                <Link to="/programs" className="btn btn-secondary">
                  {t('prog.browse')}
                </Link>
                {workouts.length > 0 && (
                  <button
                    className="btn btn-ghost"
                    onClick={async () => {
                      const created = await createRoutinesFromHistory();
                      toast(created.length ? t('home.created', { n: created.length }) : t('home.noRepeats'));
                    }}
                  >
                    {t('home.fromHistory')}
                  </button>
                )}
              </div>
            }
          >
            {t('home.noRoutinesText')}
          </Empty>
        )}

        {folders.map((f) => (
          <FolderSection key={f.name} folder={f} collapsed={collapsed.has(f.name)} onMenu={() => setFolderMenu(f)}>
            {f.routines.map(card)}
          </FolderSection>
        ))}
        {folders.length > 0 && loose.length > 0 && <h3 className="list-label">{t('home.notInFolder')}</h3>}
        <div className="routine-list">{loose.map(card)}</div>
        {!!routines?.length && (
          <Link to="/programs" className="btn btn-ghost btn-block">
            {t('prog.browse')}
          </Link>
        )}
      </section>

      <ActionSheet
        open={!!menu}
        onClose={() => setMenu(null)}
        title={menu?.title}
        actions={
          menu
            ? [
                { label: t('home.editRoutine'), icon: <IconEdit />, onSelect: () => navigate(`/routines/${menu.id}`) },
                { label: menu.folder ? t('home.moveToAnother') : t('home.moveToFolder'), icon: <IconFolder />, onSelect: () => setMoving(menu) },
                {
                  label: t('home.reorder'),
                  icon: <IconGrip />,
                  hidden: groupOf(menu.folder?.trim() || undefined).length < 2,
                  onSelect: () => setReorder({ folder: menu.folder?.trim() || undefined }),
                },
                {
                  label: t('home.duplicate'),
                  icon: <IconCopy />,
                  onSelect: async () => {
                    await saveRoutine({
                      id: uid(),
                      title: t('home.copyTitle', { title: menu.title }),
                      notes: menu.notes,
                      exercises: cloneExercises(menu.exercises),
                      ...(menu.folder ? { folder: menu.folder } : {}),
                    });
                    toast(t('home.duplicated'));
                  },
                },
                {
                  label: t('home.deleteRoutine'),
                  icon: <IconTrash />,
                  danger: true,
                  onSelect: async () => {
                    const ok = await confirmDialog({
                      title: t('home.deleteTitle', { title: menu.title }),
                      message: t('home.deleteText'),
                      confirmLabel: t('home.deleteRoutine'),
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
                  label: t('home.newInFolder'),
                  icon: <IconPlus />,
                  onSelect: () => navigate(`/routines/new?folder=${encodeURIComponent(folderMenu.name)}`),
                },
                {
                  label: t('home.reorder'),
                  icon: <IconGrip />,
                  hidden: folderMenu.routines.length < 2,
                  onSelect: () => setReorder({ folder: folderMenu.name }),
                },
                { label: t('home.renameFolder'), icon: <IconEdit />, onSelect: () => setFolderSheet({ folder: folderMenu.name }) },
                {
                  label: t('home.removeFolder'),
                  icon: <IconTrash />,
                  danger: true,
                  onSelect: async () => {
                    const ok = await confirmDialog({
                      title: t('home.removeFolderTitle', { name: folderMenu.name }),
                      message:
                        folderMenu.routines.length === 1
                          ? t('home.removeFolderOne')
                          : t('home.removeFolderMany', { n: folderMenu.routines.length }),
                      confirmLabel: t('home.removeFolder'),
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
      <ReorderSheet
        open={!!reorder}
        title={reorder?.folder ? t('home.reorderFolder', { folder: reorder.folder }) : t('home.reorder')}
        routines={groupOf(reorder?.folder)}
        onClose={() => setReorder(null)}
      />
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
        <button className="icon-btn" onClick={onMenu} aria-label={t('home.folderOptions', { name: folder.name })}>
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
      <strong>{t('home.syncStopped')}</strong>
      <span>{t('home.syncFix', { message: sync.message ?? '' })}</span>
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
        <span className="eyebrow">{t('home.inProgress')}</span>
        <h2 className="resume-title">{active.title}</h2>
        <span className="muted tabular">{fmtClock((now - active.startTime) / 1000)}</span>
      </div>
      <div className="resume-actions">
        <button
          className="btn btn-ghost btn-small"
          onClick={async () => {
            const ok = await confirmDialog({
              title: t('live.discardTitle'),
              message: t('live.discardText'),
              confirmLabel: t('live.discardWorkout'),
              danger: true,
            });
            if (ok) await discardActive();
          }}
        >
          {t('common.discard')}
        </button>
        <Link to="/workout" className="btn btn-primary btn-small">
          {t('banner.resume')}
        </Link>
      </div>
    </div>
  );
}

function lastDone(ts: number) {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86_400_000);
  if (days === 0) return t('home.lastToday');
  if (days === 1) return t('home.lastYesterday');
  if (days < 7) return t('home.lastDaysAgo', { n: days });
  return t('home.lastOn', { date: fmtDate(ts) });
}

function RoutineCard({ routine, onMenu }: { routine: Routine; onMenu: () => void }) {
  const { exerciseMap, workouts } = useData();
  const names = routine.exercises.map((we) => exerciseMap.get(we.exerciseId)?.name ?? t('exercise.deleted'));
  const setCount = routine.exercises.reduce((n, we) => n + we.sets.length, 0);
  const key = routine.title.trim().toLowerCase();
  const last = workouts.find((w) => w.routineId === routine.id || w.title.trim().toLowerCase() === key);
  const { compactRoutines } = useSettings();

  return (
    <article className={`card routine-card ${compactRoutines ? 'compact' : ''}`}>
      <header className="routine-head">
        <Link to={`/routines/${routine.id}`} className="routine-title">
          {routine.title}
        </Link>
        <button className="icon-btn" onClick={onMenu} aria-label={t('home.routineOptions', { title: routine.title })}>
          <IconMore />
        </button>
      </header>
      <p className="routine-exercises">
        {names.slice(0, 4).join(t('common.comma'))}
        {names.length > 4 && t('home.moreNames', { n: names.length - 4 })}
      </p>
      <p className="routine-meta">
        {t('home.meta', { exercises: count('exercise', routine.exercises.length), sets: count('set', setCount) })}
        {last && ` · ${lastDone(last.startTime)}`}
      </p>
      <button
        className="btn btn-secondary btn-block"
        onClick={() => beginWorkout({ title: routine.title, exercises: routine.exercises, routineId: routine.id })}
      >
        <IconPlay size={16} /> {t('home.startRoutine')}
      </button>
    </article>
  );
}
