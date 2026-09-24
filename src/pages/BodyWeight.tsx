import { useMemo, useState } from 'react';
import { bodyWeightPoints, fmtBodyWeight, fmtChange, WeighInSheet } from '../components/BodyWeight';
import { LineChart } from '../components/Charts';
import { IconPlus } from '../components/Icons';
import { Empty, PageHeader, Segmented } from '../components/ui';
import { useBodyWeights } from '../lib/bodyweight';
import { addDays, fmtDate, fmtNum, fmtRelativeDay, startOfDay } from '../lib/format';
import { useSettings } from '../lib/settings';
import type { BodyWeight } from '../types';

type Range = '3m' | '1y' | 'all';
const RANGE_DAYS: Record<Range, number> = { '3m': 91, '1y': 365, all: Infinity };

export function BodyWeightPage() {
  const entries = useBodyWeights();
  const { weightUnit } = useSettings();
  const [range, setRange] = useState<Range>('3m');
  const [editing, setEditing] = useState<BodyWeight | 'new' | null>(null);

  const shown = useMemo(() => {
    if (!entries) return [];
    const days = RANGE_DAYS[range];
    const since = days === Infinity ? -Infinity : addDays(startOfDay(Date.now()), -days);
    return entries.filter((b) => b.date >= since);
  }, [entries, range]);

  if (!entries) return null;
  const newestFirst = [...entries].reverse();

  return (
    <div className="page">
      <PageHeader
        back="/profile"
        title="Body weight"
        actions={
          <button className="btn btn-secondary btn-small" onClick={() => setEditing('new')}>
            <IconPlus size={16} /> Log
          </button>
        }
      />

      {entries.length === 0 ? (
        <Empty
          title="No weigh-ins yet"
          action={
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              Log body weight
            </button>
          }
        >
          Weigh yourself now and then, ideally at the same time of day, and the trend shows up here.
        </Empty>
      ) : (
        <>
          <section className="card chart-card">
            <h2 className="card-title">Trend ({weightUnit})</h2>
            {shown.length > 1 ? (
              <LineChart points={bodyWeightPoints(shown, weightUnit)} format={(v) => `${fmtNum(v, 1)} ${weightUnit}`} caption={`Body weight (${weightUnit})`} />
            ) : (
              <p className="muted chart-empty">Log at least two weigh-ins in this period to see a trend.</p>
            )}
            <Segmented
              label="Period"
              value={range}
              onChange={setRange}
              options={[
                { value: '3m', label: '3 months' },
                { value: '1y', label: 'Year' },
                { value: 'all', label: 'All' },
              ]}
            />
          </section>

          <ul className="bw-list">
            {newestFirst.map((b, i) => {
              const previous = newestFirst[i + 1];
              return (
                <li key={b.id}>
                  <button className="bw-row" onClick={() => setEditing(b)}>
                    <span className="bw-row-date">
                      <strong>{fmtRelativeDay(b.date)}</strong>
                      {fmtRelativeDay(b.date) !== fmtDate(b.date) && <span className="muted small">{fmtDate(b.date)}</span>}
                    </span>
                    {previous && <span className="muted small tabular">{fmtChange(b.weight - previous.weight, weightUnit)}</span>}
                    <span className="bw-row-value tabular">{fmtBodyWeight(b.weight, weightUnit)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <WeighInSheet open={editing !== null} onClose={() => setEditing(null)} entry={editing && editing !== 'new' ? editing : undefined} />
    </div>
  );
}
