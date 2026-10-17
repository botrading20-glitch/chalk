import type { Message } from '../message';

export default {

  // Effort scale
  'editor.rpeGuide': '10 oznacza brak rezerwy, 9 – może jeszcze jedno powtórzenie, 8 – może dwa. To twoje własne odczucie, nie pomiar.',

  // Warm-ups, workout toggles and live records
  'set.warmup': 'Serie rozgrzewkowe',
  'warmup.intro': 'Tworzy serie rozgrzewkowe do ćwiczenia na podstawie ciężaru roboczego. Każdy krok to część tego ciężaru. Ćwiczenia ze sztangą używają Twoich talerzy, więc każdy ciężar da się naprawdę założyć na gryf.',
  'warmup.stepN': 'Rozgrzewka {n}',
  'warmup.percentLabel': 'Część ciężaru roboczego dla rozgrzewki {n}',
  'warmup.repsLabel': 'Powtórzenia w rozgrzewce {n}',
  'warmup.addStep': 'Dodaj krok',
  'warmup.removeStep': 'Usuń rozgrzewkę {n}',
  'warmup.emptyBar': 'Zacznij od pustego gryfu',
  'warmup.emptyBarNote': 'Dziesięć powtórzeń z samym gryfem, w ćwiczeniach ze sztangą, sztangą łamaną i suwnicą Smitha.',
  'warmup.round': 'Zaokrąglaj inne ciężary do',
  'warmup.roundNote': 'Dla hantli, maszyn i wyciągów. Ćwiczenia z talerzami używają zamiast tego Twoich talerzy.',
  'warmup.previewTitle': 'Podgląd',
  'warmup.previewBar': '{weight} na sztandze',
  'warmup.previewOther': '{weight} na maszynie lub z hantlami',
  'warmup.reset': 'Wróć do zwykłych kroków',
  'editor.warmups': 'Serie rozgrzewkowe',
  'warmup.needWeight': 'Najpierw wpisz ciężar roboczy, potem dodaj rozgrzewkę.',
  'warmup.tooLight': 'Ten ciężar jest za lekki na kroki rozgrzewki.',
  'warmup.replaceTitle': 'Zastąpić rozgrzewkę?',
  'warmup.replaceText': 'To ćwiczenie ma już serie rozgrzewkowe. Zostaną zastąpione nowymi.',
  'warmup.replaceConfirm': 'Zastąp',
  'warmup.added': 'Dodano rozgrzewkę dla {weight}',
  'set.liveRecords': 'Świętuj rekordy w trakcie treningu',
  'set.liveRecordsNote': 'Komunikat i puchar, gdy zaznaczona seria pobije Twój najlepszy wynik.',
  'set.inlineStopwatch': 'Przycisk stopera przy seriach na czas',
  'set.supersetScroll': 'Przewiń do następnego ćwiczenia w superserii',
  'set.plateShortcut': 'Przycisk talerzy przy ćwiczeniach ze sztangą',
  'record.toast': 'Nowy rekord! {exercise}: {record}',
  'record.setLabel': 'Seria {label} pobiła rekord',

  // Muscle map
  'muscles.title': 'Mięśnie',
  'muscles.label': 'Pracujące mięśnie: {list}',
  'muscles.none': 'Nie zliczono jeszcze żadnej serii.',
  'muscles.front': 'Przód',
  'muscles.back': 'Tył',
  'muscles.colMuscle': 'Mięsień',
  'muscles.colSets': 'Serie',
  'muscles.how': 'Seria liczy się raz dla mięśnia głównego i pół raza dla każdego mięśnia pomocniczego. Rozgrzewka się nie liczy.',
  'muscles.worked': 'Pracujące mięśnie',
  'muscles.open': 'Pokaż dotychczas pracujące mięśnie',
} satisfies Record<string, Message>;
