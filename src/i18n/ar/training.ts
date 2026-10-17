import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 تعني أنه لا شيء متبقٍ، و9 ربما تكرار واحد إضافي، و8 ربما تكراران. هذا شعورك أنت، وليس قياسًا.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'مجموعات الإحماء',
  'warmup.intro': 'يجهّز مجموعات إحماء لتمرين انطلاقًا من وزن العمل. كل خطوة نسبة من ذلك الوزن. التمارين التي تُحمَّل بالأقراص تستخدم أقراصك، فكل حِمل يمكنك تركيبه فعلًا على البار.',
  'warmup.stepN': 'الإحماء {n}',
  'warmup.percentLabel': 'نسبة وزن العمل للإحماء {n}',
  'warmup.repsLabel': 'عدد التكرارات للإحماء {n}',
  'warmup.addStep': 'إضافة خطوة',
  'warmup.removeStep': 'حذف الإحماء {n}',
  'warmup.emptyBar': 'ابدأ بالبار فارغًا',
  'warmup.emptyBarNote': 'عشرة تكرارات بالبار وحده، لتمارين البار وبار EZ وجهاز سميث.',
  'warmup.round': 'تقريب الأحمال الأخرى إلى',
  'warmup.roundNote': 'للدمبل والأجهزة والكابلات. أما التمارين بالأقراص فتستخدم أقراصك.',
  'warmup.previewTitle': 'معاينة',
  'warmup.previewBar': '{weight} على البار',
  'warmup.previewOther': '{weight} على جهاز أو دمبل',
  'warmup.reset': 'العودة إلى الخطوات المعتادة',
  'editor.warmups': 'مجموعات الإحماء',
  'warmup.needWeight': 'أدخل وزن العمل أولًا ثم أضف الإحماء.',
  'warmup.tooLight': 'هذا الوزن خفيف جدًا لخطوات الإحماء.',
  'warmup.replaceTitle': 'استبدال الإحماء؟',
  'warmup.replaceText': 'لهذا التمرين مجموعات إحماء بالفعل. سيتم استبدالها بالجديدة.',
  'warmup.replaceConfirm': 'استبدال',
  'warmup.added': 'أُضيف الإحماء لوزن {weight}',
  'set.liveRecords': 'احتفل بالأرقام القياسية أثناء التمرين',
  'set.liveRecordsNote': 'رسالة وكأس عندما تتفوق مجموعة محددة على أفضل ما لديك.',
  'set.inlineStopwatch': 'زر ساعة إيقاف على المجموعات الزمنية',
  'set.supersetScroll': 'الانتقال إلى التمرين التالي في السوبرست',
  'set.plateShortcut': 'زر الأقراص في تمارين البار',
  'record.toast': 'رقم قياسي جديد! {exercise}: {record}',
  'record.setLabel': 'المجموعة {label} حطمت رقمًا قياسيًا',
} satisfies Record<string, Message>;
