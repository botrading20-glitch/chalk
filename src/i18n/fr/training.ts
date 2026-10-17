import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 : plus rien en réserve, 9 : peut-être une répétition de plus, 8 : peut-être deux. C’est votre ressenti, pas une mesure.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Séries d’échauffement',
  'warmup.intro': 'Prépare des séries d’échauffement pour un exercice à partir de sa charge de travail. Chaque étape est une part de cette charge. Les exercices à disques utilisent vos disques : chaque charge peut vraiment se monter sur la barre.',
  'warmup.stepN': 'Échauffement {n}',
  'warmup.percentLabel': 'Part de la charge de travail pour l’échauffement {n}',
  'warmup.repsLabel': 'Répétitions pour l’échauffement {n}',
  'warmup.addStep': 'Ajouter une étape',
  'warmup.removeStep': 'Supprimer l’échauffement {n}',
  'warmup.emptyBar': 'Commencer avec la barre à vide',
  'warmup.emptyBarNote': 'Dix répétitions avec la barre seule, pour les exercices à la barre, à la barre EZ et à la Smith machine.',
  'warmup.round': 'Arrondir les autres charges à',
  'warmup.roundNote': 'Pour les haltères, les machines et les poulies. Les exercices à disques utilisent vos disques.',
  'warmup.previewTitle': 'Aperçu',
  'warmup.previewBar': '{weight} à la barre',
  'warmup.previewOther': '{weight} sur une machine ou aux haltères',
  'warmup.reset': 'Revenir aux étapes habituelles',
  'editor.warmups': 'Séries d’échauffement',
  'warmup.needWeight': 'Saisissez d’abord la charge de travail, puis ajoutez l’échauffement.',
  'warmup.tooLight': 'Cette charge est trop légère pour des étapes d’échauffement.',
  'warmup.replaceTitle': 'Remplacer l’échauffement ?',
  'warmup.replaceText': 'Cet exercice a déjà des séries d’échauffement. Elles seront remplacées par les nouvelles.',
  'warmup.replaceConfirm': 'Remplacer',
  'warmup.added': 'Échauffement ajouté pour {weight}',
  'set.liveRecords': 'Fêter les records pendant l’entraînement',
  'set.liveRecordsNote': 'Un message et un trophée quand une série cochée bat votre meilleur.',
  'set.inlineStopwatch': 'Bouton chrono sur les séries chronométrées',
  'set.supersetScroll': 'Aller à l’exercice suivant d’un superset',
  'set.plateShortcut': 'Bouton disques sur les exercices à la barre',
  'record.toast': 'Nouveau record ! {exercise} : {record}',
  'record.setLabel': 'La série {label} a battu un record',

  // Muscle map
  'muscles.title': 'Muscles',
  'muscles.label': 'Muscles travaillés : {list}',
  'muscles.none': 'Aucune série comptée pour l’instant.',
  'muscles.front': 'Face',
  'muscles.back': 'Dos',
  'muscles.colMuscle': 'Muscle',
  'muscles.colSets': 'Séries',
  'muscles.how': 'Une série compte une fois pour le muscle principal et à moitié pour chaque muscle secondaire. Les échauffements ne comptent pas.',
  'muscles.worked': 'Muscles travaillés',
  'muscles.open': 'Afficher les muscles travaillés jusqu’ici',
} satisfies Record<string, Message>;
