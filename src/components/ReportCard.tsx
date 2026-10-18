import { useMemo } from 'react';
import { useData, useNow } from '../lib/data';
import { fmtDuration, fmtMonth } from '../lib/format';
import { usePref, setPref } from '../lib/prefs';
import { addMonths, monthKey, monthStart, monthSummary } from '../lib/report';
import { Link } from '../lib/router';
import { useSettings } from '../lib/settings';
import { count, t } from '../i18n';

/** In the first week of a month, Home offers last month's report once; either button settles it. */
export function ReportCard() {
  const { workouts } = useData();
  const { monthlyReport } = useSettings();
  const seen = usePref('reportSeenMonth');
  const now = useNow(60_000);

  const lastMonth = addMonths(monthStart(now), -1);
  const key = monthKey(lastMonth);
  const due = monthlyReport && seen !== undefined && seen !== key && new Date(now).getDate() <= 7;
  const summary = useMemo(() => (due ? monthSummary(workouts, lastMonth) : undefined), [due, workouts, lastMonth]);
  if (!due || !summary || summary.workouts === 0) return null;

  const settle = () => void setPref('reportSeenMonth', key);

  return (
    <section className="card resume-card" aria-label={t('report.title')}>
      <div>
        <h2 className="resume-title">{t('reportCard.title', { month: fmtMonth(lastMonth) })}</h2>
        <span className="muted">{t('reportCard.sub', { workouts: count('workout', summary.workouts), time: fmtDuration(summary.seconds) })}</span>
      </div>
      <div className="resume-actions">
        <button className="btn btn-ghost btn-small" onClick={settle}>
          {t('reportCard.dismiss')}
        </button>
        <Link to={`/profile/report/${key}`} className="btn btn-primary btn-small" onClick={settle}>
          {t('reportCard.open')}
        </Link>
      </div>
    </section>
  );
}
