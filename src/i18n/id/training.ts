import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 berarti tidak ada tenaga tersisa, 9 mungkin satu repetisi lagi, 8 mungkin dua. Ini perasaanmu sendiri, bukan pengukuran.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Set pemanasan',
  'warmup.intro': 'Menyusun set pemanasan untuk sebuah latihan dari beban kerjanya. Setiap langkah adalah sebagian dari beban itu. Latihan dengan pelat memakai pelat milikmu, jadi setiap beban benar-benar bisa dipasang di barbel.',
  'warmup.stepN': 'Pemanasan {n}',
  'warmup.percentLabel': 'Bagian dari beban kerja untuk pemanasan {n}',
  'warmup.repsLabel': 'Repetisi untuk pemanasan {n}',
  'warmup.addStep': 'Tambah langkah',
  'warmup.removeStep': 'Hapus pemanasan {n}',
  'warmup.emptyBar': 'Mulai dengan barbel kosong',
  'warmup.emptyBarNote': 'Sepuluh repetisi hanya dengan barbel, untuk latihan barbel, EZ bar, dan mesin Smith.',
  'warmup.round': 'Bulatkan beban lain ke',
  'warmup.roundNote': 'Untuk dumbel, mesin, dan kabel. Latihan dengan pelat memakai pelatmu.',
  'warmup.previewTitle': 'Pratinjau',
  'warmup.previewBar': '{weight} di barbel',
  'warmup.previewOther': '{weight} di mesin atau dengan dumbel',
  'warmup.reset': 'Kembali ke langkah biasa',
  'editor.warmups': 'Set pemanasan',
  'warmup.needWeight': 'Isi dulu beban kerja, lalu tambahkan pemanasan.',
  'warmup.tooLight': 'Beban itu terlalu ringan untuk langkah pemanasan.',
  'warmup.replaceTitle': 'Ganti pemanasan?',
  'warmup.replaceText': 'Latihan ini sudah punya set pemanasan. Set itu akan diganti dengan yang baru.',
  'warmup.replaceConfirm': 'Ganti',
  'warmup.added': 'Pemanasan ditambahkan untuk {weight}',
  'set.liveRecords': 'Rayakan rekor saat berlatih',
  'set.liveRecordsNote': 'Pesan dan piala saat set yang dicentang mengalahkan rekor terbaikmu.',
  'set.inlineStopwatch': 'Tombol stopwatch pada set berwaktu',
  'set.supersetScroll': 'Gulir ke latihan berikutnya dalam superset',
  'set.plateShortcut': 'Tombol pelat pada latihan barbel',
  'record.toast': 'Rekor baru! {exercise}: {record}',
  'record.setLabel': 'Set {label} memecahkan rekor',
} satisfies Record<string, Message>;
