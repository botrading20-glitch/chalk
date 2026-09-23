import type { Equipment, ExerciseType, Muscle, SetType } from '../types';

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  lats: 'Lats',
  upper_back: 'Upper back',
  traps: 'Traps',
  lower_back: 'Lower back',
  abdominals: 'Abs',
  quadriceps: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  adductors: 'Adductors',
  abductors: 'Abductors',
  neck: 'Neck',
  cardio: 'Cardio',
  full_body: 'Full body',
  other: 'Other',
};

export const MUSCLES = Object.keys(MUSCLE_LABEL) as Muscle[];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  smith_machine: 'Smith machine',
  kettlebell: 'Kettlebell',
  ez_bar: 'EZ bar',
  bodyweight: 'Bodyweight',
  band: 'Band',
  medicine_ball: 'Medicine ball',
  exercise_ball: 'Exercise ball',
  foam_roll: 'Foam roller',
  other: 'Other',
  none: 'None',
};

export const EQUIPMENT = Object.keys(EQUIPMENT_LABEL) as Equipment[];

export const TYPE_LABEL: Record<ExerciseType, string> = {
  weight_reps: 'Weight & reps',
  bodyweight_reps: 'Bodyweight reps',
  weighted_bodyweight: 'Weighted bodyweight',
  assisted_bodyweight: 'Assisted bodyweight',
  duration: 'Duration',
  weight_duration: 'Weight & duration',
  distance_duration: 'Distance & duration',
  weight_distance: 'Weight & distance',
};

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

export const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: 'Normal set',
  warmup: 'Warm-up',
  failure: 'Failure',
  dropset: 'Drop set',
};

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
