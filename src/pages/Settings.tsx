import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { IconDownload, IconUpload } from '../components/Icons';
import { Sheet } from '../components/Sheet';
import { PageHeader, Segmented, Stat, Toggle } from '../components/ui';
import { db } from '../db';
import { exportBackup, importBackup, wipeAllData } from '../lib/backup';
import { saveFile } from '../lib/csv';
import { useData } from '../lib/data';
import { fmtDate, fmtRest, plural } from '../lib/format';
import { applyImport, parseHevyCsv, planHevyImport, toHevyCsv, type ImportPlan } from '../lib/hevy';
import { navigate } from '../lib/router';
import { updateSettings, useSettings } from '../lib/settings';
import { createRoutinesFromHistory } from '../lib/workouts';

const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const today = () => new Date().toISOString().slice(0, 10);

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
          Everything is stored on this device only. Back it up now and then — clearing the browser's site data erases it.
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
              await saveFile(`chalk-backup-${today()}.json`, await exportBackup(), 'application/json');
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
            if (!f) return;
            try {
              const r = await importBackup(await f.text());
              toast(`Restored ${plural(r.workouts, 'workout')} and ${plural(r.routines, 'routine')}`);
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        />
        <button
          className="btn btn-ghost btn-block"
          disabled={!workouts.length}
          onClick={() => saveFile(`chalk-workouts-${today()}.csv`, toHevyCsv(workouts, exerciseMap), 'text/csv')}
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
              message: "This can't be undone. Back up first if you might want them later.",
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
        Chalk v{__APP_VERSION__} · Free and open. Exercise library from{' '}
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
