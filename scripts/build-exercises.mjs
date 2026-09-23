// Builds src/data/exercises.json from the public-domain free-exercise-db
// (https://github.com/yuhonas/free-exercise-db, The Unlicense) plus a curated
// list of modern machine/cable movements that the open database lacks.
// Run with: npm run exercises
import { writeFile } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

const MUSCLE = {
  'middle back': 'upper_back',
  'lower back': 'lower_back',
};
const EQUIPMENT = {
  'body only': 'bodyweight',
  kettlebells: 'kettlebell',
  bands: 'band',
  'e-z curl bar': 'ez_bar',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'exercise_ball',
  'foam roll': 'foam_roll',
};
const DISTANCE_CARDIO = /bicycling|bike|running|jogging|walking|rowing|skating|elliptical|sprint/i;
const TIMED = /\bplank\b|isometric|\bhold\b|wall sit|one handed hang/i;

function typeFor(x, equipment) {
  if (x.category === 'cardio') return DISTANCE_CARDIO.test(x.name) ? 'distance_duration' : 'duration';
  if (x.category === 'stretching' || TIMED.test(x.name)) return 'duration';
  if (/assisted/i.test(x.name)) return 'assisted_bodyweight';
  if (/carry|farmer|yoke|walk\b/i.test(x.name) && equipment !== 'bodyweight') return 'weight_distance';
  if (equipment === 'bodyweight') return /weighted/i.test(x.name) ? 'weighted_bodyweight' : 'bodyweight_reps';
  return 'weight_reps';
}

// [name, type, equipment, primary, secondary[]]
const EXTRA = [
  ['Chest Fly (Machine)', 'weight_reps', 'machine', 'chest', ['shoulders']],
  ['Chest Press (Machine)', 'weight_reps', 'machine', 'chest', ['triceps', 'shoulders']],
  ['Incline Chest Press (Machine)', 'weight_reps', 'machine', 'chest', ['triceps', 'shoulders']],
  ['Decline Chest Press (Machine)', 'weight_reps', 'machine', 'chest', ['triceps']],
  ['Iso-Lateral Chest Press (Machine)', 'weight_reps', 'machine', 'chest', ['triceps', 'shoulders']],
  ['Incline Bench Press (Smith Machine)', 'weight_reps', 'smith_machine', 'chest', ['triceps', 'shoulders']],
  ['Cable Fly Crossover', 'weight_reps', 'cable', 'chest', ['shoulders']],
  ['Low to High Cable Fly', 'weight_reps', 'cable', 'chest', ['shoulders']],
  ['High to Low Cable Fly', 'weight_reps', 'cable', 'chest', ['shoulders']],
  ['Single Arm Cable Crossover', 'weight_reps', 'cable', 'chest', ['shoulders']],
  ['Chest Dip', 'bodyweight_reps', 'bodyweight', 'chest', ['triceps', 'shoulders']],
  ['Chest Dip (Weighted)', 'weighted_bodyweight', 'bodyweight', 'chest', ['triceps', 'shoulders']],
  ['Chest Dip (Assisted)', 'assisted_bodyweight', 'machine', 'chest', ['triceps', 'shoulders']],
  ['Triceps Dip', 'bodyweight_reps', 'bodyweight', 'triceps', ['chest', 'shoulders']],
  ['Seated Shoulder Press (Machine)', 'weight_reps', 'machine', 'shoulders', ['triceps']],
  ['Lateral Raise (Machine)', 'weight_reps', 'machine', 'shoulders', []],
  ['Lateral Raise (Cable)', 'weight_reps', 'cable', 'shoulders', []],
  ['Single Arm Lateral Raise (Cable)', 'weight_reps', 'cable', 'shoulders', []],
  ['Lateral Raise (Dumbbell)', 'weight_reps', 'dumbbell', 'shoulders', []],
  ['Front Raise (Cable)', 'weight_reps', 'cable', 'shoulders', []],
  ['Rear Delt Fly (Machine)', 'weight_reps', 'machine', 'shoulders', ['upper_back']],
  ['Rear Delt Reverse Fly (Cable)', 'weight_reps', 'cable', 'shoulders', ['upper_back']],
  ['Face Pull (Cable)', 'weight_reps', 'cable', 'shoulders', ['upper_back', 'traps']],
  ['Y Raise (Cable)', 'weight_reps', 'cable', 'shoulders', ['traps']],
  ['Prone Y Raise (Dumbbell)', 'weight_reps', 'dumbbell', 'shoulders', ['traps']],
  ['Shrug (Machine)', 'weight_reps', 'machine', 'traps', []],
  ['Lat Pulldown (Cable)', 'weight_reps', 'cable', 'lats', ['biceps', 'upper_back']],
  ['Lat Pulldown (Machine)', 'weight_reps', 'machine', 'lats', ['biceps', 'upper_back']],
  ['Reverse Grip Lat Pulldown (Cable)', 'weight_reps', 'cable', 'lats', ['biceps']],
  ['Single Arm Lat Pulldown (Cable)', 'weight_reps', 'cable', 'lats', ['biceps']],
  ['Straight Arm Pulldown (Cable)', 'weight_reps', 'cable', 'lats', []],
  ['Pull Up', 'bodyweight_reps', 'bodyweight', 'lats', ['biceps', 'upper_back']],
  ['Pull Up (Weighted)', 'weighted_bodyweight', 'bodyweight', 'lats', ['biceps', 'upper_back']],
  ['Pull Up (Assisted)', 'assisted_bodyweight', 'machine', 'lats', ['biceps', 'upper_back']],
  ['Chin Up', 'bodyweight_reps', 'bodyweight', 'lats', ['biceps']],
  ['Seated Row (Machine)', 'weight_reps', 'machine', 'upper_back', ['lats', 'biceps']],
  ['Iso-Lateral Row (Machine)', 'weight_reps', 'machine', 'upper_back', ['lats', 'biceps']],
  ['Seated Cable Row - V Grip (Cable)', 'weight_reps', 'cable', 'upper_back', ['lats', 'biceps']],
  ['Seated Cable Row - Wide Grip (Cable)', 'weight_reps', 'cable', 'upper_back', ['lats', 'biceps']],
  ['T-Bar Row (Machine)', 'weight_reps', 'machine', 'upper_back', ['lats', 'biceps']],
  ['Chest Supported Row (Dumbbell)', 'weight_reps', 'dumbbell', 'upper_back', ['lats', 'biceps']],
  ['Chest Supported Row (Machine)', 'weight_reps', 'machine', 'upper_back', ['lats', 'biceps']],
  ['Back Extension (Weighted Hyperextension)', 'weight_reps', 'other', 'lower_back', ['glutes', 'hamstrings']],
  ['Back Extension (Machine)', 'weight_reps', 'machine', 'lower_back', ['glutes']],
  ['Bicep Curl (Cable)', 'weight_reps', 'cable', 'biceps', ['forearms']],
  ['Bicep Curl (Machine)', 'weight_reps', 'machine', 'biceps', []],
  ['Single Arm Curl (Cable)', 'weight_reps', 'cable', 'biceps', ['forearms']],
  ['Bayesian Curl (Cable)', 'weight_reps', 'cable', 'biceps', []],
  ['Preacher Curl (Machine)', 'weight_reps', 'machine', 'biceps', []],
  ['Hammer Curl (Cable)', 'weight_reps', 'cable', 'biceps', ['forearms']],
  ['Reverse Curl (Cable)', 'weight_reps', 'cable', 'forearms', ['biceps']],
  ['Reverse Wrist Curl (Dumbbell)', 'weight_reps', 'dumbbell', 'forearms', []],
  ['Triceps Rope Pushdown', 'weight_reps', 'cable', 'triceps', []],
  ['Triceps Pushdown (Cable - Straight Bar)', 'weight_reps', 'cable', 'triceps', []],
  ['Reverse Grip Triceps Pushdown', 'weight_reps', 'cable', 'triceps', []],
  ['Single Arm Triceps Pushdown (Cable)', 'weight_reps', 'cable', 'triceps', []],
  ['Overhead Triceps Extension (Cable)', 'weight_reps', 'cable', 'triceps', []],
  ['Triceps Extension (Machine)', 'weight_reps', 'machine', 'triceps', []],
  ['Triceps Dip (Machine)', 'weight_reps', 'machine', 'triceps', ['chest']],
  ['Leg Press Horizontal (Machine)', 'weight_reps', 'machine', 'quadriceps', ['glutes', 'hamstrings']],
  ['Leg Press (45 Degree)', 'weight_reps', 'machine', 'quadriceps', ['glutes', 'hamstrings']],
  ['Hack Squat (Machine)', 'weight_reps', 'machine', 'quadriceps', ['glutes']],
  ['Pendulum Squat (Machine)', 'weight_reps', 'machine', 'quadriceps', ['glutes']],
  ['Belt Squat (Machine)', 'weight_reps', 'machine', 'quadriceps', ['glutes']],
  ['Leg Extension (Machine)', 'weight_reps', 'machine', 'quadriceps', []],
  ['Single Leg Extension (Machine)', 'weight_reps', 'machine', 'quadriceps', []],
  ['Seated Leg Curl (Machine)', 'weight_reps', 'machine', 'hamstrings', []],
  ['Lying Leg Curl (Machine)', 'weight_reps', 'machine', 'hamstrings', []],
  ['Standing Leg Curl (Machine)', 'weight_reps', 'machine', 'hamstrings', []],
  ['Hip Thrust (Barbell)', 'weight_reps', 'barbell', 'glutes', ['hamstrings']],
  ['Hip Thrust (Machine)', 'weight_reps', 'machine', 'glutes', ['hamstrings']],
  ['Glute Kickback (Cable)', 'weight_reps', 'cable', 'glutes', ['hamstrings']],
  ['Glute Kickback (Machine)', 'weight_reps', 'machine', 'glutes', ['hamstrings']],
  ['Hip Abduction (Machine)', 'weight_reps', 'machine', 'abductors', ['glutes']],
  ['Hip Adduction (Machine)', 'weight_reps', 'machine', 'adductors', []],
  ['Bulgarian Split Squat (Dumbbell)', 'weight_reps', 'dumbbell', 'quadriceps', ['glutes']],
  ['Romanian Deadlift (Dumbbell)', 'weight_reps', 'dumbbell', 'hamstrings', ['glutes', 'lower_back']],
  ['Calf Press (Machine)', 'weight_reps', 'machine', 'calves', []],
  ['Seated Calf Raise (Machine)', 'weight_reps', 'machine', 'calves', []],
  ['Standing Calf Raise (Machine)', 'weight_reps', 'machine', 'calves', []],
  ['Crunch (Machine)', 'weight_reps', 'machine', 'abdominals', []],
  ['Cable Crunch', 'weight_reps', 'cable', 'abdominals', []],
  ['Hanging Knee Raise', 'bodyweight_reps', 'bodyweight', 'abdominals', []],
  ['Dead Hang', 'duration', 'bodyweight', 'forearms', ['lats']],
  ['Cycling', 'distance_duration', 'machine', 'cardio', []],
  ['Stair Climber', 'duration', 'machine', 'cardio', []],
  ['Treadmill Incline Walk', 'distance_duration', 'machine', 'cardio', []],
  // Free-weight staples under the "Name (Equipment)" naming Hevy users know.
  ['Bench Press (Barbell)', 'weight_reps', 'barbell', 'chest', ['triceps', 'shoulders']],
  ['Bench Press (Dumbbell)', 'weight_reps', 'dumbbell', 'chest', ['triceps', 'shoulders']],
  ['Incline Bench Press (Barbell)', 'weight_reps', 'barbell', 'chest', ['triceps', 'shoulders']],
  ['Incline Bench Press (Dumbbell)', 'weight_reps', 'dumbbell', 'chest', ['triceps', 'shoulders']],
  ['Decline Bench Press (Barbell)', 'weight_reps', 'barbell', 'chest', ['triceps']],
  ['Chest Fly (Dumbbell)', 'weight_reps', 'dumbbell', 'chest', ['shoulders']],
  ['Overhead Press (Barbell)', 'weight_reps', 'barbell', 'shoulders', ['triceps']],
  ['Shoulder Press (Dumbbell)', 'weight_reps', 'dumbbell', 'shoulders', ['triceps']],
  ['Arnold Press (Dumbbell)', 'weight_reps', 'dumbbell', 'shoulders', ['triceps']],
  ['Rear Delt Fly (Dumbbell)', 'weight_reps', 'dumbbell', 'shoulders', ['upper_back']],
  ['Upright Row (Barbell)', 'weight_reps', 'barbell', 'shoulders', ['traps']],
  ['Shrug (Barbell)', 'weight_reps', 'barbell', 'traps', []],
  ['Shrug (Dumbbell)', 'weight_reps', 'dumbbell', 'traps', []],
  ['Bent Over Row (Barbell)', 'weight_reps', 'barbell', 'upper_back', ['lats', 'biceps']],
  ['Bent Over Row (Dumbbell)', 'weight_reps', 'dumbbell', 'upper_back', ['lats', 'biceps']],
  ['Single Arm Row (Dumbbell)', 'weight_reps', 'dumbbell', 'upper_back', ['lats', 'biceps']],
  ['Pendlay Row (Barbell)', 'weight_reps', 'barbell', 'upper_back', ['lats']],
  ['Deadlift (Barbell)', 'weight_reps', 'barbell', 'hamstrings', ['glutes', 'lower_back']],
  ['Romanian Deadlift (Barbell)', 'weight_reps', 'barbell', 'hamstrings', ['glutes', 'lower_back']],
  ['Squat (Barbell)', 'weight_reps', 'barbell', 'quadriceps', ['glutes', 'hamstrings']],
  ['Front Squat (Barbell)', 'weight_reps', 'barbell', 'quadriceps', ['glutes']],
  ['Squat (Smith Machine)', 'weight_reps', 'smith_machine', 'quadriceps', ['glutes']],
  ['Goblet Squat (Dumbbell)', 'weight_reps', 'dumbbell', 'quadriceps', ['glutes']],
  ['Lunge (Dumbbell)', 'weight_reps', 'dumbbell', 'quadriceps', ['glutes']],
  ['Walking Lunge (Dumbbell)', 'weight_reps', 'dumbbell', 'quadriceps', ['glutes']],
  ['Bicep Curl (Barbell)', 'weight_reps', 'barbell', 'biceps', ['forearms']],
  ['Bicep Curl (Dumbbell)', 'weight_reps', 'dumbbell', 'biceps', ['forearms']],
  ['Hammer Curl (Dumbbell)', 'weight_reps', 'dumbbell', 'biceps', ['forearms']],
  ['Incline Curl (Dumbbell)', 'weight_reps', 'dumbbell', 'biceps', []],
  ['Preacher Curl (EZ Bar)', 'weight_reps', 'ez_bar', 'biceps', []],
  ['EZ Bar Curl', 'weight_reps', 'ez_bar', 'biceps', ['forearms']],
  ['Skullcrusher (EZ Bar)', 'weight_reps', 'ez_bar', 'triceps', []],
  ['Overhead Triceps Extension (Dumbbell)', 'weight_reps', 'dumbbell', 'triceps', []],
  ['Triceps Kickback (Dumbbell)', 'weight_reps', 'dumbbell', 'triceps', []],
  ['Close Grip Bench Press (Barbell)', 'weight_reps', 'barbell', 'triceps', ['chest']],
  ['Wrist Curl (Dumbbell)', 'weight_reps', 'dumbbell', 'forearms', []],
  ['Push Up', 'bodyweight_reps', 'bodyweight', 'chest', ['triceps', 'shoulders']],
  ['Push Up (Weighted)', 'weighted_bodyweight', 'bodyweight', 'chest', ['triceps', 'shoulders']],
  ['Hip Thrust (Smith Machine)', 'weight_reps', 'smith_machine', 'glutes', ['hamstrings']],
  ['Russian Twist', 'bodyweight_reps', 'bodyweight', 'abdominals', []],
  ['Ab Wheel Rollout', 'bodyweight_reps', 'other', 'abdominals', []],
  ['Rowing Machine', 'distance_duration', 'machine', 'cardio', []],
  ['Running', 'distance_duration', 'none', 'cardio', []],
  ['Elliptical Trainer', 'duration', 'machine', 'cardio', []],
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Download failed: ${res.status}`);
const raw = await res.json();

const out = raw.map((x) => {
  let equipment = EQUIPMENT[x.equipment] ?? x.equipment ?? 'none';
  if (/smith/i.test(x.name)) equipment = 'smith_machine';
  const muscle = (m) => MUSCLE[m] ?? m;
  return {
    id: `lib-${slug(x.id)}`,
    name: x.name,
    type: typeFor(x, equipment),
    equipment,
    primaryMuscle: x.category === 'cardio' ? 'cardio' : muscle(x.primaryMuscles[0] ?? 'other'),
    secondaryMuscles: x.secondaryMuscles.map(muscle),
    instructions: x.instructions,
    images: x.images,
  };
});

const taken = new Set(out.map((x) => x.name.toLowerCase()));
for (const [name, type, equipment, primaryMuscle, secondaryMuscles] of EXTRA) {
  if (taken.has(name.toLowerCase())) continue;
  out.push({ id: `lib-x-${slug(name)}`, name, type, equipment, primaryMuscle, secondaryMuscles, instructions: [], images: [] });
}

out.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(new URL('../src/data/exercises.json', import.meta.url), JSON.stringify(out));
console.log(`Wrote ${out.length} exercises`);
