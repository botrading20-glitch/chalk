import type { CSSProperties, ReactNode } from 'react';
import { IconCheck, IconChevron, IconMore, IconPlay, IconPlus, IconSearch, IconTimer, IconTrophy } from '../../components/Icons';
import { fmtRest, isolate } from '../../lib/format';
import { Link } from '../../lib/router';
import { useSettings } from '../../lib/settings';
import { beginWorkout } from '../WorkoutHome';
import { count, t } from '../../i18n';
import type { Key } from '../../i18n/catalog';
import { Note } from './controls';

// The guides draw their pictures from the app's own pieces (set table, buttons, rest chip), so
// they follow every theme and language and need no screenshots. The pictures are decoration:
// the step text says everything, and the picture is hidden from screen readers and from focus.

const FAQ: [Key, Key][] = [
  ['about.q1', 'about.a1'],
  ['about.q2', 'about.a2'],
  ['about.q3', 'about.a3'],
  ['about.q4', 'about.a4'],
  ['about.q5', 'about.a5'],
];

interface Step {
  id: string;
  title: Key;
  text: Key;
  art?: ReactNode;
}

function Guide({ intro, steps, action }: { intro: Key; steps: Step[]; action: ReactNode }) {
  return (
    <>
      <Note>{t(intro)}</Note>
      <ol className="guide">
        {steps.map((s, i) => (
          <li key={s.id} className="guide-step">
            <span className="guide-num" aria-hidden="true">
              {i + 1}
            </span>
            <div className="guide-body">
              <h2 className="guide-title">{t(s.title)}</h2>
              <p>{t(s.text)}</p>
            </div>
            {s.art && (
              <div className="guide-art" aria-hidden="true" inert>
                {s.art}
              </div>
            )}
          </li>
        ))}
      </ol>
      {action}
    </>
  );
}

interface MockRow {
  n: string;
  prev: string;
  weight: string;
  reps: string;
  /** The values are last time's, shown grey as a hint rather than entered. */
  hint?: boolean;
  done?: boolean;
}

/** Two rows of the set table: the numbered disc, Previous, the two fields and (live) the check. */
function SetMock({ rows, check }: { rows: MockRow[]; check?: boolean }) {
  const { weightUnit } = useSettings();
  const cols = `var(--badge-w) minmax(0,1fr) var(--field-w) var(--field-w)${check ? ' var(--check-w)' : ''}`;
  return (
    <div className="set-table" style={{ '--cols': cols } as CSSProperties}>
      <div className="set-row set-head">
        <span>{t('editor.set')}</span>
        <span className="prev-col">{t('editor.previous')}</span>
        <span>{isolate(weightUnit)}</span>
        <span>{t('head.reps')}</span>
        {check && (
          <span>
            <IconCheck size={16} />
          </span>
        )}
      </div>
      {rows.map((r) => (
        <div key={r.n} className={`set-row ${r.done ? 'done' : ''}`}>
          <span className="set-badge">{r.n}</span>
          <span className="prev prev-col">{isolate(r.prev)}</span>
          <span className={`set-input guide-val ${r.hint ? 'hint' : ''}`}>{r.weight}</span>
          <span className={`set-input guide-val ${r.hint ? 'hint' : ''}`}>{r.reps}</span>
          {check && (
            <span className={`check ${r.done ? 'on' : ''}`}>
              <IconCheck size={18} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

const SET_TYPES: [string, string][] = [
  ['normal', '1'],
  ['warmup', 'W'],
  ['dropset', 'D'],
  ['failure', 'F'],
];

const LAST_TIME = '57.5 × 8';

export function GuideSection() {
  const steps: Step[] = [
    {
      id: 'g1',
      title: 'help.g1.title',
      text: 'help.g1.text',
      art: (
        <div className="btn btn-glow btn-block btn-hero">
          <IconPlus /> {t('live.startEmpty')}
        </div>
      ),
    },
    {
      id: 'g2',
      title: 'help.g2.title',
      text: 'help.g2.text',
      art: (
        <div className="guide-stack">
          <div className="guide-search">
            <IconSearch size={16} /> {t('exercises.searchPlaceholder')}
          </div>
          <div className="add-set">
            <IconPlus size={16} /> {t('editor.addExercise')}
          </div>
        </div>
      ),
    },
    {
      id: 'g3',
      title: 'help.g3.title',
      text: 'help.g3.text',
      art: (
        <SetMock
          check
          rows={[
            { n: '1', prev: LAST_TIME, weight: '60', reps: '8', done: true },
            { n: '2', prev: LAST_TIME, weight: '57.5', reps: '8', hint: true },
          ]}
        />
      ),
    },
    {
      id: 'g4',
      title: 'help.g4.title',
      text: 'help.g4.text',
      art: (
        <div className="guide-types">
          {SET_TYPES.map(([type, label]) => (
            <span key={type} className="guide-type">
              <span className="set-badge" data-type={type}>
                {label}
              </span>
              <span>{t(`setType.${type}` as Key)}</span>
            </span>
          ))}
        </div>
      ),
    },
    {
      id: 'g5',
      title: 'help.g5.title',
      text: 'help.g5.text',
      art: (
        <div className="guide-finish">
          <span className="pr-pill">
            <IconTrophy size={13} /> {count('newRecord', 1)}
          </span>
          <span className="btn btn-glow btn-small">{t('live.finish')}</span>
        </div>
      ),
    },
  ];

  return (
    <Guide
      intro="help.guideIntro"
      steps={steps}
      action={
        <button className="btn btn-glow btn-block" onClick={() => void beginWorkout()}>
          {t('help.g1.title')}
        </button>
      }
    />
  );
}

export function RoutinesGuideSection() {
  const steps: Step[] = [
    {
      id: 'r1',
      title: 'help.r1.title',
      text: 'help.r1.text',
      art: (
        <div className="card routine-card guide-card">
          <span className="routine-title">{t('prog.ppl.1')}</span>
          <p className="routine-exercises">Bench Press (Barbell), Incline Dumbbell Press, Cable Fly, Triceps Pushdown</p>
          <p className="routine-meta">{t('home.meta', { exercises: count('exercise', 4), sets: count('set', 12) })}</p>
        </div>
      ),
    },
    {
      id: 'r2',
      title: 'help.r2.title',
      text: 'help.r2.text',
      art: (
        <SetMock
          rows={[
            { n: '1', prev: LAST_TIME, weight: '60', reps: '8' },
            { n: '2', prev: LAST_TIME, weight: '57.5', reps: '8', hint: true },
          ]}
        />
      ),
    },
    {
      id: 'r3',
      title: 'help.r3.title',
      text: 'help.r3.text',
      art: (
        <div className="guide-finish">
          <span className="rest-chip">
            <IconTimer size={16} /> {t('editor.rest', { time: fmtRest(90) })}
          </span>
          <span className="icon-btn">
            <IconMore />
          </span>
        </div>
      ),
    },
    {
      id: 'r4',
      title: 'help.r4.title',
      text: 'help.r4.text',
      art: (
        <div className="guide-folder">
          <IconChevron size={18} className="folder-chevron open" />
          <span className="folder-name">{t('prog.ppl.title')}</span>
          <span className="folder-count">3</span>
        </div>
      ),
    },
    {
      id: 'r5',
      title: 'help.r5.title',
      text: 'help.r5.text',
      art: (
        <div className="btn btn-secondary btn-block">
          <IconPlay size={16} /> {t('home.startRoutine')}
        </div>
      ),
    },
  ];

  return (
    <Guide
      intro="help.routinesIntro"
      steps={steps}
      action={
        <Link to="/routines/new" className="btn btn-primary btn-block">
          {t('help.r1.title')}
        </Link>
      }
    />
  );
}

export function QuestionsSection() {
  return (
    <section className="card">
      <dl className="faq">
        {FAQ.map(([q, a]) => (
          <div key={q}>
            <dt>{t(q)}</dt>
            <dd>{t(a)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
