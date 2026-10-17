import { labelMap } from '../i18n/labels';
import type { Equipment, ExerciseType, Muscle, SetType } from '../types';

export const MUSCLE_LABEL = labelMap<Muscle>('muscle', ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'lats', 'upper_back', 'traps', 'lower_back', 'abdominals', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors', 'neck', 'cardio', 'full_body', 'other']);

export const MUSCLES = Object.keys(MUSCLE_LABEL) as Muscle[];

export const EQUIPMENT_LABEL = labelMap<Equipment>('equipment', ['barbell', 'dumbbell', 'machine', 'cable', 'smith_machine', 'kettlebell', 'ez_bar', 'bodyweight', 'band', 'medicine_ball', 'exercise_ball', 'foam_roll', 'other', 'none']);

export const EQUIPMENT = Object.keys(EQUIPMENT_LABEL) as Equipment[];

export const TYPE_LABEL = labelMap<ExerciseType>('type', ['weight_reps', 'bodyweight_reps', 'weighted_bodyweight', 'assisted_bodyweight', 'duration', 'weight_duration', 'distance_duration', 'weight_distance']);

export const EXERCISE_TYPES = Object.keys(TYPE_LABEL) as ExerciseType[];

export type Field = 'weight' | 'reps' | 'distance' | 'duration';

export const FIELDS: Record<ExerciseType, Field[]> = {
  weight_reps: ['weight', 'reps'],
  bodyweight_reps: ['reps'],
  weighted_bodyweight: ['weight', 'reps'],
  assisted_bodyweight: ['weight', 'reps'],
  duration: ['duration'],
  weight_duration: ['weight', 'duration'],
  distance_duration: ['distance', 'duration'],
  weight_distance: ['weight', 'distance'],
};

/** Types whose weight × reps counts toward training volume. */
export const COUNTS_VOLUME: Record<ExerciseType, boolean> = {
  weight_reps: true,
  weighted_bodyweight: true,
  bodyweight_reps: false,
  assisted_bodyweight: false,
  duration: false,
  weight_duration: false,
  distance_duration: false,
  weight_distance: false,
};

export const SET_TYPE_LABEL = labelMap<SetType>('setType', ['normal', 'warmup', 'failure', 'dropset']);

export const SET_TYPE_SHORT: Record<SetType, string> = {
  normal: '',
  warmup: 'W',
  failure: 'F',
  dropset: 'D',
};

/** Coarse groups used for the training split on the profile screen. */
export const MUSCLE_GROUP: Record<Muscle, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Arms',
  triceps: 'Arms',
  forearms: 'Arms',
  lats: 'Back',
  upper_back: 'Back',
  traps: 'Back',
  lower_back: 'Back',
  abdominals: 'Core',
  quadriceps: 'Legs',
  hamstrings: 'Legs',
  glutes: 'Legs',
  calves: 'Legs',
  adductors: 'Legs',
  abductors: 'Legs',
  neck: 'Other',
  cardio: 'Cardio',
  full_body: 'Other',
  other: 'Other',
};

export const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
