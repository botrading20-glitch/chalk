import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { DataCheck } from '../../components/DataCheck';
import { confirmDialog, toast } from '../../components/dialogs';
import { IconDownload, IconUpload } from '../../components/Icons';
import { Sheet } from '../../components/Sheet';
import { Segmented, Stat } from '../../components/ui';
import { db, setKV } from '../../db';
import { exportFileName, parseBackup, restoreBackup, saveBackupFile, wipeAllData, type ParsedBackup } from '../../lib/backup';
import { saveFile } from '../../lib/csv';
import { useData, useNow } from '../../lib/data';
import { toSetwardCsv } from '../../lib/exportCsv';
import { fmtDate, listJoin } from '../../lib/format';
import { applyImport, planImport, readWorkoutCsv, type ImportPlan } from '../../lib/importer';
import { usePref } from '../../lib/prefs';
import { navigate } from '../../lib/router';
import { updateSettings, useSettings } from '../../lib/settings';
import { requestSync } from '../../lib/sync';
import { createRoutinesFromHistory } from '../../lib/workouts';
import { count, t } from '../../i18n';
import type { Key } from '../../i18n/catalog';
import type { WeightUnit } from '../../types';
import { backupSummary } from './Home';
import { VideosCard } from './VideosCard';
import { Card, Note, StackRow } from './controls';

/** A CSV the user picked: kept as text so the plan can be redone when they correct the weight unit. */
interface PickedFile {
  text: string;
  needsWeightUnit: boolean;
  unit: WeightUnit;
}

export function DataSection() {
  const settings = useSettings();
  const { workouts, exerciseMap } = useData();
  const routineCount = useLiveQuery(() => db.routines.count(), []);
  const lastBackupAt = usePref('lastBackupAt');
  const now = useNow(60_000);
  const csvInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [importing, setImporting] = useState(false);
  const [checkingData, setCheckingData] = useState(false);
  const [storage, setStorage] = useState<{ persisted: boolean; usedMb?: number }>();

  useEffect(() => {
    void (async () => {
      const persisted = (await navigator.storage?.persisted?.()) ?? false;
      const est = await navigator.storage?.estimate?.();
      setStorage({ persisted, usedMb: est?.usage !== undefined ? est.usage / 1024 / 1024 : undefined });
    })();
  }, []);

  async function readPicked(text: string, unit: WeightUnit) {
    const reading = readWorkoutCsv(text, { weightUnit: unit });
    if (!reading.workouts.length) throw new Error(t('imp.none'));
    setPicked({ text, needsWeightUnit: reading.needsWeightUnit, unit });
    setPlan(await planImport(reading.workouts));
  }

  async function onCsvFile(file: File) {
    try {
      await readPicked(await file.text(), settings.weightUnit);
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
      [backup.bodyweight.length, 'weighIn'],
    ] as const;
    const contents = parts.filter(([n]) => n > 0).map(([n, noun]) => count(noun, n));
    if (!contents.length && !backup.settings) {
      toast(backup.skipped ? t('bk.allDamaged') : t('bk.empty'));
      return;
    }
    const list = contents.length ? listJoin(contents) : t('bk.settingsOnly');
    const ok = await confirmDialog({
      title: t('bk.title'),
      message: [
        backup.exportedAt ? t('bk.from', { date: fmtDate(backup.exportedAt), contents: list }) : t('bk.contents', { contents: list }),
        t('bk.replaces'),
        backup.settings ? t('bk.settingsToo') : '',
        backup.skipped ? t('bk.skipped', { n: backup.skipped }) : '',
      ]
        .filter(Boolean)
        .join(' '),
      confirmLabel: t('bk.confirm'),
    });
    if (!ok) return;
    await restoreBackup(backup);
    toast(t('bk.restored', { contents: contents.length ? listJoin(contents) : t('bk.yourSettings') }));
  }

  async function backUp() {
    if (await saveBackupFile()) toast(t('bk.saved'));
  }

  async function runImport() {
    if (!plan) return;
    setImporting(true);
    try {
      await applyImport(plan);
      const n = plan.workouts.length;
      setPlan(null);
      setPicked(null);
      toast(t('imp.imported', { n }));
      if (n && !routineCount) {
        const make = await confirmDialog({
          title: t('imp.makeTitle'),
          message: t('imp.makeText'),
          confirmLabel: t('imp.makeConfirm'),
          cancelLabel: t('imp.makeCancel'),
        });
        if (make) {
          const created = await createRoutinesFromHistory();
          toast(t('imp.created', { n: created.length, names: created.join(t('common.comma')) }));
        }
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <Note>{t('set.dataIntro')}</Note>

      <Card>
        <button className="btn btn-secondary btn-block" onClick={() => void backUp()}>
          <IconDownload size={18} /> {t('set.backupNow')}
        </button>
        <Note>{lastBackupAt ? backupSummary(lastBackupAt, now) : t('set.backupNever')}</Note>
        <StackRow label={t('set.reminder')}>
          <Segmented
            label={t('set.reminder')}
            value={settings.backupReminder}
            onChange={(backupReminder) => updateSettings({ backupReminder })}
            options={(['off', 'weekly', 'monthly'] as const).map((r) => ({ value: r, label: t(`set.reminder.${r}` as Key) }))}
          />
        </StackRow>
        <Note>{t('set.reminderNote')}</Note>
        <button className="btn btn-ghost btn-block" onClick={() => backupInput.current?.click()}>
          <IconUpload size={18} /> {t('set.restore')}
        </button>
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
      </Card>

      <Card>
        <button className="btn btn-secondary btn-block" onClick={() => csvInput.current?.click()}>
          <IconUpload size={18} /> {t('set.import')}
        </button>
        <Note>{t('set.importNote')}</Note>
        <input
          ref={csvInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void onCsvFile(f);
          }}
        />
        <button
          className="btn btn-ghost btn-block"
          disabled={!workouts.length}
          onClick={() => saveFile(exportFileName('workouts', 'csv'), toSetwardCsv(workouts, exerciseMap), 'text/csv')}
        >
          <IconDownload size={18} /> {t('set.exportCsv')}
        </button>
      </Card>

      <VideosCard />

      <Card>
        <button className="btn btn-ghost btn-block" onClick={() => setCheckingData(true)}>
          {t('set.check')}
        </button>
        {storage && (
          <Note>
            {storage.persisted ? t('set.storageProtected') : t('set.storageAtRisk')}
            {storage.usedMb !== undefined && ` ${t('set.storageUsed', { mb: storage.usedMb.toFixed(1) })}`}
          </Note>
        )}
        <button
          className="btn btn-ghost btn-block"
          onClick={async () => {
            const ok = await confirmDialog({ title: t('set.resetTitle'), message: t('set.resetText'), confirmLabel: t('set.reset') });
            if (!ok) return;
            await setKV('settings', {});
            requestSync();
            toast(t('set.resetDone'));
          }}
        >
          {t('set.reset')}
        </button>
      </Card>

      <Card title={t('set.danger')}>
        <button
          className="btn btn-danger-ghost btn-block"
          onClick={async () => {
            const ok = await confirmDialog({
              title: t('set.eraseTitle'),
              message: t('set.eraseText'),
              confirmLabel: t('set.eraseConfirm'),
              danger: true,
            });
            if (!ok) return;
            await wipeAllData();
            toast(t('set.erased'));
            navigate('/', { replace: true });
          }}
        >
          {t('set.erase')}
        </button>
      </Card>

      <Sheet open={checkingData} onClose={() => setCheckingData(false)} title={t('set.checkTitle')}>
        <DataCheck />
      </Sheet>

      <Sheet
        open={!!plan}
        onClose={() => {
          setPlan(null);
          setPicked(null);
        }}
        title={t('imp.title')}
      >
        {plan && (
          <div className="import-preview">
            {picked?.needsWeightUnit && (
              <div className="setting">
                <span>{t('imp.fileUnit')}</span>
                <Segmented
                  label={t('imp.fileUnitLabel')}
                  value={picked.unit}
                  onChange={(unit) => void readPicked(picked.text, unit).catch((e) => toast((e as Error).message))}
                  options={[
                    { value: 'kg', label: t('common.kg') },
                    { value: 'lbs', label: t('common.lbs') },
                  ]}
                />
              </div>
            )}
            <div className="stat-row">
              <Stat label={t('imp.newWorkouts')} value={plan.workouts.length} />
              <Stat label={t('imp.newExercises')} value={plan.newExercises.length} />
              <Stat label={t('imp.matched')} value={plan.matchedExercises} />
            </div>
            {plan.workouts.length > 0 && (
              <p className="muted">{t('imp.range', { from: fmtDate(plan.workouts[0].startTime), to: fmtDate(plan.workouts.at(-1)!.startTime) })}</p>
            )}
            {plan.duplicates > 0 && <p className="muted">{t('imp.duplicates', { n: plan.duplicates })}</p>}
            {plan.newExercises.length > 0 && (
              <details>
                <summary>{t('imp.willAdd')}</summary>
                <ul className="plain-list">
                  {plan.newExercises.map((e) => (
                    <li key={e.id}>{e.name}</li>
                  ))}
                </ul>
              </details>
            )}
            <div className="form-actions">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setPlan(null);
                  setPicked(null);
                }}
              >
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" disabled={!plan.workouts.length || importing} onClick={runImport}>
                {plan.workouts.length ? t('imp.go', { n: plan.workouts.length }) : t('imp.nothingNew')}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
