import type { Message } from '../message';

export default {

  'error.githubOffline': "Couldn't reach GitHub. Check your connection.",
  'error.githubToken': 'GitHub rejected the access token. It may have expired or been revoked.',
  'error.githubRate': 'GitHub is rate-limiting requests. Sync will try again later.',
  'error.githubWrite': 'The access token can’t write to this repository. Give it “Contents: Read and write” access.',
  'error.githubNotFound': 'Repository not found, or the access token can’t see it.',
  'error.githubStatus': 'GitHub answered with error {status}.',
  'error.backupJson': "This file isn't valid JSON. Pick a backup exported from Setward.",
  'error.backupApp': "This file isn't a Setward backup. Pick a file exported from Settings → Back up data.",
  'error.importUnknown': 'Setward can’t read this file. Use a CSV exported from Strong, or from Setward itself.',
  'error.notStrong': 'This file isn’t a Strong export: the "Exercise Name" and "Set Order" columns are missing.',
  'error.notSetwardCsv': 'This file isn’t a Setward CSV: the "set_type" and "weight_kg" columns are missing.',
  'error.noWorkoutsInFile': 'No workouts found in this file.',
  'error.noActive': 'No workout in progress.',
  'import.defaultWorkout': 'Workout',
  'import.unknownExercise': 'Unknown exercise',

  'error.syncUnknownFile': 'The sync repository contains a file Setward does not recognise.',
  'error.syncConflict': 'The cloud copy changed during sync.',
  'rest.until': 'Resting until {time}',
} satisfies Record<string, Message>;
