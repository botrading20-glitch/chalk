import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 significa niente in riserva, 9 forse una ripetizione in più, 8 forse due. È la tua sensazione, non una misura.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Serie di riscaldamento',
  'warmup.intro': 'Prepara serie di riscaldamento per un esercizio partendo dal carico di lavoro. Ogni passo è una parte di quel carico. Gli esercizi con i dischi usano i tuoi dischi, quindi ogni carico si può davvero montare sul bilanciere.',
  'warmup.stepN': 'Riscaldamento {n}',
  'warmup.percentLabel': 'Parte del carico di lavoro per il riscaldamento {n}',
  'warmup.repsLabel': 'Ripetizioni del riscaldamento {n}',
  'warmup.addStep': 'Aggiungi un passo',
  'warmup.removeStep': 'Rimuovi il riscaldamento {n}',
  'warmup.emptyBar': 'Inizia con il bilanciere vuoto',
  'warmup.emptyBarNote': 'Dieci ripetizioni solo con il bilanciere, per esercizi con bilanciere, barra EZ e Smith machine.',
  'warmup.round': 'Arrotonda gli altri carichi a',
  'warmup.roundNote': 'Per manubri, macchine e cavi. Gli esercizi con i dischi usano invece i tuoi dischi.',
  'warmup.previewTitle': 'Anteprima',
  'warmup.previewBar': '{weight} con il bilanciere',
  'warmup.previewOther': '{weight} su una macchina o con i manubri',
  'warmup.reset': 'Torna ai passi abituali',
  'editor.warmups': 'Serie di riscaldamento',
  'warmup.needWeight': 'Inserisci prima il carico di lavoro, poi aggiungi il riscaldamento.',
  'warmup.tooLight': 'Questo carico è troppo leggero per i passi di riscaldamento.',
  'warmup.replaceTitle': 'Sostituire il riscaldamento?',
  'warmup.replaceText': 'Questo esercizio ha già serie di riscaldamento. Verranno sostituite da quelle nuove.',
  'warmup.replaceConfirm': 'Sostituisci',
  'warmup.added': 'Riscaldamento aggiunto per {weight}',
  'set.liveRecords': 'Festeggia i record mentre ti alleni',
  'set.liveRecordsNote': 'Un messaggio e un trofeo quando una serie spuntata supera il tuo meglio.',
  'set.inlineStopwatch': 'Pulsante cronometro sulle serie a tempo',
  'set.supersetScroll': 'Passa all’esercizio successivo di un superset',
  'set.plateShortcut': 'Pulsante dischi sugli esercizi con bilanciere',
  'record.toast': 'Nuovo record! {exercise}: {record}',
  'record.setLabel': 'La serie {label} ha battuto un record',
} satisfies Record<string, Message>;
