import type { Equipment, Exercise, Muscle } from '../types';
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from './meta';

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/dumbell/g, 'dumbbell')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(query: string) {
  // Drop a trailing plural "s" so "curls" still finds "Curl".
  return normalize(query)
    .split(' ')
    .filter(Boolean)
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
}

export interface ExerciseFilter {
  query: string;
  muscle?: Muscle;
  equipment?: Equipment;
  customOnly?: boolean;
}

export function searchExercises(list: Exercise[], f: ExerciseFilter) {
  const qTokens = tokens(f.query);
  const qFull = normalize(f.query);
  const scored: { e: Exercise; score: number }[] = [];
  for (const e of list) {
    if (f.muscle && e.primaryMuscle !== f.muscle) continue;
    if (f.equipment && e.equipment !== f.equipment) continue;
    if (f.customOnly && e.source !== 'custom') continue;
    if (!qTokens.length) {
      scored.push({ e, score: 0 });
      continue;
    }
    const name = normalize(e.name);
    const hay = `${name} ${normalize(EQUIPMENT_LABEL[e.equipment])} ${normalize(MUSCLE_LABEL[e.primaryMuscle])}`;
    if (!qTokens.every((t) => hay.includes(t))) continue;
    const words = name.split(' ');
    let score = 3;
    if (name === qFull) score = 0;
    else if (name.startsWith(qFull)) score = 1;
    else if (qTokens.every((t) => words.some((w) => w.startsWith(t)))) score = 2;
    scored.push({ e, score });
  }
  scored.sort((a, b) => a.score - b.score || a.e.name.localeCompare(b.e.name));
  return scored.map((s) => s.e);
}
