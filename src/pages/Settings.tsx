import { SettingsHome } from './settings/Home';
import { SettingsSection } from './settings/Section';

/** `#/settings` is the grouped list; `#/settings/<section>` opens one of its pages. */
export function SettingsPage({ section }: { section?: string }) {
  return section ? <SettingsSection id={section} /> : <SettingsHome />;
}
