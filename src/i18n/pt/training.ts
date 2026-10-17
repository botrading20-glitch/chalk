import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 é nada de reserva, 9 talvez mais uma repetição, 8 talvez duas. É a sua própria sensação, não uma medição.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Séries de aquecimento',
  'warmup.intro': 'Monta séries de aquecimento para um exercício a partir da carga de trabalho. Cada etapa é uma parte dessa carga. Exercícios com anilhas usam as suas anilhas, então toda carga pode mesmo ser montada na barra.',
  'warmup.stepN': 'Aquecimento {n}',
  'warmup.percentLabel': 'Parte da carga de trabalho para o aquecimento {n}',
  'warmup.repsLabel': 'Repetições do aquecimento {n}',
  'warmup.addStep': 'Adicionar uma etapa',
  'warmup.removeStep': 'Remover o aquecimento {n}',
  'warmup.emptyBar': 'Começar com a barra vazia',
  'warmup.emptyBarNote': 'Dez repetições só com a barra, em exercícios com barra, barra W e Smith.',
  'warmup.round': 'Arredondar as outras cargas para',
  'warmup.roundNote': 'Para halteres, máquinas e polias. Exercícios com anilhas usam as suas anilhas.',
  'warmup.previewTitle': 'Prévia',
  'warmup.previewBar': '{weight} na barra',
  'warmup.previewOther': '{weight} em máquina ou com halteres',
  'warmup.reset': 'Voltar às etapas habituais',
  'editor.warmups': 'Séries de aquecimento',
  'warmup.needWeight': 'Digite primeiro a carga de trabalho e depois adicione o aquecimento.',
  'warmup.tooLight': 'Essa carga é leve demais para etapas de aquecimento.',
  'warmup.replaceTitle': 'Substituir o aquecimento?',
  'warmup.replaceText': 'Este exercício já tem séries de aquecimento. Elas serão substituídas pelas novas.',
  'warmup.replaceConfirm': 'Substituir',
  'warmup.added': 'Aquecimento adicionado para {weight}',
  'set.liveRecords': 'Comemorar recordes durante o treino',
  'set.liveRecordsNote': 'Uma mensagem e um troféu quando uma série marcada supera o seu melhor.',
  'set.inlineStopwatch': 'Botão de cronômetro em séries com tempo',
  'set.supersetScroll': 'Ir para o próximo exercício de um superset',
  'set.plateShortcut': 'Botão de anilhas em exercícios com barra',
  'record.toast': 'Novo recorde! {exercise}: {record}',
  'record.setLabel': 'A série {label} bateu um recorde',
} satisfies Record<string, Message>;
