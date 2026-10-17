import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { DistanceUnit, WeightUnit } from '../types';
import { useData } from './data';
import { usePref } from './prefs';
import { useActiveWorkout } from './workouts';

export interface WelcomeState {
  workoutCount: number;
  routineCount: number;
  welcomeSeen: boolean;
  /** A workout is already running, so this isn't someone opening the app for the first time. */
  hasActive?: boolean;
}

/** The welcome screen is for a brand-new install only: nothing logged or saved, and not seen before. */
export function shouldWelcome(s: WelcomeState) {
  return !s.welcomeSeen && s.workoutCount === 0 && s.routineCount === 0 && !s.hasActive;
}

/** undefined while loading, then whether Home should send this visitor to the welcome screen. */
export function useWelcomeGate() {
  const { workouts, ready } = useData();
  const routineCount = useLiveQuery(() => db.routines.count(), []);
  const welcomeSeen = usePref('welcomeSeen');
  const active = useActiveWorkout();
  if (!ready || routineCount === undefined || welcomeSeen === undefined || active === undefined) return undefined;
  return shouldWelcome({ workoutCount: workouts.length, routineCount, welcomeSeen, hasActive: !!active });
}

/** Pounds and miles for the few regions that use them, kilograms for the rest; miles alone for the UK. */
export function suggestUnits(region: string | undefined): { weightUnit: WeightUnit; distanceUnit: DistanceUnit } {
  const customary = region === 'US' || region === 'LR' || region === 'MM';
  return {
    weightUnit: customary ? 'lbs' : 'kg',
    distanceUnit: customary || region === 'GB' ? 'mi' : 'km',
  };
}

/** The region of the phone's first language that names one ("en-US" gives "US"). */
export function phoneRegion(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): string | undefined {
  for (const tag of languages) {
    try {
      const region = new Intl.Locale(tag).region;
      if (region) return region;
    } catch {
      // Not a tag the browser can read: try the next language.
    }
  }
  return undefined;
}
