import common from './en/common';
import check from './en/check';
import components from './en/components';
import errors from './en/errors';
import home from './en/home';
import pages from './en/pages';
import settings from './en/settings';
import settingsPages from './en/settingsPages';
import launch from './en/launch';
import training from './en/training';
import welcome from './en/welcome';
import workout from './en/workout';
import labels from './en/labels';
import time from './en/time';

/** The source of truth for every message; other languages must cover the same keys (see catalog.ts). */
export const en = {
  ...common,
  ...time,
  ...labels,
  ...components,
  ...check,
  ...workout,
  ...home,
  ...errors,
  ...pages,
  ...settings,
  ...settingsPages,
  ...welcome,
  ...launch,
  ...training,
};
