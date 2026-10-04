// Writes a realistic Chalk backup for QA: about four months of a body-part
// split on machines and cables, routines in a folder, and weekly weigh-ins.
// Restore it in a dev browser through Progress → Settings → Restore backup.
//
//   node scripts/sample-backup.mjs [output path]
//
// The data is generated from a fixed seed, so every run gives the same file
// (relative to today's date).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] ?? `${root}/tmp-import/chalk-sample-backup.json`);
const library = new Map(JSON.parse(readFileSync(`${root}/src/data/exercises.json`, 'utf8')).map((e) => [e.id, e]));

// mulberry32: small deterministic PRNG.
let seed = 0x5eed;
function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (list) => list[Math.floor(rand() * list.length)];
let idCounter = 0;
const id = (prefix) => `${prefix}-sample-${(++idCounter).toString(36).padStart(4, '0')}`;

const custom = {
  id: 'cus-sample-seated-dip',
  name: 'Seated Dip (Machine)',
  type: 'weight_reps',
  equipment: 'machine',
  primaryMuscle: 'triceps',
  secondaryMuscles: ['chest', 'shoulders'],
  instructions: [],
  images: [],
  source: 'custom',
};

// [exercise id, start kg, kg added per 4 weeks, reps, working sets, warm-ups]
const DAYS = {
  'Chest day': [
    ['lib-x-chest-press-machine', 55, 5, 10, 3, 1],
    ['lib-x-incline-chest-press-machine', 40, 2.5, 10, 3, 0],
    ['lib-x-chest-fly-machine', 45, 2.5, 12, 3, 0],
    ['lib-cable-chest-press', 20, 1.25, 12, 2, 0],
  ],
  'Back day': [
    ['lib-x-lat-pulldown-machine', 60, 5, 10, 3, 1],
    ['lib-x-seated-cable-row-v-grip-cable', 55, 2.5, 10, 3, 0],
    ['lib-x-rear-delt-fly-machine', 35, 2.5, 15, 3, 0],
    ['lib-face-pull', 25, 1.25, 15, 2, 0],
  ],
  'Shoulders day': [
    ['lib-x-seated-shoulder-press-machine', 40, 2.5, 10, 3, 1],
    ['lib-x-lateral-raise-cable', 7.5, 1.25, 15, 3, 0],
    ['lib-x-lateral-raise-machine', 30, 2.5, 12, 3, 0],
    ['lib-cable-rear-delt-fly', 10, 1.25, 15, 2, 0],
  ],
  'Arms day': [
    ['lib-x-bicep-curl-cable', 25, 2.5, 12, 3, 0],
    ['lib-triceps-pushdown-rope-attachment', 25, 2.5, 12, 3, 0],
    ['lib-x-preacher-curl-machine', 25, 2.5, 10, 3, 0],
    ['cus-sample-seated-dip', 60, 5, 10, 3, 0],
    ['lib-x-hammer-curl-cable', 20, 2.5, 12, 2, 0],
  ],
  'Leg day': [
    ['lib-x-leg-press-45-degree', 140, 10, 12, 3, 1],
    ['lib-x-hack-squat-machine', 60, 5, 10, 3, 0],
    ['lib-x-leg-extension-machine', 45, 5, 12, 3, 0],
    ['lib-seated-leg-curl', 40, 2.5, 12, 3, 0],
    ['lib-x-calf-press-machine', 80, 5, 15, 3, 0],
    ['lib-plank', 0, 0, 0, 2, 0],
  ],
};

for (const list of Object.values(DAYS)) {
  for (const [exerciseId] of list) {
    if (exerciseId !== custom.id && !library.has(exerciseId)) throw new Error(`Unknown library exercise ${exerciseId}`);
  }
}

const typeOf = (exerciseId) => (exerciseId === custom.id ? custom.type : library.get(exerciseId).type);
const round = (kg, step = 1.25) => Math.round(kg / step) * step;
const DAY = 86_400_000;

function sets(exerciseId, kg, reps, working, warmups, weekIndex) {
  const type = typeOf(exerciseId);
  const out = [];
  if (type === 'duration') {
    for (let i = 0; i < working; i++) out.push({ id: id('set'), type: 'normal', duration: 45 + weekIndex * 3 + Math.round(rand() * 10), completed: true });
    return out;
  }
  for (let i = 0; i < warmups; i++) out.push({ id: id('set'), type: 'warmup', weight: round(kg * 0.5), reps: 10, completed: true });
  for (let i = 0; i < working; i++) {
    const last = i === working - 1;
    const tired = Math.floor(rand() * 2) + i;
    out.push({
      id: id('set'),
      type: last && rand() < 0.25 ? 'failure' : 'normal',
      weight: kg,
      reps: Math.max(5, reps - tired + (rand() < 0.3 ? 2 : 0)),
      completed: true,
    });
  }
  if (rand() < 0.15) out.push({ id: id('set'), type: 'dropset', weight: round(kg * 0.7), reps: reps, completed: true });
  return out;
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const start = today.getTime() - 16 * 7 * DAY;
const workouts = [];
const order = Object.keys(DAYS);
let next = 0;

for (let day = start; day < today.getTime(); day += DAY) {
  const weekday = new Date(day).getDay();
  // Mon, Tue, Thu, Fri, Sat, with a skipped session now and then.
  if (![1, 2, 4, 5, 6].includes(weekday) || rand() < 0.2) continue;
  const title = order[next++ % order.length];
  const weekIndex = Math.floor((day - start) / (7 * DAY));
  const startTime = day + (21 * 60 + 30 + Math.round(rand() * 40)) * 60_000;
  const exercises = DAYS[title].map(([exerciseId, kg, step, reps, working, warmups]) => ({
    id: id('we'),
    exerciseId,
    restSeconds: typeOf(exerciseId) === 'duration' ? 60 : 90,
    sets: sets(exerciseId, round(kg + step * Math.floor(weekIndex / 4) + (rand() < 0.2 ? step / 2 : 0)), reps, working, warmups, weekIndex),
  }));
  if (title === 'Leg day' && rand() < 0.5) {
    exercises.push({
      id: id('we'),
      exerciseId: 'lib-x-treadmill-incline-walk',
      sets: [{ id: id('set'), type: 'normal', distance: Math.round((1.6 + rand()) * 100) / 100, duration: 900 + Math.round(rand() * 300), completed: true }],
    });
  }
  if (rand() < 0.2) exercises[0].notes = pick(['Seat on 4', 'Felt strong today', 'Grip slipped on the last set', 'Slow negatives']);
  workouts.push({
    id: id('w'),
    title,
    description: rand() < 0.15 ? pick(['Short on time', 'Great pump', 'Gym was packed']) : undefined,
    startTime,
    endTime: startTime + (55 + Math.round(rand() * 35)) * 60_000,
    exercises,
    exerciseIds: [...new Set(exercises.map((e) => e.exerciseId))],
  });
}

const now = Date.now();
const routines = order.map((title, i) => ({
  id: `rt-sample-${i + 1}`,
  title,
  folder: 'Body-part split',
  order: i + 1,
  createdAt: start,
  updatedAt: start,
  exercises: DAYS[title].map(([exerciseId, kg, , reps, working, warmups]) => ({
    id: id('we'),
    exerciseId,
    restSeconds: 90,
    sets: [
      ...Array.from({ length: warmups }, () => ({ id: id('set'), type: 'warmup', weight: round(kg * 0.5), reps: 10, completed: false })),
      ...Array.from({ length: working }, () => ({
        id: id('set'),
        type: 'normal',
        ...(typeOf(exerciseId) === 'duration' ? { duration: 60 } : { weight: kg, reps }),
        completed: false,
      })),
    ],
  })),
}));
routines.push({
  id: 'rt-sample-6',
  title: 'Quick full body',
  order: 6,
  createdAt: start,
  updatedAt: start,
  exercises: ['lib-x-chest-press-machine', 'lib-x-lat-pulldown-machine', 'lib-x-leg-press-45-degree'].map((exerciseId) => ({
    id: id('we'),
    exerciseId,
    sets: Array.from({ length: 3 }, () => ({ id: id('set'), type: 'normal', completed: false })),
  })),
});

const bodyweight = [];
for (let week = 0; week < 16; week++) {
  const date = start + week * 7 * DAY + 2 * DAY;
  bodyweight.push({ id: id('bw'), date, weight: Math.round((78.4 - week * 0.12 + (rand() - 0.5) * 0.8) * 10) / 10, updatedAt: date });
}

const backup = {
  app: 'chalk',
  version: 1,
  exportedAt: new Date(now).toISOString(),
  exercises: [custom],
  workouts,
  routines,
  bodyweight,
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(backup));
console.log(`Wrote ${workouts.length} workouts, ${routines.length} routines and ${bodyweight.length} weigh-ins to ${out}`);
