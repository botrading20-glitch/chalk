import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 heißt nichts mehr in Reserve, 9 vielleicht eine Wiederholung mehr, 8 vielleicht zwei. Es ist dein eigenes Gefühl, keine Messung.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Aufwärmsätze',
  'warmup.intro': 'Erstellt Aufwärmsätze für eine Übung aus ihrem Arbeitsgewicht. Jeder Schritt ist ein Anteil dieses Gewichts. Übungen mit Scheiben nutzen deine Scheiben, damit jede Last wirklich auf die Stange passt.',
  'warmup.stepN': 'Aufwärmen {n}',
  'warmup.percentLabel': 'Anteil des Arbeitsgewichts für Aufwärmen {n}',
  'warmup.repsLabel': 'Wiederholungen für Aufwärmen {n}',
  'warmup.addStep': 'Schritt hinzufügen',
  'warmup.removeStep': 'Aufwärmen {n} entfernen',
  'warmup.emptyBar': 'Mit der leeren Stange beginnen',
  'warmup.emptyBarNote': 'Zehn Wiederholungen nur mit der Stange, für Übungen mit Langhantel, SZ-Stange und Multipresse.',
  'warmup.round': 'Andere Lasten runden auf',
  'warmup.roundNote': 'Für Kurzhanteln, Maschinen und Kabelzüge. Übungen mit Scheiben nutzen stattdessen deine Scheiben.',
  'warmup.previewTitle': 'Vorschau',
  'warmup.previewBar': '{weight} an der Langhantel',
  'warmup.previewOther': '{weight} an einer Maschine oder mit Kurzhanteln',
  'warmup.reset': 'Zurück zu den üblichen Schritten',
  'editor.warmups': 'Aufwärmsätze',
  'warmup.needWeight': 'Gib zuerst das Arbeitsgewicht ein und füge dann das Aufwärmen hinzu.',
  'warmup.tooLight': 'Dieses Gewicht ist zu leicht für Aufwärmschritte.',
  'warmup.replaceTitle': 'Aufwärmsätze ersetzen?',
  'warmup.replaceText': 'Diese Übung hat schon Aufwärmsätze. Sie werden durch die neuen ersetzt.',
  'warmup.replaceConfirm': 'Ersetzen',
  'warmup.added': 'Aufwärmsätze für {weight} hinzugefügt',
  'set.liveRecords': 'Rekorde beim Training feiern',
  'set.liveRecordsNote': 'Eine Meldung und ein Pokal, wenn ein abgehakter Satz deine Bestleistung übertrifft.',
  'set.inlineStopwatch': 'Stoppuhr-Taste bei Sätzen mit Zeit',
  'set.supersetScroll': 'Zur nächsten Übung im Supersatz springen',
  'set.plateShortcut': 'Scheiben-Taste bei Langhantelübungen',
  'record.toast': 'Neuer Rekord! {exercise}: {record}',
  'record.setLabel': 'Satz {label} hat einen Rekord gebrochen',
} satisfies Record<string, Message>;
