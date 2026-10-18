import { IconPlus, IconTrash } from '../../components/Icons';
import { Toggle } from '../../components/ui';
import { DEFAULT_SETTINGS } from '../../db';
import { fmtNum, fmtWeight, isolate, KG_PER_LB, kgTo } from '../../lib/format';
import { defaultBar } from '../../lib/plates';
import { updateSettings, useSettings } from '../../lib/settings';
import { warmupSets } from '../../lib/warmup';
import { t } from '../../i18n';
import type { Equipment, Settings, WarmupStep } from '../../types';
import { Card, Note, SelectRow } from './controls';

const PERCENTS = Array.from({ length: 19 }, (_, i) => 5 + i * 5);
const REPS = [...Array.from({ length: 15 }, (_, i) => i + 1), 20];
const ROUND: Record<'kg' | 'lbs', number[]> = { kg: [0.5, 1, 1.25, 2, 2.5, 5], lbs: [1, 2.5, 5, 10] };
const MAX_STEPS = 6;

/** The list with the current value in it, so a value that arrived by sync still shows in its menu. */
const withValue = (list: number[], value: number) => (list.includes(value) ? list : [...list, value].sort((a, b) => a - b));

/** The steps in one line for the Settings home: "50% · 70% · 85%". */
export const warmupSummary = (s: Pick<Settings, 'warmupSteps'>) => isolate(s.warmupSteps.map((x) => `${x.percent}%`).join(' · '));

export function WarmupSection() {
  const s = useSettings();
  const unit = s.weightUnit;
  const steps = s.warmupSteps;
  const round = unit === 'kg' ? s.warmupRoundKg : s.warmupRoundLbs;
  const setSteps = (next: WarmupStep[]) => void updateSettings({ warmupSteps: next });
  const patch = (i: number, change: Partial<WarmupStep>) => setSteps(steps.map((x, k) => (k === i ? { ...x, ...change } : x)));

  function addStep() {
    const last = steps.at(-1);
    const percent = Math.min(95, Math.round(((last?.percent ?? 50) + 10) / 5) * 5);
    setSteps([...steps, { percent, reps: 3 }]);
  }

  return (
    <>
      <Note>{t('warmup.intro')}</Note>

      <Card>
        {steps.map((step, i) => (
          <div className="warmup-step" key={i} role="group" aria-label={t('warmup.stepN', { n: i + 1 })}>
            <span className="set-badge static" data-type="warmup" aria-hidden="true">
              {i + 1}
            </span>
            <select
              className="chip-select"
              aria-label={t('warmup.percentLabel', { n: i + 1 })}
              value={step.percent}
              onChange={(e) => patch(i, { percent: Number(e.target.value) })}
            >
              {withValue(PERCENTS, step.percent).map((p) => (
                <option key={p} value={p}>
                  {isolate(`${p}%`)}
                </option>
              ))}
            </select>
            <select className="chip-select" aria-label={t('warmup.repsLabel', { n: i + 1 })} value={step.reps} onChange={(e) => patch(i, { reps: Number(e.target.value) })}>
              {withValue(REPS, step.reps).map((r) => (
                <option key={r} value={r}>
                  {isolate(`× ${r}`)}
                </option>
              ))}
            </select>
            <button className="icon-btn" disabled={steps.length <= 1} onClick={() => setSteps(steps.filter((_, k) => k !== i))} aria-label={t('warmup.removeStep', { n: i + 1 })}>
              <IconTrash size={18} />
            </button>
          </div>
        ))}
        <button className="btn btn-ghost btn-block" disabled={steps.length >= MAX_STEPS} onClick={addStep}>
          <IconPlus size={18} /> {t('warmup.addStep')}
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => setSteps(DEFAULT_SETTINGS.warmupSteps)}>
          {t('warmup.reset')}
        </button>
      </Card>

      <Card>
        <div>
          <Toggle label={t('warmup.emptyBar')} checked={s.warmupEmptyBar} onChange={(warmupEmptyBar) => updateSettings({ warmupEmptyBar })} />
          <Note>{t('warmup.emptyBarNote')}</Note>
        </div>
        <SelectRow
          label={t('warmup.round')}
          value={String(round)}
          options={withValue(ROUND[unit], round).map((v) => ({ value: String(v), label: isolate(`${fmtNum(v, 2)} ${unit}`) }))}
          onChange={(v) => updateSettings(unit === 'kg' ? { warmupRoundKg: Number(v) } : { warmupRoundLbs: Number(v) })}
        />
        <Note>{t('warmup.roundNote')}</Note>
      </Card>

      <Card title={t('warmup.previewTitle')}>
        <Preview s={s} equipment="barbell" workingKg={unit === 'kg' ? 100 : 225 * KG_PER_LB} label="warmup.previewBar" />
        <Preview s={s} equipment="machine" workingKg={unit === 'kg' ? 40 : 90 * KG_PER_LB} label="warmup.previewOther" />
      </Card>
    </>
  );
}

function Preview({ s, equipment, workingKg, label }: { s: Settings; equipment: Equipment; workingKg: number; label: 'warmup.previewBar' | 'warmup.previewOther' }) {
  const unit = s.weightUnit;
  const { sets } = warmupSets({
    workingKg,
    unit,
    equipment,
    bar: defaultBar(equipment, unit),
    plates: unit === 'kg' ? s.platesKg : s.platesLbs,
    steps: s.warmupSteps,
    emptyBar: s.warmupEmptyBar,
    round: unit === 'kg' ? s.warmupRoundKg : s.warmupRoundLbs,
  });
  return (
    <div className="warmup-preview">
      <strong>{t(label, { weight: fmtWeight(workingKg, unit) })}</strong>
      <span className="muted">{isolate(sets.map((w) => `${fmtNum(kgTo(w.weight, unit), unit === 'kg' ? 2 : 1)} × ${w.reps}`).join(' · '))}</span>
    </div>
  );
}
