import type { OneRmFormula, TimeFormat, WeekStart } from '../types';

// Settings that change how numbers and dates are computed or shown by plain
// functions (no React): the time format, the first day of the week and the
// 1RM formula. useSettings() keeps this in step with the stored settings.

export interface CalcContext {
  timeFormat: TimeFormat;
  weekStart: WeekStart;
  oneRmFormula: OneRmFormula;
}

let context: CalcContext = { timeFormat: 'auto', weekStart: 'auto', oneRmFormula: 'epley' };

export const calcContext = () => context;

export function setCalcContext(next: CalcContext) {
  context = next;
}
