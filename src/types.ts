export type ExerciseType =
  | 'weight_reps'
  | 'bodyweight_reps'
  | 'weighted_bodyweight'
  | 'assisted_bodyweight'
  | 'duration'
  | 'weight_duration'
  | 'distance_duration'
  | 'weight_distance';

export type Muscle =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'lats'
  | 'upper_back'
  | 'traps'
  | 'lower_back'
  | 'abdominals'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'adductors'
  | 'abductors'
  | 'neck'
  | 'cardio'
  | 'full_body'
  | 'other';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'smith_machine'
  | 'kettlebell'
  | 'ez_bar'
  | 'bodyweight'
  | 'band'
  | 'medicine_ball'
  | 'exercise_ball'
  | 'foam_roll'
  | 'other'
  | 'none';

export type ExerciseSource = 'library' | 'custom';

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  equipment: Equipment;
  primaryMuscle: Muscle;
  secondaryMuscles: Muscle[];
  instructions: string[];
  /** Paths relative to the free-exercise-db image folder. */
  images: string[];
  source: ExerciseSource;
}

export type SetType = 'normal' | 'warmup' | 'failure' | 'dropset';

/** All weights are stored in kg, distances in km, durations in seconds. */
export interface WorkoutSet {
  id: string;
  type: SetType;
  weight?: number;
  reps?: number;
  distance?: number;
  duration?: number;
  rpe?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  notes?: string;
  /** Exercises sharing the same supersetId are performed back to back. */
  supersetId?: number;
  /** Rest after each set, in seconds. 0 turns the timer off. */
  restSeconds?: number;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  exercises: WorkoutExercise[];
  /** Denormalised for the multi-entry index used by exercise history. */
  exerciseIds: string[];
  routineId?: string;
}

export interface Routine {
  id: string;
  title: string;
  notes?: string;
  exercises: WorkoutExercise[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface ActiveWorkout {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  exercises: WorkoutExercise[];
  routineId?: string;
  /** When set, the rest timer is running and ends at this epoch ms. */
  restEndsAt?: number;
  restTotal?: number;
  /** Present when editing a workout that was already saved. */
  editingId?: string;
  endTime?: number;
}

export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'km' | 'mi';
export type Theme = 'dark' | 'light' | 'system';

export interface Settings {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  defaultRest: number;
  theme: Theme;
  timerSound: boolean;
  timerVibrate: boolean;
  keepAwake: boolean;
}
