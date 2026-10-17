import { t } from '../i18n';
import type { Key } from '../i18n/catalog';
import { BrandMark } from './Brand';
import { IconCheck } from './Icons';

const FEATURES: Key[] = ['panel.feature1', 'panel.feature2', 'panel.feature3'];

/**
 * On a wide desktop window the app is a phone-width column; this fills the empty side with what it is and
 * where it works best. It only shows from 1240 px up (see `.wide-panel` in styles.css).
 */
export function WidePanel() {
  return (
    <aside className="wide-panel" aria-label={t('set.about')}>
      <BrandMark width={56} height={62} className="wide-mark" />
      <h2 className="wide-name">{t('app.name')}</h2>
      <p className="wide-tagline">{t('app.tagline')}</p>
      <ul className="wide-features">
        {FEATURES.map((k) => (
          <li key={k}>
            <IconCheck size={18} /> {t(k)}
          </li>
        ))}
      </ul>
      <p className="muted small">{t('panel.phone')}</p>
      <a className="wide-link" href={`${import.meta.env.BASE_URL}privacy.html`} target="_blank" rel="noreferrer">
        {t('about.privacyPage')}
      </a>
    </aside>
  );
}
