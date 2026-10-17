import { count } from '../i18n';
import type { Settings } from '../types';
import { fmtClock, fmtNum, kgTo, kmTo } from './format';
import type { RecordKind } from './stats';

/** A record's value as text, in the user's units: "72.5 kg", "12 reps", "1:30". */
export function recordFormat(kind: RecordKind, value: number, s: Pick<Settings, 'weightUnit' | 'distanceUnit'>) {
  switch (kind) {
    case 'weight':
    case 'e1rm':
    case 'volume':
      return `${fmtNum(kgTo(value, s.weightUnit), 1)} ${s.weightUnit}`;
    case 'reps':
      return count('rep', value);
    case 'duration':
      return fmtClock(value);
    case 'distance':
      return `${fmtNum(kmTo(value, s.distanceUnit), 2)} ${s.distanceUnit}`;
  }
}
