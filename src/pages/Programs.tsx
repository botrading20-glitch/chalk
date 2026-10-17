import { useState } from 'react';
import { confirmDialog, toast } from '../components/dialogs';
import { Sheet } from '../components/Sheet';
import { PageHeader } from '../components/ui';
import { PROGRAMS, type Program } from '../data/programs';
import { useData } from '../lib/data';
import { setPref } from '../lib/prefs';
import { addProgram, hasProgramFolder } from '../lib/programs';
import { navigate, useRoute } from '../lib/router';
import { count, t } from '../i18n';

const exerciseCount = (p: Program) => p.days.reduce((n, d) => n + d.exercises.length, 0);

/** `#/programs`: the starter programs, each previewed before its routines are added. */
export function ProgramsPage() {
  const { query } = useRoute();
  const fromWelcome = query.get('from') === 'welcome';
  const { exerciseMap } = useData();
  const [open, setOpen] = useState<Program | null>(null);
  const [adding, setAdding] = useState(false);

  async function add(program: Program) {
    const title = t(program.title);
    if (await hasProgramFolder(program)) {
      const again = await confirmDialog({ title: t('prog.existsTitle', { title }), message: t('prog.existsText'), confirmLabel: t('prog.existsConfirm') });
      if (!again) return;
    }
    setAdding(true);
    try {
      const n = await addProgram(program);
      setOpen(null);
      toast(t('prog.added', { title, n }));
      if (fromWelcome) await setPref('welcomeSeen', true);
      navigate('/', { replace: true });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="page">
      <PageHeader back={fromWelcome ? '/welcome' : '/'} title={t('prog.title')} />
      <p className="muted">{t('prog.lead')}</p>

      <ul className="program-list">
        {PROGRAMS.map((p) => (
          <li key={p.id}>
            <button className="card program-card" onClick={() => setOpen(p)}>
              <h2 className="program-title">{t(p.title)}</h2>
              <p className="muted">{t(p.summary)}</p>
              <div className="program-meta">
                <span className="slant-chip">{t('prog.perWeek', { sessions: count('session', p.days.length) })}</span>
                <span className="muted small">{count('exercise', exerciseCount(p))}</span>
              </div>
              <div className="chips wrap">
                {p.days.map((d) => (
                  <span key={d.title} className="chip">
                    {t(d.title)}
                  </span>
                ))}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? t(open.title) : ''}>
        {open && (
          <div className="program-preview">
            <p className="muted">{t(open.summary)}</p>
            {open.days.map((day) => (
              <section key={day.title} className="program-day">
                <h3 className="list-label">{t(day.title)}</h3>
                <ul className="plain-list">
                  {day.exercises.map(([id, sets, reps]) => (
                    <li key={id} className="program-row">
                      <span>{exerciseMap.get(id)?.name ?? id}</span>
                      <span className="muted tabular">{reps ? t('prog.sets', { n: sets, reps }) : t('prog.setsOnly', { n: sets })}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <button className="btn btn-primary btn-block" disabled={adding} onClick={() => void add(open)}>
              {t('prog.add')}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
