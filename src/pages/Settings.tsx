import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { IconDownload, IconUpload } from '../components/Icons';
import { InstallSettings } from '../components/InstallPrompt';
import { Sheet } from '../components/Sheet';
import { SyncSettings } from '../components/SyncSettings';
import { PageHeader, Segmented, Stat, Toggle } from '../components/ui';
import { db } from '../db';
import { exportBackup, parseBackup, restoreBackup, wipeAllData, type ParsedBackup } from '../lib/backup';
import { saveFile } from '../lib/csv';
import { useData } from '../lib/data';
import { fmtDate, fmtRest, plural } from '../lib/format';
import { applyImport, parseHevyCsv, planHevyImport, toHevyCsv, type ImportPlan } from '../lib/hevy';
import { navigate } from '../lib/router';
import { updateSettings, useSettings } from '../lib/settings';
import { createRoutinesFromHistory } from '../lib/workouts';

const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const today = () => new Date().toISOString().slice(0, 10);
/** "a", "a and b", "a, b and c" */
const listJoin = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

export function SettingsPage() {
  const settings = useSettings();
  const { workouts, exerciseMap } = useData();
  const routineCount = useLiveQuery(() => db.routines.count(), []);
  const hevyInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [importing, setImporting] = useState(false);
  const [storage, setStorage] = useState<{ persisted: boolean; usedMb?: number }>();

  useEffect(() => {
    void (async () => {
      const persisted = (await navigator.storage?.persisted?.()) ?? false;
      const est = await navigator.storage?.estimate?.();
      setStorage({ persisted, usedMb: est?.usage !== undefined ? est.usage / 1024 / 1024 : undefined });
    })();
  }, []);

  async function onHevyFile(file: File) {
    try {
      const parsed = parseHevyCsv(await file.text());
      if (!parsed.length) throw new Error('No workouts found in this file.');
      setPlan(await planHevyImport(parsed));
    } catch (e) {
      toast((e as Error).message);
    }
  }

  async function onBackupFile(file: File) {
    let backup: ParsedBackup;
    try {
      backup = parseBackup(await file.text());
    } catch (e) {
      toast((e as Error).message);
      return;
    }
    const parts = [
      [backup.workouts.length, 'workout'],
      [backup.routines.length, 'routine'],
      [backup.exercises.length, 'exercise'],
      [backup.bodyweight.length, 'weigh-in'],
    ] as const;
    const contents = parts.filter(([n]) => n > 0).map(([n, word]) => plural(n, word));
    if (!contents.length && !backup.settings) {
      toast(backup.skipped ? 'Everything in this backup is damaged, so there is nothing to restore.' : 'This backup is empty.');
      return;
    }
    const ok = await confirmDialog({
      title: 'Restore this backup?',
      message: [
        `${backup.exportedAt ? `From ${fmtDate(backup.exportedAt)}: ` : ''}${contents.length ? listJoin(contents) : 'settings only'}.`,
        'Anything also on this device is replaced by the backup’s copy. Nothing else is deleted.',
        backup.settings ? 'Your settings are replaced too.' : '',
        backup.skipped ? `${plural(backup.skipped, 'damaged record')} in the file will be left out.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      confirmLabel: 'Restore',
    });
    if (!ok) return;
    await restoreBackup(backup);
    toast(`Restored ${contents.length ? listJoin(contents) : 'your settings'}`);
  }

  async function runImport() {
    if (!plan) return;
    setImporting(true);
    try {
      await applyImport(plan);
      const count = plan.workouts.length;
      setPlan(null);
      toast(`Imported ${plural(count, 'workout')}`);
      if (count && !routineCount) {
        const make = await confirmDialog({
          title: 'Turn your usual workouts into routines?',
          message: 'Each workout name you repeat (like "Chest day") becomes a routine built from your latest session. You can edit them later.',
          confirmLabel: 'Create routines',
          cancelLabel: 'Not now',
        });
        if (make) {
          const created = await createRoutinesFromHistory();
          toast(`Created ${plural(created.length, 'routine')}: ${created.join(', ')}`);
        }
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="page">
      <PageHeader back="/profile" title="Settings" />

      <InstallSettings />
      <SyncSettings />

      <section className="card settings-group">
        <h2 className="card-title">Units</h2>
        <div className="setting">
          <span>Weight</span>
          <Segmented
            label="Weight unit"
            value={settings.weightUnit}
            onChange={(weightUnit) => updateSettings({ weightUnit })}
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lbs', label: 'lbs' },
            ]}
          />
        </div>
        <div className="setting">
          <span>Distance</span>
          <Segmented
            label="Distance unit"
            value={settings.distanceUnit}
            onChange={(distanceUnit) => updateSettings({ distanceUnit })}
            options={[
              { value: 'km', label: 'km' },
              { value: 'mi', label: 'mi' },
            ]}
          />
        </div>
      </section>

      <section className="card settings-group">
        <h2 className="card-title">During workouts</h2>
        <label className="setting">
          <span>Default rest timer</span>
          <select
            className="chip-select"
            value={settings.defaultRest}
            onChange={(e) => updateSettings({ defaultRest: Number(e.target.value) })}
          >
            {REST_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {fmtRest(r)}
              </option>
            ))}
          </select>
        </label>
        <Toggle label="Sound when rest ends" checked={settings.timerSound} onChange={(timerSound) => updateSettings({ timerSound })} />
        {settings.timerSound && (
          <div>
            <Toggle
              label="Rest alert with the screen off"
              checked={settings.timerLockScreen}
              onChange={(timerLockScreen) => updateSettings({ timerLockScreen })}
            />
            <p className="muted small">
              Keeps the rest timer running with your phone locked or in your pocket. The rest shows on the lock screen, where the
              skip buttons add or take off 15 seconds and pause ends it.
            </p>
          </div>
        )}
        <Toggle
          label="Vibrate when rest ends (Android)"
          checked={settings.timerVibrate}
          onChange={(timerVibrate) => updateSettings({ timerVibrate })}
        />
        <Toggle label="Keep screen on" checked={settings.keepAwake} onChange={(keepAwake) => updateSettings({ keepAwake })} />
      </section>

      <section className="card settings-group">
        <h2 className="card-title">Appearance</h2>
        <div className="setting">
          <span>Theme</span>
          <Segmented
            label="Theme"
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'Auto' },
            ]}
          />
        </div>
      </section>

      <section className="card settings-group">
        <h2 className="card-title">Your data</h2>
        <p className="muted small">
          Your data lives on this device. Without cloud sync, back it up now and then — clearing the browser’s site data erases it.
        </p>
        <button className="btn btn-secondary btn-block" onClick={() => hevyInput.current?.click()}>
          <IconUpload size={18} /> Import from Hevy (CSV)
        </button>
        <p className="muted small">In Hevy: Profile → Settings → Export &amp; import data → Export workouts.</p>
        <input
          ref={hevyInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void onHevyFile(f);
          }}
        />
        <div className="button-pair">
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await saveFile(`setward-backup-${today()}.json`, await exportBackup(), 'application/json');
            }}
          >
            <IconDownload size={18} /> Back up data
          </button>
          <button className="btn btn-ghost" onClick={() => backupInput.current?.click()}>
            <IconUpload size={18} /> Restore backup
          </button>
        </div>
        <input
          ref={backupInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) await onBackupFile(f);
          }}
        />
        <button
          className="btn btn-ghost btn-block"
          disabled={!workouts.length}
          onClick={() => saveFile(`setward-workouts-${today()}.csv`, toHevyCsv(workouts, exerciseMap), 'text/csv')}
        >
          <IconDownload size={18} /> Export workouts as CSV
        </button>
        {storage && (
          <p className="muted small">
            {storage.persisted ? 'Storage is protected from automatic clean-up.' : 'The browser may clear storage when space runs low — keep a backup.'}
            {storage.usedMb !== undefined && ` Using ${storage.usedMb.toFixed(1)} MB.`}
          </p>
        )}
      </section>

      <section className="card settings-group">
        <h2 className="card-title">Danger zone</h2>
        <button
          className="btn btn-danger-ghost btn-block"
          onClick={async () => {
            const ok = await confirmDialog({
              title: 'Erase all workouts, routines and your exercises?',
              message: "This can't be undone. It also turns off cloud sync here; the copy in your sync repository is kept.",
              confirmLabel: 'Erase everything',
              danger: true,
            });
            if (!ok) return;
            await wipeAllData();
            toast('All data erased');
            navigate('/', { replace: true });
          }}
        >
          Erase all data
        </button>
      </section>

      <p className="muted small about">
        Setward v{__APP_VERSION__} · Free and open. Exercise library from{' '}
        <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
          free-exercise-db
        </a>{' '}
        (public domain).
      </p>

      <Sheet open={!!plan} onClose={() => setPlan(null)} title="Import from Hevy">
        {plan && (
          <div className="import-preview">
            <div className="stat-row">
              <Stat label="New workouts" value={plan.workouts.length} />
              <Stat label="New exercises" value={plan.newExercises.length} />
              <Stat label="Matched" value={plan.matchedExercises} />
            </div>
            {plan.workouts.length > 0 && (
              <p className="muted">
                {fmtDate(plan.workouts[0].startTime)} → {fmtDate(plan.workouts.at(-1)!.startTime)}
              </p>
            )}
            {plan.duplicates > 0 && <p className="muted">{plural(plan.duplicates, 'workout')} already here will be skipped.</p>}
            {plan.newExercises.length > 0 && (
              <details>
                <summary>Exercises that will be added to your list</summary>
                <ul className="plain-list">
                  {plan.newExercises.map((e) => (
                    <li key={e.id}>{e.name}</li>
                  ))}
                </ul>
              </details>
            )}
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setPlan(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={!plan.workouts.length || importing} onClick={runImport}>
                {plan.workouts.length ? `Import ${plural(plan.workouts.length, 'workout')}` : 'Nothing new to import'}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
