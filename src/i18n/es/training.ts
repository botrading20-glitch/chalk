import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 es nada de reserva, 9 quizá una repetición más, 8 quizá dos. Es tu propia sensación, no una medición.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Series de calentamiento',
  'warmup.intro': 'Prepara series de calentamiento para un ejercicio a partir de su peso de trabajo. Cada paso es una parte de ese peso. Los ejercicios con discos usan tus discos, así que cada carga se puede montar de verdad en la barra.',
  'warmup.stepN': 'Calentamiento {n}',
  'warmup.percentLabel': 'Parte del peso de trabajo para el calentamiento {n}',
  'warmup.repsLabel': 'Repeticiones del calentamiento {n}',
  'warmup.addStep': 'Añadir un paso',
  'warmup.removeStep': 'Quitar el calentamiento {n}',
  'warmup.emptyBar': 'Empezar con la barra vacía',
  'warmup.emptyBarNote': 'Diez repeticiones solo con la barra, en ejercicios con barra, barra EZ y máquina Smith.',
  'warmup.round': 'Redondear las demás cargas a',
  'warmup.roundNote': 'Para mancuernas, máquinas y poleas. Los ejercicios con discos usan tus discos.',
  'warmup.previewTitle': 'Vista previa',
  'warmup.previewBar': '{weight} con barra',
  'warmup.previewOther': '{weight} en máquina o con mancuernas',
  'warmup.reset': 'Volver a los pasos habituales',
  'editor.warmups': 'Series de calentamiento',
  'warmup.needWeight': 'Escribe primero el peso de trabajo y luego añade el calentamiento.',
  'warmup.tooLight': 'Ese peso es demasiado ligero para pasos de calentamiento.',
  'warmup.replaceTitle': '¿Reemplazar el calentamiento?',
  'warmup.replaceText': 'Este ejercicio ya tiene series de calentamiento. Se reemplazarán por las nuevas.',
  'warmup.replaceConfirm': 'Reemplazar',
  'warmup.added': 'Calentamiento añadido para {weight}',
  'set.liveRecords': 'Celebrar los récords mientras entrenas',
  'set.liveRecordsNote': 'Un mensaje y un trofeo cuando una serie marcada supera tu mejor marca.',
  'set.inlineStopwatch': 'Botón de cronómetro en series con tiempo',
  'set.supersetScroll': 'Ir al siguiente ejercicio de una superserie',
  'set.plateShortcut': 'Botón de discos en ejercicios con barra',
  'record.toast': '¡Nuevo récord! {exercise}: {record}',
  'record.setLabel': 'La serie {label} batió un récord',

  // Muscle map
  'muscles.title': 'Músculos',
  'muscles.label': 'Músculos trabajados: {list}',
  'muscles.none': 'Aún no se ha contado ninguna serie.',
  'muscles.front': 'Frente',
  'muscles.back': 'Espalda',
  'muscles.colMuscle': 'Músculo',
  'muscles.colSets': 'Series',
  'muscles.how': 'Una serie cuenta una vez para el músculo principal y media vez para cada músculo auxiliar. El calentamiento no cuenta.',
  'muscles.worked': 'Músculos trabajados',
  'muscles.open': 'Mostrar los músculos trabajados hasta ahora',
} satisfies Record<string, Message>;
