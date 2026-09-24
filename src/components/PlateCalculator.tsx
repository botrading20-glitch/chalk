import { useState, type CSSProperties } from 'react';
import { fmtNum, kgTo, toKg } from '../lib/format';
import { BAR_OPTIONS, calculatePlates, DEFAULT_PLATES, defaultBar, type Load } from '../lib/plates';
import { updateSettings, useSettings } from '../lib/settings';
import type { Exercise, WeightUnit } from '../types';
import { NumberField } from './fields';
import { Sheet } from './Sheet';
import { Segmented } from './ui';

// Bumper-plate colours, matching the set badges: red, blue, yellow, green,
// white, then the small change plates. Index follows DEFAULT_PLATES[unit].
const LOOK: Record<WeightUnit, { color: string; height: number; width: number }[]> = {
  kg: [
    { color: 'var(--fail)', height: 100, width: 20 },
    { color: 'var(--drop)', height: 100, width: 18 },
    { color: 'var(--warm)', height: 92, width: 16 },
    { color: 'var(--done)', height: 84, width: 13 },
    { color: 'var(--text)', height: 62, width: 10 },
    { color: 'var(--fail)', height: 50, width: 8 },
    { color: 'var(--text-3)', height: 40, width: 6 },
  ],
  lbs: [
    { color: 'var(--drop)', height: 100, width: 18 },
    { color: 'var(--warm)', height: 92, width: 16 },
    { color: 'var(--done)', height: 84, width: 13 },
    { color: 'var(--text)', height: 62, width: 10 },
    { color: 'var(--fail)', height: 50, width: 8 },
    { color: 'var(--text-3)', height: 40, width: 6 },
  ],
};

const lookOf = (plate: number, unit: WeightUnit) => LOOK[unit][DEFAULT_PLATES[unit].indexOf(plate)] ?? LOOK[unit].at(-1)!;
const round = (v: number) => Math.round(v * 100) / 100;

/** A remembered bar (stored in kg) in the current unit, snapped to the standard bar it stands for: 20 kg ↔ 45 lb. */
function barIn(kg: number, unit: WeightUnit) {
  const v = kgTo(kg, unit);
  return BAR_OPTIONS[unit].find((o) => Math.abs(o - v) <= Math.max(0.5, o * 0.05)) ?? Math.round(v * 2) / 2;
}

export interface PlateUse {
  /** Button text; {weight} is replaced with the loaded weight. */
  label: string;
  /** The set's weight now, in kg; the button hides when the load matches it. */
  current?: number;
  apply: (kg: number) => void;
}

export function PlateSheet({
  open,
  onClose,
  exercise,
  initialKg,
  use,
}: {
  open: boolean;
  onClose: () => void;
  exercise?: Exercise;
  initialKg?: number;
  use?: PlateUse;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Plate calculator">
      {open && <PlateCalculator exercise={exercise} initialKg={initialKg} use={use} onDone={onClose} />}
    </Sheet>
  );
}

function PlateCalculator({ exercise, initialKg, use, onDone }: { exercise?: Exercise; initialKg?: number; use?: PlateUse; onDone: () => void }) {
  const settings = useSettings();
  const unit = settings.weightUnit;
  const owned = unit === 'kg' ? settings.platesKg : settings.platesLbs;
  const remembered = exercise ? settings.plateBars[exercise.id] : undefined;
  const [target, setTarget] = useState<number | undefined>(initialKg !== undefined ? round(kgTo(initialKg, unit)) : undefined);
  const [bar, setBar] = useState(remembered !== undefined ? barIn(remembered, unit) : defaultBar(exercise?.equipment, unit));

  const barOptions = [...new Set([...BAR_OPTIONS[unit], bar])].sort((a, b) => b - a);
  const result = target !== undefined && target > 0 ? calculatePlates(target, bar, owned) : undefined;
  const shown = result?.exact ?? result?.below;

  function chooseBar(value: number) {
    setBar(value);
    if (exercise) void updateSettings({ plateBars: { ...settings.plateBars, [exercise.id]: round(toKg(value, unit)) } });
  }

  function togglePlate(plate: number) {
    const next = owned.includes(plate) ? owned.filter((p) => p !== plate) : [...owned, plate].sort((a, b) => b - a);
    if (!next.length) return;
    void updateSettings(unit === 'kg' ? { platesKg: next } : { platesLbs: next });
  }

  const fmt = (v: number) => `${fmtNum(v, 2)} ${unit}`;

  return (
    <div className="plates">
      <label className="field">
        <span>Weight to load ({unit})</span>
        <NumberField value={target} onChange={setTarget} autoFocus={initialKg === undefined} aria-label={`Weight to load in ${unit}`} />
      </label>

      <div className="field">
        <span>Bar</span>
        <Segmented
          label="Bar weight"
          value={String(bar)}
          onChange={(v) => chooseBar(Number(v))}
          options={barOptions.map((b) => ({ value: String(b), label: b === 0 ? 'None' : fmt(b) }))}
        />
      </div>

      <PlateDiagram load={shown} unit={unit} hasBar={bar > 0} />

      <div className="plates-result" role="status">
        {!result ? (
          <p className="muted">Enter a weight to see what goes on each side.</p>
        ) : result.underBar ? (
          <p className="form-error">That’s lighter than the bar ({fmt(bar)}).</p>
        ) : (
          <>
            <p className="plates-side">
              {shown!.perSide.length ? (
                <>
                  <span className="muted">Each side</span> {shown!.perSide.map((p) => fmtNum(p, 2)).join(' + ')} {unit}
                </>
              ) : (
                'Just the bar'
              )}
            </p>
            {!result.exact && (
              <div className="plates-near">
                <p className="muted small">Your plates can’t make {fmt(target!)} exactly. Closest:</p>
                <div className="chips">
                  {[result.below, result.above].map(
                    (l) =>
                      l && (
                        <button key={l.total} className="chip" onClick={() => setTarget(l.total)}>
                          {fmt(l.total)}
                        </button>
                      ),
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {use && result?.exact && (use.current === undefined || Math.abs(toKg(result.exact.total, unit) - use.current) > 0.01) && (
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            use.apply(toKg(result.exact!.total, unit));
            onDone();
          }}
        >
          {use.label.replace('{weight}', fmt(result.exact.total))}
        </button>
      )}

      <details className="plates-owned">
        <summary>Plates at your gym</summary>
        <div className="chips wrap">
          {DEFAULT_PLATES[unit].map((p) => {
            const on = owned.includes(p);
            return (
              <button key={p} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => togglePlate(p)}>
                {fmt(p)}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}

/** One side of the bar, collar outwards, plates to scale-ish. */
function PlateDiagram({ load, unit, hasBar }: { load?: Load; unit: WeightUnit; hasBar: boolean }) {
  const plates = load?.perSide ?? [];
  return (
    <div
      className="plate-diagram"
      role="img"
      aria-label={plates.length ? `Each side: ${plates.map((p) => fmtNum(p, 2)).join(', ')} ${unit}` : 'Empty bar'}
    >
      {hasBar && <span className="bar-shaft" />}
      <span className="bar-collar" />
      {plates.map((p, i) => {
        const look = lookOf(p, unit);
        return (
          <span
            key={i}
            className="plate"
            style={{ '--plate': look.color, '--h': `${look.height}%`, '--w': `${look.width}px` } as CSSProperties}
          />
        );
      })}
      <span className="bar-sleeve" />
    </div>
  );
}
