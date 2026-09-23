import type { ExerciseType, Settings, WorkoutSet } from '../types';
import { fmtClock, fmtNum, kgTo, kmTo } from './format';
import { FIELDS, type Field } from './meta';

type Units = Pick<Settings, 'weightUnit' | 'distanceUnit'>;

export function fmtSetWeight(kg: number, units: Units) {
  return `${fmtNum(kgTo(kg, units.weightUnit), units.weightUnit === 'kg' ? 2 : 1)} ${units.weightUnit}`;
}

/** One-line summary such as "66 kg × 15", "+10 kg × 8", "2.01 km · 5:43". */
export function fmtSet(s: WorkoutSet, type: ExerciseType, units: Units) {
  const w = s.weight !== undefined ? fmtSetWeight(s.weight, units) : undefined;
  const dist = s.distance !== undefined ? `${fmtNum(kmTo(s.distance, units.distanceUnit), 2)} ${units.distanceUnit}` : undefined;
  const time = s.duration !== undefined ? fmtClock(s.duration) : undefined;
  const reps = s.reps !== undefined ? fmtNum(s.reps, 1) : undefined;
  switch (type) {
    case 'weight_reps':
      return w && reps ? `${w} × ${reps}` : w ?? (reps ? `${reps} reps` : '');
    case 'bodyweight_reps':
      return reps ? `${reps} reps` : '';
    case 'weighted_bodyweight':
      return reps ? `${w && s.weight ? `+${w} × ` : ''}${reps}${w && s.weight ? '' : ' reps'}` : '';
    case 'assisted_bodyweight':
      return reps ? `${w && s.weight ? `−${w} × ` : ''}${reps}${w && s.weight ? '' : ' reps'}` : '';
    case 'duration':
      return time ?? '';
    case 'weight_duration':
      return [w, time].filter(Boolean).join(' · ');
    case 'distance_duration':
      return [dist, time].filter(Boolean).join(' · ');
    case 'weight_distance':
      return [w, dist].filter(Boolean).join(' · ');
  }
}

export function fieldHeader(field: Field, type: ExerciseType, units: Units) {
  switch (field) {
    case 'weight':
      return `${type === 'weighted_bodyweight' ? '+' : type === 'assisted_bodyweight' ? '−' : ''}${units.weightUnit}`;
    case 'reps':
      return 'reps';
    case 'distance':
      return units.distanceUnit;
    case 'duration':
      return 'time';
  }
}

export function fieldsFor(type: ExerciseType) {
  return FIELDS[type];
}

/** Hevy-style labels: warm-ups are "W", working sets are numbered, failure/drop sets show "F"/"D". */
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
