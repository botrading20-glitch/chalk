import type { ExerciseType, Settings, WorkoutSet } from '../types';
import { fmtClock, fmtNum, isolate, kgTo, kmTo } from './format';
import { FIELDS, type Field } from './meta';
import { t } from '../i18n';

type Units = Pick<Settings, 'weightUnit' | 'distanceUnit'>;

/** "66 kg", with no isolate marks: it is only ever a piece of a longer summary. */
export function fmtSetWeight(kg: number, units: Units) {
  return `${fmtNum(kgTo(kg, units.weightUnit), units.weightUnit === 'kg' ? 2 : 1)} ${units.weightUnit}`;
}

/**
 * One-line summary such as "66 kg × 15", "+10 kg × 8", "2.01 km · 5:43".
 * `bare` leaves out the units, for columns whose header already names them.
 */
export function fmtSet(s: WorkoutSet, type: ExerciseType, units: Units, bare = false) {
  const w =
    s.weight === undefined
      ? undefined
      : bare
        ? fmtNum(kgTo(s.weight, units.weightUnit), units.weightUnit === 'kg' ? 2 : 1)
        : fmtSetWeight(s.weight, units);
  const km = s.distance !== undefined ? fmtNum(kmTo(s.distance, units.distanceUnit), 2) : undefined;
  const dist = km !== undefined && !bare ? `${km} ${units.distanceUnit}` : km;
  const time = s.duration !== undefined ? fmtClock(s.duration) : undefined;
  const reps = s.reps !== undefined ? fmtNum(s.reps, 1) : undefined;
  const repsText = s.reps !== undefined ? t('count.rep', { n: Math.round(s.reps * 10) / 10 }) : '';
  // Bare values sit in a narrow column; when they wrap, the reps keep their ×.
  const x = bare ? ' ×\u00a0' : ' × ';
  // Right-to-left text would reorder "66 kg × 15"; the translated reps text is the one part that must not be isolated.
  switch (type) {
    case 'weight_reps':
      return w && reps ? isolate(`${w}${x}${reps}`) : w ? isolate(w) : reps ? repsText : '';
    case 'bodyweight_reps':
      return reps ? repsText : '';
    case 'weighted_bodyweight':
      return reps ? (w && s.weight ? isolate(`+${w}${x}${reps}`) : repsText) : '';
    case 'assisted_bodyweight':
      return reps ? (w && s.weight ? isolate(`−${w}${x}${reps}`) : repsText) : '';
    case 'duration':
      return time ?? '';
    case 'weight_duration':
      return isolate([w, time].filter(Boolean).join(' · '));
    case 'distance_duration':
      return isolate([dist, time].filter(Boolean).join(' · '));
    case 'weight_distance':
      return isolate([w, dist].filter(Boolean).join(' · '));
  }
}

export function fieldHeader(field: Field, type: ExerciseType, units: Units) {
  switch (field) {
    case 'weight':
      return isolate(`${type === 'weighted_bodyweight' ? '+' : type === 'assisted_bodyweight' ? '−' : ''}${units.weightUnit}`);
    case 'reps':
      return t('head.reps');
    case 'distance':
      return units.distanceUnit;
    case 'duration':
      return t('field.time');
  }
}

export function fieldsFor(type: ExerciseType) {
  return FIELDS[type];
}

/** Set labels: warm-ups are "W", working sets are numbered, failure/drop sets show "F"/"D". */
export function setLabels(sets: WorkoutSet[]) {
  let n = 0;
  return sets.map((s) => {
    if (s.type === 'warmup') return 'W';
    n++;
    if (s.type === 'failure') return 'F';
    if (s.type === 'dropset') return 'D';
    return String(n);
  });
}
