import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 betekent niets meer over, 9 misschien nog één herhaling, 8 misschien twee. Het is je eigen gevoel, geen meting.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Opwarmsets',
  'warmup.intro': 'Maakt opwarmsets voor een oefening vanuit het werkgewicht. Elke stap is een deel van dat gewicht. Oefeningen met schijven gebruiken jouw schijven, zodat elke belasting echt op de stang past.',
  'warmup.stepN': 'Opwarmen {n}',
  'warmup.percentLabel': 'Deel van het werkgewicht voor opwarmen {n}',
  'warmup.repsLabel': 'Herhalingen voor opwarmen {n}',
  'warmup.addStep': 'Stap toevoegen',
  'warmup.removeStep': 'Opwarmen {n} verwijderen',
  'warmup.emptyBar': 'Beginnen met de lege stang',
  'warmup.emptyBarNote': 'Tien herhalingen met alleen de stang, voor oefeningen met stang, EZ-stang en Smith-machine.',
  'warmup.round': 'Andere belastingen afronden op',
  'warmup.roundNote': 'Voor dumbbells, machines en kabels. Oefeningen met schijven gebruiken juist jouw schijven.',
  'warmup.previewTitle': 'Voorbeeld',
  'warmup.previewBar': '{weight} aan de stang',
  'warmup.previewOther': '{weight} aan een machine of met dumbbells',
  'warmup.reset': 'Terug naar de gebruikelijke stappen',
  'editor.warmups': 'Opwarmsets',
  'warmup.needWeight': 'Vul eerst het werkgewicht in en voeg dan het opwarmen toe.',
  'warmup.tooLight': 'Dat gewicht is te licht voor opwarmstappen.',
  'warmup.replaceTitle': 'Opwarmsets vervangen?',
  'warmup.replaceText': 'Deze oefening heeft al opwarmsets. Ze worden vervangen door de nieuwe.',
  'warmup.replaceConfirm': 'Vervangen',
  'warmup.added': 'Opwarmsets toegevoegd voor {weight}',
  'set.liveRecords': 'Records vieren tijdens het trainen',
  'set.liveRecordsNote': 'Een bericht en een trofee als een afgevinkte set je beste overtreft.',
  'set.inlineStopwatch': 'Stopwatchknop bij sets met tijd',
  'set.supersetScroll': 'Naar de volgende oefening in een superset scrollen',
  'set.plateShortcut': 'Schijvenknop bij oefeningen met stang',
  'record.toast': 'Nieuw record! {exercise}: {record}',
  'record.setLabel': 'Set {label} verbrak een record',
} satisfies Record<string, Message>;
