import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 hiç tekrar kalmadı, 9 belki bir tekrar daha, 8 belki iki tekrar demek. Bu senin kendi hissin, bir ölçüm değil.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Isınma setleri',
  'warmup.intro': 'Bir egzersiz için çalışma ağırlığından ısınma setleri hazırlar. Her adım bu ağırlığın bir oranıdır. Plakalı egzersizler plakalarını kullanır; böylece her yük gerçekten bara takılabilir.',
  'warmup.stepN': 'Isınma {n}',
  'warmup.percentLabel': 'Isınma {n} için çalışma ağırlığının oranı',
  'warmup.repsLabel': 'Isınma {n} için tekrar',
  'warmup.addStep': 'Adım ekle',
  'warmup.removeStep': 'Isınma {n} adımını kaldır',
  'warmup.emptyBar': 'Boş barla başla',
  'warmup.emptyBarNote': 'Barbell, EZ bar ve Smith makinesi egzersizlerinde yalnızca barla on tekrar.',
  'warmup.round': 'Diğer yükleri şuna yuvarla',
  'warmup.roundNote': 'Dambıl, makine ve kablo için. Plakalı egzersizler bunun yerine plakalarını kullanır.',
  'warmup.previewTitle': 'Önizleme',
  'warmup.previewBar': 'Barbellde {weight}',
  'warmup.previewOther': 'Makinede veya dambılla {weight}',
  'warmup.reset': 'Her zamanki adımlara dön',
  'editor.warmups': 'Isınma setleri',
  'warmup.needWeight': 'Önce çalışma ağırlığını gir, sonra ısınmayı ekle.',
  'warmup.tooLight': 'Bu ağırlık ısınma adımları için fazla hafif.',
  'warmup.replaceTitle': 'Isınma setleri değiştirilsin mi?',
  'warmup.replaceText': 'Bu egzersizde zaten ısınma setleri var. Yenileriyle değiştirilecek.',
  'warmup.replaceConfirm': 'Değiştir',
  'warmup.added': '{weight} için ısınma eklendi',
  'set.liveRecords': 'Antrenman sırasında rekorları kutla',
  'set.liveRecordsNote': 'İşaretlenen bir set en iyini geçince bir mesaj ve kupa gösterilir.',
  'set.inlineStopwatch': 'Süreli setlerde kronometre düğmesi',
  'set.supersetScroll': 'Süperset’te sonraki egzersize kaydır',
  'set.plateShortcut': 'Barbell egzersizlerinde plaka düğmesi',
  'record.toast': 'Yeni rekor! {exercise}: {record}',
  'record.setLabel': '{label} seti bir rekor kırdı',

  // Muscle map
  'muscles.title': 'Kaslar',
  'muscles.label': 'Çalışan kaslar: {list}',
  'muscles.none': 'Henüz sayılan set yok.',
  'muscles.front': 'Ön',
  'muscles.back': 'Arka',
  'muscles.colMuscle': 'Kas',
  'muscles.colSets': 'Set',
  'muscles.how': 'Bir set ana kas için bir, her yardımcı kas için yarım sayılır. Isınma setleri sayılmaz.',
  'muscles.worked': 'Çalışan kaslar',
  'muscles.open': 'Şimdiye kadar çalışan kasları göster',
} satisfies Record<string, Message>;
