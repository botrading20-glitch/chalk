import type { Message } from '../message';

// Training tools: warm-ups, muscle map, monthly report, guides, set videos.
export default {

  // Effort scale
  'editor.rpeGuide': '10 means nothing left, 9 maybe one more rep, 8 maybe two. It’s your own feel, not a measurement.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Warm-up sets',
  'warmup.intro': 'Builds warm-up sets for an exercise from its working weight. Each step is a share of that weight. Plate-loaded exercises use your plates, so every load is one you can actually put on the bar.',
  'warmup.stepN': 'Warm-up {n}',
  'warmup.percentLabel': 'Share of the working weight for warm-up {n}',
  'warmup.repsLabel': 'Reps for warm-up {n}',
  'warmup.addStep': 'Add a step',
  'warmup.removeStep': 'Remove warm-up {n}',
  'warmup.emptyBar': 'Start with the empty bar',
  'warmup.emptyBarNote': 'Ten reps with just the bar, for barbell, EZ bar and Smith machine exercises.',
  'warmup.round': 'Round other loads to',
  'warmup.roundNote': 'For dumbbells, machines and cables. Plate-loaded exercises use your plates instead.',
  'warmup.previewTitle': 'Preview',
  'warmup.previewBar': '{weight} on a barbell',
  'warmup.previewOther': '{weight} on a machine or dumbbells',
  'warmup.reset': 'Back to the usual steps',
  'editor.warmups': 'Warm-up sets',
  'warmup.needWeight': 'Enter the working weight first, then add warm-ups.',
  'warmup.tooLight': 'That weight is too light for warm-up steps.',
  'warmup.replaceTitle': 'Replace the warm-ups?',
  'warmup.replaceText': 'This exercise already has warm-up sets. They will be replaced by the new ones.',
  'warmup.replaceConfirm': 'Replace',
  'warmup.added': 'Warm-ups added for {weight}',
  'set.liveRecords': 'Celebrate records as you train',
  'set.liveRecordsNote': 'A message and a trophy when a checked set beats your best.',
  'set.inlineStopwatch': 'Stopwatch button on timed sets',
  'set.supersetScroll': 'Scroll to the next exercise in a superset',
  'set.plateShortcut': 'Plate button on barbell exercises',
  'record.toast': 'New record! {exercise}: {record}',
  'record.setLabel': 'Set {label} broke a record',

  // Muscle map
  'muscles.title': 'Muscles',
  'muscles.label': 'Muscles worked: {list}',
  'muscles.none': 'No sets counted yet.',
  'muscles.front': 'Front',
  'muscles.back': 'Back',
  'muscles.colMuscle': 'Muscle',
  'muscles.colSets': 'Sets',
  'muscles.how': 'A set counts once for the main muscle and half for each helper muscle. Warm-ups are left out.',
  'muscles.worked': 'Muscles worked',
  'muscles.open': 'Show the muscles worked so far',
} satisfies Record<string, Message>;
