import { fmtNum, listJoin } from '../lib/format';
import { MUSCLE_LABEL, MUSCLES } from '../lib/meta';
import { muscleLevel, rankedMuscles } from '../lib/muscles';
import type { Muscle } from '../types';
import { t } from '../i18n';

// An original, flat figure: a front and a back view drawn from straight-edged panels
// (the angle echoes the logo's split S). Each panel is one muscle; the left half is
// drawn here and mirrored, so a panel only has to be described once. Cardio, full body
// and other have no panel: they show in the table.

interface Panel {
  muscle: Muscle;
  d: string;
}

const BODY = [
  // trunk and legs
  'M50,22 L45,22 L45,31 L34,33 L31,40 L33,56 L37,98 L34,112 L32,128 L34,146 L34,164 L33,186 L36,205 L35,216 L44,216 L43,205 L45,186 L46,164 L47,140 L50,126 Z',
  // arm and hand
  'M30,36 L24,38 L20,50 L20,80 L16,112 L15,126 L21,128 L26,116 L30,92 L31,60 L32,44 Z',
];

const FRONT: Panel[] = [
  { muscle: 'neck', d: 'M50,22 L45,22 L45,31 L50,34 Z' },
  { muscle: 'shoulders', d: 'M42,33 L34,33 L26,38 L22,49 L24,57 L31,57 L36,49 L38,41 Z' },
  { muscle: 'chest', d: 'M50,37 L44,35 L39,39 L36,47 L36,57 L43,62 L50,60 Z' },
  { muscle: 'biceps', d: 'M23,58 L31,58 L30,77 L21,79 Z' },
  { muscle: 'forearms', d: 'M21,82 L29,82 L26,112 L17,113 Z' },
  { muscle: 'abdominals', d: 'M50,63 L43,64 L40,78 L41,95 L50,104 Z' },
  { muscle: 'abdominals', d: 'M36,60 L39,63 L38,80 L39,94 L36,99 L35,82 Z' },
  { muscle: 'abductors', d: 'M32,112 L36,112 L36,130 L32,128 Z' },
  { muscle: 'quadriceps', d: 'M35,118 L45,124 L45,158 L42,166 L36,163 L33,143 Z' },
  { muscle: 'adductors', d: 'M46,126 L50,124 L50,152 L46,150 Z' },
  { muscle: 'calves', d: 'M36,170 L44,170 L42,202 L37,204 L35,188 Z' },
];

const BACK: Panel[] = [
  { muscle: 'neck', d: 'M50,22 L45,22 L45,31 L50,34 Z' },
  { muscle: 'traps', d: 'M50,26 L45,30 L38,35 L35,41 L40,47 L50,57 Z' },
  { muscle: 'shoulders', d: 'M34,37 L27,40 L22,50 L24,57 L31,57 L35,50 L35,43 Z' },
  { muscle: 'upper_back', d: 'M50,57 L40,47 L36,52 L37,64 L44,68 L50,68 Z' },
  { muscle: 'lats', d: 'M35,56 L34,72 L38,92 L42,88 L43,72 L37,66 Z' },
  { muscle: 'lower_back', d: 'M50,70 L44,72 L43,88 L45,101 L50,104 Z' },
  { muscle: 'triceps', d: 'M23,58 L31,58 L30,77 L21,79 Z' },
  { muscle: 'forearms', d: 'M21,82 L29,82 L26,112 L17,113 Z' },
  { muscle: 'glutes', d: 'M50,104 L44,102 L36,108 L34,120 L41,128 L50,126 Z' },
  { muscle: 'abductors', d: 'M31,111 L36,108 L34,121 L31,127 Z' },
  { muscle: 'hamstrings', d: 'M34,130 L49,129 L49,160 L43,167 L36,163 L33,146 Z' },
  { muscle: 'calves', d: 'M35,169 L45,169 L46,185 L43,203 L38,203 L34,186 Z' },
];

const MIRROR = 'translate(100 0) scale(-1 1)';

function Figure({ panels, x, levels }: { panels: Panel[]; x: number; levels: Map<Muscle, number> }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <circle className="mm-body" cx="50" cy="12" r="10" />
      {BODY.map((d) => (
        <g key={d}>
          <path className="mm-body" d={d} />
          <path className="mm-body" d={d} transform={MIRROR} />
        </g>
      ))}
      {panels.map((p, i) => (
        <g key={i} className="mm-region" data-level={levels.get(p.muscle) || undefined}>
          <path d={p.d} />
          <path d={p.d} transform={MIRROR} />
        </g>
      ))}
    </g>
  );
}

const fmtSets = (n: number) => fmtNum(n, Number.isInteger(n) ? 0 : 1);

/** The figure with every worked muscle shaded, and (by default) the same numbers as a table. */
export function MuscleMap({ totals, table = true }: { totals: Map<Muscle, number>; table?: boolean }) {
  const ranked = rankedMuscles(totals, MUSCLES);
  const max = ranked[0]?.sets ?? 0;
  const levels = new Map<Muscle, number>(ranked.map((r) => [r.muscle, muscleLevel(r.sets, max)]));
  const summary = ranked.length ? t('muscles.label', { list: listJoin(ranked.map((r) => `${MUSCLE_LABEL[r.muscle]} ${fmtSets(r.sets)}`)) }) : t('muscles.none');

  return (
    <figure className="muscle-map">
      <svg viewBox="0 0 214 218" role="img" aria-label={summary}>
        <Figure panels={FRONT} x={0} levels={levels} />
        <Figure panels={BACK} x={114} levels={levels} />
      </svg>
      <div className="mm-views" aria-hidden="true">
        <span>{t('muscles.front')}</span>
        <span>{t('muscles.back')}</span>
      </div>
      {table &&
        (ranked.length ? (
          <table className="muscle-table">
            <thead>
              <tr>
                <th scope="col">{t('muscles.colMuscle')}</th>
                <th scope="col">{t('muscles.colSets')}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.muscle}>
                  <th scope="row">{MUSCLE_LABEL[r.muscle]}</th>
                  <td>{fmtSets(r.sets)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">{t('muscles.none')}</p>
        ))}
      {table && <figcaption className="muted small">{t('muscles.how')}</figcaption>}
    </figure>
  );
}
