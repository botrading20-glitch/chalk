import { t } from '../i18n';
import { useRoute } from '../lib/router';
import { WHATS_NEW, useWhatsNew } from '../lib/whatsNew';
import { Sheet } from './Sheet';

/** The entries for one release, as a list: a bold title and a line of text each. */
export function WhatsNewList({ version = __APP_VERSION__ }: { version?: string }) {
  const items = WHATS_NEW[version] ?? [];
  return (
    <ul className="whatsnew">
      {items.map(([title, text]) => (
        <li key={title}>
          <strong>{t(title)}</strong>
          <span>{t(text)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Shown once after an update that has news; never over the welcome screen or a running workout. */
export function WhatsNewSheet() {
  const { show, close } = useWhatsNew();
  const { segments } = useRoute();
  const quiet = segments[0] === 'welcome' || segments[0] === 'workout';
  return (
    <Sheet open={show && !quiet} onClose={close} title={t('new.title', { version: __APP_VERSION__ })}>
      <p className="muted">{t('new.lead')}</p>
      <WhatsNewList />
      <button className="btn btn-primary btn-block" onClick={close}>
        {t('common.done')}
      </button>
    </Sheet>
  );
}
