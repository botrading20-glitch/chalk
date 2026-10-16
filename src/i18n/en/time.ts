import type { Message } from '../message';

// Durations, relative dates and the default names of a workout.
export default {
  'time.hours': '{n}h',
  'time.minutes': '{n}min',
  'time.seconds': '{n}s',
  'time.minutesSeconds': '{m}min {s}s',
  'date.today': 'Today',
  'date.yesterday': 'Yesterday',
  'date.daysAgo': { one: '{n} day ago', other: '{n} days ago' },
  'date.justNow': 'just now',
  'date.minutesAgo': '{n} min ago',
  'date.hoursAgo': '{n} h ago',
  'date.onAt': 'on {date} at {time}',
  'workout.default.night': 'Night workout',
  'workout.default.morning': 'Morning workout',
  'workout.default.afternoon': 'Afternoon workout',
  'workout.default.evening': 'Evening workout',
} satisfies Record<string, Message>;
