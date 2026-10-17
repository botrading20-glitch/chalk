import { useEffect, type ReactNode } from 'react';
import { BrandMark } from '../components/Brand';
import { IconBarbell, IconChevron, IconDatabase, IconList, IconUpload } from '../components/Icons';
import { InstallButton, useInstallOffer } from '../components/InstallPrompt';
import { Segmented } from '../components/ui';
import { getKV } from '../db';
import { installPlatform } from '../lib/install';
import { setPref } from '../lib/prefs';
import { navigate } from '../lib/router';
import { updateSettings, useSettings } from '../lib/settings';
import { phoneRegion, suggestUnits } from '../lib/welcome';
import { LOCALES, type LanguagePreference } from '../i18n/locales';
import { resolveLanguage, t } from '../i18n';
import type { Settings } from '../types';
import { SelectRow } from './settings/controls';

interface Option {
  to: string;
  icon: ReactNode;
  title: string;
  text: string;
  primary?: boolean;
}

/** Leaves the welcome for good (the next visit to Home goes straight in) and opens `to`. */
export async function finishWelcome(to: string) {
  await setPref('welcomeSeen', true);
  navigate(to, { replace: true });
}

/** First run: language and units, then four ways to begin. Everything on it is optional. */
export function WelcomePage() {
  const s = useSettings();
  const offerInstall = useInstallOffer();

  // A new install follows the phone's language and region. Only what was never chosen is set, so
  // opening this screen again later changes nothing.
  useEffect(() => {
    void (async () => {
      const stored = await getKV<Partial<Settings>>('settings');
      const patch: Partial<Settings> = {};
      if (stored?.language === undefined) patch.language = 'auto';
      if (stored?.weightUnit === undefined && stored?.distanceUnit === undefined) Object.assign(patch, suggestUnits(phoneRegion()));
      if (Object.keys(patch).length) await updateSettings(patch);
    })();
  }, []);

  const detected = LOCALES.find((l) => l.code === resolveLanguage('auto'))!.name;
  const languages: { value: LanguagePreference; label: string }[] = [
    { value: 'auto', label: t('set.sum.auto', { name: detected }) },
    ...LOCALES.map((l) => ({ value: l.code, label: l.name })),
  ];

  const options: Option[] = [
    { to: '/programs?from=welcome', icon: <IconList size={22} />, title: t('welcome.programTitle'), text: t('welcome.programText'), primary: true },
    { to: '/', icon: <IconBarbell size={22} />, title: t('welcome.scratchTitle'), text: t('welcome.scratchText') },
    { to: '/settings/data', icon: <IconUpload size={22} />, title: t('welcome.importTitle'), text: t('welcome.importText') },
    { to: '/settings/data', icon: <IconDatabase size={22} />, title: t('welcome.restoreTitle'), text: t('welcome.restoreText') },
  ];

  return (
    <div className="page welcome">
      <header className="welcome-hero">
        <BrandMark width={64} height={72} className="welcome-mark" />
        <h1 className="welcome-title">{t('welcome.title')}</h1>
        <p className="muted">{t('welcome.lead')}</p>
      </header>

      <section className="card settings-group" aria-label={t('welcome.basics')}>
        <SelectRow
          label={t('welcome.language')}
          value={s.language}
          options={languages}
          onChange={(language) => updateSettings({ language: language as LanguagePreference })}
        />
        <div className="setting">
          <span>{t('welcome.weight')}</span>
          <Segmented
            label={t('welcome.weight')}
            value={s.weightUnit}
            onChange={(weightUnit) => updateSettings({ weightUnit })}
            options={[
              { value: 'kg', label: t('common.kg') },
              { value: 'lbs', label: t('common.lbs') },
            ]}
          />
        </div>
        <div className="setting">
          <span>{t('welcome.distance')}</span>
          <Segmented
            label={t('welcome.distance')}
            value={s.distanceUnit}
            onChange={(distanceUnit) => updateSettings({ distanceUnit })}
            options={[
              { value: 'km', label: t('common.km') },
              { value: 'mi', label: t('common.mi') },
            ]}
          />
        </div>
      </section>

      <section className="srow-group" aria-label={t('welcome.start')}>
        <h2 className="srow-title">{t('welcome.start')}</h2>
        <ul className="start-list">
          {options.map((o) => (
            <li key={o.title}>
              <button className={`start-option ${o.primary ? 'primary' : ''}`} onClick={() => void finishWelcome(o.to)}>
                <span className="srow-icon">{o.icon}</span>
                <span className="srow-text">
                  <span className="srow-label">{o.title}</span>
                  <span className="start-text">{o.text}</span>
                </span>
                <IconChevron className="srow-chevron flip-rtl" size={18} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {offerInstall && (
        <section className="card install-card welcome-install" aria-label={t('welcome.installTitle')}>
          <div className="install-text">
            <strong>{t('welcome.installTitle')}</strong>
            <span>{t('welcome.installText')}</span>
            {installPlatform === 'ios' && <span className="install-note">{t('welcome.iosWarn')}</span>}
          </div>
          <InstallButton className="btn btn-accent-outline btn-small" />
        </section>
      )}

      <button className="btn btn-ghost welcome-skip" onClick={() => void finishWelcome('/')}>
        {t('welcome.skip')}
      </button>
    </div>
  );
}
