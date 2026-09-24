import { useState } from 'react';
import { bodyWeightChange, deleteBodyWeight, fromDateInput, logBodyWeight, toDateInput, useBodyWeights } from '../lib/bodyweight';
import { addDays, fmtDate, fmtNum, kgTo, plural, startOfDay, toKg } from '../lib/format';
import { Link } from '../lib/router';
import { useSettings } from '../lib/settings';
import type { BodyWeight, WeightUnit } from '../types';
import { LineChart, type LinePoint } from './Charts';
import { confirmDialog, toast } from './dialogs';
import { NumberField } from './fields';
import { IconPlus } from './Icons';
import { Sheet } from './Sheet';

const tickFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export function fmtBodyWeight(kg: number, unit: WeightUnit) {
  return `${fmtNum(kgTo(kg, unit), 1)} ${unit}`;
}

export function fmtChange(kg: number, unit: WeightUnit) {
  const v = Math.round(kgTo(kg, unit) * 10) / 10;
  return v === 0 ? `±0 ${unit}` : `${v > 0 ? '+' : '−'}${fmtNum(Math.abs(v), 1)} ${unit}`;
}

export function bodyWeightPoints(entries: BodyWeight[], unit: WeightUnit): LinePoint[] {
  return entries.map((b) => ({ x: b.date, y: kgTo(b.weight, unit), label: tickFmt.format(b.date) }));
}

/** Progress-tab card: latest weigh-in, 30-day change and the last 90 days. */
export function BodyWeightCard() {
  const entries = useBodyWeights();
  const { weightUnit } = useSettings();
  const [logging, setLogging] = useState(false);
  if (!entries) return null;

  const latest = entries.at(-1);
  const change = bodyWeightChange(entries);
  const since = addDays(startOfDay(Date.now()), -90);
  const recent = entries.filter((b) => b.date >= since);

  return (
    <section className="card bw-card">
      <div className="chart-head">
        <h2 className="card-title">Body weight</h2>
        <button className="btn btn-secondary btn-small" onClick={() => setLogging(true)}>
          <IconPlus size={16} /> Log
        </button>
      </div>
      {!latest ? (
        <p className="muted">Log your weight now and then to see the trend here. Once a week, same time of day, works well.</p>
      ) : (
        <>
          <div className="bw-latest">
            <span className="bw-value tabular">{fmtBodyWeight(latest.weight, weightUnit)}</span>
            <span className="muted small">
              {change
                ? `${fmtChange(change.kg, weightUnit)} ${change.full ? 'in 30 days' : `since ${fmtDate(change.from)}`}`
                : `on ${fmtDate(latest.date)}`}
            </span>
          </div>
          {recent.length > 1 && (
            <LineChart
              points={bodyWeightPoints(recent, weightUnit)}
              format={(v) => `${fmtNum(v, 1)} ${weightUnit}`}
              caption={`Body weight, last 90 days (${weightUnit})`}
              height={150}
            />
          )}
          <Link to="/profile/bodyweight" className="bw-more small">
            {entries.length > 1 ? `All ${plural(entries.length, 'weigh-in')}` : 'History'}
          </Link>
        </>
      )}
      <WeighInSheet open={logging} onClose={() => setLogging(false)} />
    </section>
  );
}

/** Log a new weigh-in, or edit or delete `entry`. */
export function WeighInSheet({ open, onClose, entry }: { open: boolean; onClose: () => void; entry?: BodyWeight }) {
  const entries = useBodyWeights();
  return (
    <Sheet open={open} onClose={onClose} title={entry ? 'Edit weigh-in' : 'Log body weight'}>
      {open && entries && <WeighInForm entries={entries} entry={entry} onDone={onClose} />}
    </Sheet>
  );
}

function WeighInForm({ entries, entry, onDone }: { entries: BodyWeight[]; entry?: BodyWeight; onDone: () => void }) {
  const { weightUnit } = useSettings();
  // A new weigh-in starts from the last one, which is usually within a kilo.
  const start = entry?.weight ?? entries.at(-1)?.weight;
  const [value, setValue] = useState<number | undefined>(start !== undefined ? Math.round(kgTo(start, weightUnit) * 10) / 10 : undefined);
  const [date, setDate] = useState(toDateInput(entry?.date ?? Date.now()));
  const day = fromDateInput(date);
  const valid = value !== undefined && value > 0 && value < 1000 && day !== undefined && day <= Date.now();

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        await logBodyWeight(day!, toKg(value!, weightUnit), entry?.id);
        toast(entry ? 'Weigh-in updated' : `Logged ${fmtNum(value!, 1)} ${weightUnit}`);
        onDone();
      }}
    >
      <div className="bw-fields">
        <label className="field">
          <span>Weight ({weightUnit})</span>
          <NumberField value={value} onChange={setValue} decimals={1} autoFocus={!entry} aria-label={`Body weight in ${weightUnit}`} />
        </label>
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} max={toDateInput(Date.now())} onChange={(e) => setDate(e.target.value)} required />
        </label>
      </div>
      {!entry && entries.some((b) => b.date === day) && <p className="muted small">This replaces the weigh-in already logged for that day.</p>}
      <div className="form-actions">
        {entry && (
          <button
            type="button"
            className="btn btn-danger-ghost"
            onClick={async () => {
              const ok = await confirmDialog({ title: 'Delete this weigh-in?', message: fmtDate(entry.date), confirmLabel: 'Delete', danger: true });
              if (!ok) return;
              await deleteBodyWeight(entry.id);
              onDone();
            }}
          >
            Delete
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          Save
        </button>
      </div>
    </form>
  );
}
