import type { Message } from '../message';

// The 1.0 launch: the What's new list, the wide-screen side panel and the About links.
export default {
  'new.title': 'What’s new in {version}',
  'new.lead': 'Everything you logged is untouched. Here is what changed.',
  'new.look.title': 'A new look',
  'new.look.text': 'Layered cards, big numbers and a slanted accent taken from the logo, in dark, light and pure black.',
  'new.languages.title': 'Eleven languages',
  'new.languages.text': 'English, French, Arabic, Spanish, German, Portuguese, Italian, Turkish, Dutch, Polish and Indonesian. Arabic reads right to left. The translations are machine-made, so tell us where the wording is off.',
  'new.settings.title': 'More settings',
  'new.settings.text': 'Rest sounds, warm-up rest, week start, 1RM formula, text size, high contrast and larger controls, each on its own page.',
  'new.start.title': 'A better first run',
  'new.start.text': 'A welcome screen, six starter programs and import from Strong.',
  'new.past.title': 'Log a past workout',
  'new.past.text': 'Add a session you forgot, on its own date, from History.',
  'new.records.title': 'Recent records',
  'new.records.text': 'Progress now lists your latest records at a glance.',
  'about.whatsNew': 'What’s new',
  'about.privacyPage': 'Privacy page',

  'panel.feature1': 'Log sets, routines and records',
  'panel.feature2': 'Free, offline, no account',
  'panel.feature3': '1,000+ exercises in eleven languages',
  'panel.phone': 'Best on your phone: open this page there and add it to your home screen.',
} satisfies Record<string, Message>;
