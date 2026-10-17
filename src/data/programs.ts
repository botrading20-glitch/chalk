import type { Key } from '../i18n/catalog';

// Starter programs: ready-made routines a new user can add in one tap. Exercise
// ids are library ids (src/data/exercises.json; a test checks every one exists),
// and titles are catalog keys, so they follow the language.

/** One exercise in a session: how many sets, and the reps to aim for (left out for timed or max-rep work). */
export type ProgramRow = [id: string, sets: number, reps?: number];

export interface ProgramDay {
  title: Key;
  exercises: ProgramRow[];
}

export interface Program {
  id: string;
  title: Key;
  summary: Key;
  days: ProgramDay[];
}

export const PROGRAMS: Program[] = [
  {
    id: 'fullbody',
    title: 'prog.fullbody.title',
    summary: 'prog.fullbody.summary',
    days: [
      {
        title: 'prog.fullbody.1',
        exercises: [
          ['lib-x-squat-barbell', 3, 8],
          ['lib-x-bench-press-barbell', 3, 8],
          ['lib-x-bent-over-row-barbell', 3, 8],
          ['lib-x-overhead-press-barbell', 3, 10],
          ['lib-x-bicep-curl-dumbbell', 2, 12],
          ['lib-plank', 3],
        ],
      },
      {
        title: 'prog.fullbody.2',
        exercises: [
          ['lib-x-deadlift-barbell', 3, 5],
          ['lib-x-incline-bench-press-dumbbell', 3, 10],
          ['lib-x-lat-pulldown-cable', 3, 10],
          ['lib-x-lunge-dumbbell', 3, 10],
          ['lib-x-lateral-raise-dumbbell', 3, 12],
          ['lib-x-triceps-rope-pushdown', 3, 12],
        ],
      },
      {
        title: 'prog.fullbody.3',
        exercises: [
          ['lib-x-leg-press-45-degree', 3, 10],
          ['lib-x-shoulder-press-dumbbell', 3, 10],
          ['lib-x-seated-cable-row-v-grip-cable', 3, 10],
          ['lib-x-romanian-deadlift-dumbbell', 3, 10],
          ['lib-x-chest-fly-machine', 2, 12],
          ['lib-x-hanging-knee-raise', 3, 10],
        ],
      },
    ],
  },
  {
    id: 'upperlower',
    title: 'prog.upperlower.title',
    summary: 'prog.upperlower.summary',
    days: [
      {
        title: 'prog.upperlower.1',
        exercises: [
          ['lib-x-bench-press-barbell', 4, 6],
          ['lib-x-bent-over-row-barbell', 4, 8],
          ['lib-x-overhead-press-barbell', 3, 8],
          ['lib-x-lat-pulldown-cable', 3, 10],
          ['lib-x-bicep-curl-dumbbell', 3, 12],
          ['lib-x-triceps-rope-pushdown', 3, 12],
        ],
      },
      {
        title: 'prog.upperlower.2',
        exercises: [
          ['lib-x-squat-barbell', 4, 6],
          ['lib-x-romanian-deadlift-barbell', 3, 8],
          ['lib-x-leg-press-45-degree', 3, 10],
          ['lib-x-lying-leg-curl-machine', 3, 10],
          ['lib-x-standing-calf-raise-machine', 4, 12],
        ],
      },
      {
        title: 'prog.upperlower.3',
        exercises: [
          ['lib-x-incline-bench-press-dumbbell', 4, 8],
          ['lib-x-seated-cable-row-v-grip-cable', 4, 10],
          ['lib-x-shoulder-press-dumbbell', 3, 10],
          ['lib-x-pull-up', 3, 8],
          ['lib-x-lateral-raise-dumbbell', 3, 15],
          ['lib-x-overhead-triceps-extension-cable', 3, 12],
          ['lib-x-hammer-curl-dumbbell', 3, 12],
        ],
      },
      {
        title: 'prog.upperlower.4',
        exercises: [
          ['lib-x-deadlift-barbell', 3, 5],
          ['lib-x-hack-squat-machine', 3, 10],
          ['lib-x-walking-lunge-dumbbell', 3, 12],
          ['lib-x-seated-leg-curl-machine', 3, 12],
          ['lib-x-seated-calf-raise-machine', 4, 15],
          ['lib-x-crunch-machine', 3, 12],
        ],
      },
    ],
  },
  {
    id: 'ppl',
    title: 'prog.ppl.title',
    summary: 'prog.ppl.summary',
    days: [
      {
        title: 'prog.ppl.1',
        exercises: [
          ['lib-x-bench-press-barbell', 4, 6],
          ['lib-x-incline-bench-press-dumbbell', 3, 10],
          ['lib-x-shoulder-press-dumbbell', 3, 10],
          ['lib-x-lateral-raise-dumbbell', 3, 15],
          ['lib-x-triceps-rope-pushdown', 3, 12],
          ['lib-x-overhead-triceps-extension-cable', 3, 12],
        ],
      },
      {
        title: 'prog.ppl.2',
        exercises: [
          ['lib-x-pull-up', 3, 8],
          ['lib-x-bent-over-row-barbell', 4, 8],
          ['lib-x-lat-pulldown-cable', 3, 10],
          ['lib-x-face-pull-cable', 3, 15],
          ['lib-x-bicep-curl-barbell', 3, 10],
          ['lib-x-hammer-curl-dumbbell', 3, 12],
        ],
      },
      {
        title: 'prog.ppl.3',
        exercises: [
          ['lib-x-squat-barbell', 4, 6],
          ['lib-x-romanian-deadlift-barbell', 3, 8],
          ['lib-x-leg-press-45-degree', 3, 10],
          ['lib-x-lying-leg-curl-machine', 3, 10],
          ['lib-x-leg-extension-machine', 3, 12],
          ['lib-x-standing-calf-raise-machine', 4, 12],
        ],
      },
    ],
  },
  {
    id: 'split',
    title: 'prog.split.title',
    summary: 'prog.split.summary',
    days: [
      {
        title: 'prog.split.1',
        exercises: [
          ['lib-x-bench-press-barbell', 4, 8],
          ['lib-x-incline-chest-press-machine', 3, 10],
          ['lib-x-chest-fly-machine', 3, 12],
          ['lib-x-cable-fly-crossover', 3, 12],
        ],
      },
      {
        title: 'prog.split.2',
        exercises: [
          ['lib-x-lat-pulldown-cable', 4, 10],
          ['lib-x-seated-cable-row-v-grip-cable', 3, 10],
          ['lib-x-single-arm-row-dumbbell', 3, 10],
          ['lib-x-straight-arm-pulldown-cable', 3, 12],
        ],
      },
      {
        title: 'prog.split.3',
        exercises: [
          ['lib-x-seated-shoulder-press-machine', 4, 10],
          ['lib-x-lateral-raise-dumbbell', 4, 15],
          ['lib-x-rear-delt-fly-machine', 3, 15],
          ['lib-x-front-raise-cable', 3, 12],
          ['lib-x-shrug-dumbbell', 3, 12],
        ],
      },
      {
        title: 'prog.split.4',
        exercises: [
          ['lib-x-bicep-curl-cable', 3, 12],
          ['lib-x-hammer-curl-dumbbell', 3, 12],
          ['lib-x-preacher-curl-machine', 3, 12],
          ['lib-x-triceps-rope-pushdown', 3, 12],
          ['lib-x-overhead-triceps-extension-cable', 3, 12],
          ['lib-x-triceps-dip-machine', 3, 10],
        ],
      },
      {
        title: 'prog.split.5',
        exercises: [
          ['lib-x-leg-press-45-degree', 4, 10],
          ['lib-x-hack-squat-machine', 3, 10],
          ['lib-x-leg-extension-machine', 3, 12],
          ['lib-x-lying-leg-curl-machine', 3, 12],
          ['lib-x-standing-calf-raise-machine', 4, 12],
        ],
      },
    ],
  },
  {
    id: 'machines',
    title: 'prog.machines.title',
    summary: 'prog.machines.summary',
    days: [
      {
        title: 'prog.machines.1',
        exercises: [
          ['lib-x-leg-press-45-degree', 3, 10],
          ['lib-x-chest-press-machine', 3, 10],
          ['lib-x-lat-pulldown-machine', 3, 10],
          ['lib-x-seated-shoulder-press-machine', 2, 10],
          ['lib-x-crunch-machine', 2, 12],
        ],
      },
      {
        title: 'prog.machines.2',
        exercises: [
          ['lib-x-hack-squat-machine', 3, 10],
          ['lib-x-incline-chest-press-machine', 3, 10],
          ['lib-x-seated-row-machine', 3, 10],
          ['lib-x-lateral-raise-machine', 2, 12],
          ['lib-x-lying-leg-curl-machine', 3, 10],
        ],
      },
      {
        title: 'prog.machines.3',
        exercises: [
          ['lib-x-leg-extension-machine', 3, 12],
          ['lib-x-chest-fly-machine', 3, 12],
          ['lib-x-seated-cable-row-v-grip-cable', 3, 10],
          ['lib-x-bicep-curl-cable', 2, 12],
          ['lib-x-triceps-rope-pushdown', 2, 12],
          ['lib-x-standing-calf-raise-machine', 3, 12],
        ],
      },
    ],
  },
  {
    id: 'dumbbells',
    title: 'prog.dumbbells.title',
    summary: 'prog.dumbbells.summary',
    days: [
      {
        title: 'prog.dumbbells.1',
        exercises: [
          ['lib-x-goblet-squat-dumbbell', 3, 10],
          ['lib-x-bench-press-dumbbell', 3, 10],
          ['lib-x-single-arm-row-dumbbell', 3, 10],
          ['lib-x-shoulder-press-dumbbell', 3, 10],
          ['lib-x-bicep-curl-dumbbell', 2, 12],
          ['lib-plank', 3],
        ],
      },
      {
        title: 'prog.dumbbells.2',
        exercises: [
          ['lib-x-romanian-deadlift-dumbbell', 3, 10],
          ['lib-x-push-up', 3],
          ['lib-x-bent-over-row-dumbbell', 3, 10],
          ['lib-x-lunge-dumbbell', 3, 10],
          ['lib-x-lateral-raise-dumbbell', 3, 12],
          ['lib-x-overhead-triceps-extension-dumbbell', 2, 12],
        ],
      },
      {
        title: 'prog.dumbbells.3',
        exercises: [
          ['lib-x-bulgarian-split-squat-dumbbell', 3, 10],
          ['lib-x-incline-bench-press-dumbbell', 3, 10],
          ['lib-x-chest-supported-row-dumbbell', 3, 10],
          ['lib-x-arnold-press-dumbbell', 3, 10],
          ['lib-x-hammer-curl-dumbbell', 2, 12],
          ['lib-x-triceps-kickback-dumbbell', 2, 12],
        ],
      },
    ],
  },
];
