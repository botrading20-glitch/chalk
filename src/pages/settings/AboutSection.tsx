import { BrandMark } from '../../components/Brand';
import { toast } from '../../components/dialogs';
import { IconExternal, IconShare } from '../../components/Icons';
import { WhatsNewList } from '../../components/WhatsNew';
import { t } from '../../i18n';
import type { Key } from '../../i18n/catalog';
import { WHATS_NEW } from '../../lib/whatsNew';
import { Card, Note } from './controls';

const REPO = 'https://github.com/botrading20-glitch/chalk';
const FAQ: [Key, Key][] = [
  ['about.q1', 'about.a1'],
  ['about.q2', 'about.a2'],
  ['about.q3', 'about.a3'],
  ['about.q4', 'about.a4'],
  ['about.q5', 'about.a5'],
];

async function share() {
  const url = location.origin + import.meta.env.BASE_URL;
  try {
    if (navigator.share) {
      await navigator.share({ title: t('app.name'), text: t('about.shareText'), url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast(t('about.shared'));
  } catch (e) {
    if ((e as DOMException).name !== 'AbortError') toast(url);
  }
}

export function AboutSection() {
  return (
    <>
      <section className="about-hero">
        <BrandMark width={56} height={62} className="about-mark" />
        <h2 className="about-name">{t('app.name')}</h2>
        <p className="muted">{t('app.tagline')}</p>
        <p className="muted small">{t('set.sum.version', { version: __APP_VERSION__ })}</p>
      </section>

      <Note>{t('about.free')}</Note>

      {WHATS_NEW[__APP_VERSION__] && (
        <details className="card about-item">
          <summary>{t('about.whatsNew')}</summary>
          <WhatsNewList />
        </details>
      )}

      <details className="card about-item">
        <summary>{t('about.privacy')}</summary>
        <p>{t('about.privacyText')}</p>
        <a className="btn btn-ghost btn-block" href={`${import.meta.env.BASE_URL}privacy.html`} target="_blank" rel="noreferrer">
          <IconExternal size={18} /> {t('about.privacyPage')}
        </a>
      </details>

      <details className="card about-item">
        <summary>{t('about.help')}</summary>
        <dl className="faq">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt>{t(q)}</dt>
              <dd>{t(a)}</dd>
            </div>
          ))}
        </dl>
      </details>

      <details className="card about-item">
        <summary>{t('about.credits')}</summary>
        <ul className="plain-list">
          {(['about.creditsApp', 'about.creditsExercises', 'about.creditsFonts', 'about.creditsCode'] as Key[]).map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </details>

      <Card>
        <a className="btn btn-ghost btn-block" href={REPO} target="_blank" rel="noreferrer">
          <IconExternal size={18} /> {t('about.source')}
        </a>
        <a className="btn btn-ghost btn-block" href={`${REPO}/issues/new`} target="_blank" rel="noreferrer">
          <IconExternal size={18} /> {t('about.feedback')}
        </a>
        <button className="btn btn-secondary btn-block" onClick={() => void share()}>
          <IconShare size={18} /> {t('about.share')}
        </button>
      </Card>
    </>
  );
}
