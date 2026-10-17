import { BufferedText } from '../../components/fields';
import { IconCheck, IconPlay } from '../../components/Icons';
import { SyncSettings } from '../../components/SyncSettings';
import { RadioGroup, Segmented, Toggle } from '../../components/ui';
import { fmtNum, fmtRest } from '../../lib/format';
import { DEFAULT_PLATES } from '../../lib/plates';
import { updateSettings, useSettings } from '../../lib/settings';
import { toast } from '../../components/dialogs';
import { beep, unlockAudio } from '../../lib/timer';
import { LOCALES, type LanguagePreference } from '../../i18n/locales';
import { resolveLanguage, t } from '../../i18n';
import type { Key } from '../../i18n/catalog';
import type { AccentName, RestSound, SoundVolume, WeightUnit } from '../../types';
import { Card, Note, SelectRow, StackRow } from './controls';

const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const WARMUP_REST = [-1, 0, 30, 45, 60, 90, 120];
const NEW_SETS = [0, 1, 2, 3, 4, 5];
const GOALS = [0, 1, 2, 3, 4, 5, 6, 7];
const SOUND_NAMES: RestSound[] = ['classic', 'chime', 'bell', 'pulse'];
const ACCENTS: AccentName[] = ['purple', 'indigo', 'teal', 'pink'];

const UNITS: WeightUnit[] = ['kg', 'lbs'];
const num = (v: string) => Number(v);

export function WorkoutSection() {
  const s = useSettings();
  return (
    <>
      <Card>
        <SelectRow
          label={t('set.restDefault')}
          value={String(s.defaultRest)}
          options={REST_OPTIONS.map((r) => ({ value: String(r), label: fmtRest(r) }))}
          onChange={(v) => updateSettings({ defaultRest: num(v) })}
        />
        <SelectRow
          label={t('set.restWarmup')}
          value={String(s.warmupRest)}
          options={WARMUP_REST.map((r) => ({ value: String(r), label: r === -1 ? t('set.restSame') : fmtRest(r) }))}
          onChange={(v) => updateSettings({ warmupRest: num(v) })}
        />
        <Toggle label={t('set.autoRest')} checked={s.autoRest} onChange={(autoRest) => updateSettings({ autoRest })} />
      </Card>

      <Card>
        <StackRow label={t('set.previous')}>
          <Segmented
            label={t('set.previous')}
            value={s.previousFrom}
            onChange={(previousFrom) => updateSettings({ previousFrom })}
            options={[
              { value: 'any', label: t('set.previous.any') },
              { value: 'routine', label: t('set.previous.routine') },
            ]}
          />
        </StackRow>
        <Note>{t('set.previousNote')}</Note>
        <SelectRow
          label={t('set.newSets')}
          value={String(s.newExerciseSets)}
          options={NEW_SETS.map((n) => ({ value: String(n), label: n === 0 ? t('set.newSetsAuto') : String(n) }))}
          onChange={(v) => updateSettings({ newExerciseSets: num(v) })}
        />
        <Note>{t('set.newSetsNote')}</Note>
        <Toggle label={t('set.rpe')} checked={s.showRpe} onChange={(showRpe) => updateSettings({ showRpe })} />
        <Toggle label={t('set.keepAwake')} checked={s.keepAwake} onChange={(keepAwake) => updateSettings({ keepAwake })} />
      </Card>
    </>
  );
}

export function TimerSection() {
  const s = useSettings();

  function preview(sound: RestSound = s.restSound, volume: SoundVolume = s.soundVolume) {
    unlockAudio();
    // The first tap only wakes the audio; the sound plays a moment later.
    setTimeout(() => {
      if (!beep(sound, volume)) toast(t('set.soundPreviewFailed'));
    }, 60);
  }

  return (
    <Card>
      <Toggle label={t('set.soundEnd')} checked={s.timerSound} onChange={(timerSound) => updateSettings({ timerSound })} />
      {s.timerSound && (
        <>
          <StackRow label={t('set.sound')}>
            <div className="sound-row">
              <RadioGroup
                className="choice-chips"
                label={t('set.sound')}
                options={SOUND_NAMES}
                value={s.restSound}
                onChange={(restSound) => {
                  void updateSettings({ restSound });
                  preview(restSound);
                }}
                render={(name) => t(`set.sound.${name}` as Key)}
              />
              <button className="btn btn-ghost btn-small" onClick={() => preview()}>
                <IconPlay size={14} /> {t('set.soundPreview')}
              </button>
            </div>
          </StackRow>
          <StackRow label={t('set.volume')}>
            <Segmented
              label={t('set.volume')}
              value={s.soundVolume}
              onChange={(soundVolume) => {
                void updateSettings({ soundVolume });
                preview(s.restSound, soundVolume);
              }}
              options={[
                { value: 'low', label: t('set.volume.low') },
                { value: 'medium', label: t('set.volume.medium') },
                { value: 'high', label: t('set.volume.high') },
              ]}
            />
          </StackRow>
          <div>
            <Toggle label={t('set.lockAlert')} checked={s.timerLockScreen} onChange={(timerLockScreen) => updateSettings({ timerLockScreen })} />
            <Note>{t('set.lockAlertNote')}</Note>
          </div>
          <Toggle label={t('set.countdown')} checked={s.restCountdown} onChange={(restCountdown) => updateSettings({ restCountdown })} />
        </>
      )}
      <Toggle label={t('set.vibrateEnd')} checked={s.timerVibrate} onChange={(timerVibrate) => updateSettings({ timerVibrate })} />
      <Toggle label={t('set.vibrateCheck')} checked={s.vibrateOnCheck} onChange={(vibrateOnCheck) => updateSettings({ vibrateOnCheck })} />
    </Card>
  );
}

export function UnitsSection() {
  const s = useSettings();
  return (
    <>
      <Card>
        <div className="setting">
          <span>{t('set.weight')}</span>
          <Segmented
            label={t('set.weight')}
            value={s.weightUnit}
            onChange={(weightUnit) => updateSettings({ weightUnit })}
            options={[
              { value: 'kg', label: t('common.kg') },
              { value: 'lbs', label: t('common.lbs') },
            ]}
          />
        </div>
        <div className="setting">
          <span>{t('set.distance')}</span>
          <Segmented
            label={t('set.distance')}
            value={s.distanceUnit}
            onChange={(distanceUnit) => updateSettings({ distanceUnit })}
            options={[
              { value: 'km', label: t('common.km') },
              { value: 'mi', label: t('common.mi') },
            ]}
          />
        </div>
      </Card>
      <Card>
        <StackRow label={t('set.timeFormat')}>
          <Segmented
            label={t('set.timeFormat')}
            value={s.timeFormat}
            onChange={(timeFormat) => updateSettings({ timeFormat })}
            options={[
              { value: 'auto', label: t('set.time.auto') },
              { value: '24h', label: t('set.time.24h') },
              { value: '12h', label: t('set.time.12h') },
            ]}
          />
        </StackRow>
        <SelectRow
          label={t('set.weekStart')}
          value={s.weekStart}
          options={(['auto', 'mon', 'sun', 'sat'] as const).map((w) => ({ value: w, label: t(`set.week.${w}` as Key) }))}
          onChange={(v) => updateSettings({ weekStart: v as typeof s.weekStart })}
        />
        <Note>{t('set.weekNote')}</Note>
        <div className="setting">
          <span>{t('set.oneRm')}</span>
          <Segmented
            label={t('set.oneRm')}
            value={s.oneRmFormula}
            onChange={(oneRmFormula) => updateSettings({ oneRmFormula })}
            options={[
              { value: 'epley', label: 'Epley' },
              { value: 'brzycki', label: 'Brzycki' },
            ]}
          />
        </div>
        <Note>{t('set.oneRmNote')}</Note>
      </Card>
    </>
  );
}

export function GoalsSection() {
  const s = useSettings();
  return (
    <Card>
      <label className="field">
        <span>{t('set.name')}</span>
        <BufferedText value={s.profileName} onChange={(profileName) => updateSettings({ profileName })} placeholder={t('set.namePlaceholder')} maxLength={40} autoComplete="given-name" />
      </label>
      <SelectRow
        label={t('set.goal')}
        value={String(s.weeklyGoal)}
        options={GOALS.map((n) => ({ value: String(n), label: n === 0 ? t('set.goalOff') : t('set.goalN', { n }) }))}
        onChange={(v) => updateSettings({ weeklyGoal: num(v) })}
      />
      <Note>{t('set.goalNote')}</Note>
    </Card>
  );
}

export function AppearanceSection() {
  const s = useSettings();
  return (
    <>
      <Card>
        <StackRow label={t('set.theme')}>
          <Segmented
            label={t('set.theme')}
            value={s.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'dark', label: t('set.theme.dark') },
              { value: 'light', label: t('set.theme.light') },
              { value: 'system', label: t('set.theme.system') },
            ]}
          />
        </StackRow>
        <div>
          <Toggle label={t('set.black')} checked={s.blackTheme} onChange={(blackTheme) => updateSettings({ blackTheme })} />
          <Note>{t('set.blackNote')}</Note>
        </div>
      </Card>
      <Card>
        <StackRow label={t('set.accent')}>
          <RadioGroup
            className="swatches"
            label={t('set.accent')}
            options={ACCENTS}
            value={s.accent}
            onChange={(accent) => updateSettings({ accent })}
            render={(accent, selected) => (
              <>
                <span className={`swatch swatch-${accent}`}>{selected && <IconCheck size={20} />}</span>
                <span className="swatch-name">{t(`set.accent.${accent}` as Key)}</span>
              </>
            )}
          />
        </StackRow>
        <Toggle label={t('set.compact')} checked={s.compactRoutines} onChange={(compactRoutines) => updateSettings({ compactRoutines })} />
      </Card>
    </>
  );
}

export function AccessSection() {
  const s = useSettings();
  return (
    <>
      <Card>
        <StackRow label={t('set.textSize')}>
          <Segmented
            label={t('set.textSize')}
            value={s.textSize}
            onChange={(textSize) => updateSettings({ textSize })}
            options={(['small', 'default', 'large', 'xlarge'] as const).map((z) => ({ value: z, label: t(`set.size.${z}` as Key) }))}
          />
        </StackRow>
        <div>
          <Toggle label={t('set.contrast')} checked={s.highContrast} onChange={(highContrast) => updateSettings({ highContrast })} />
          <Note>{t('set.contrastNote')}</Note>
        </div>
      </Card>
      <Card>
        <StackRow label={t('set.motion')}>
          <Segmented
            label={t('set.motion')}
            value={s.reduceMotion}
            onChange={(reduceMotion) => updateSettings({ reduceMotion })}
            options={[
              { value: 'system', label: t('set.motion.system') },
              { value: 'always', label: t('set.motion.always') },
            ]}
          />
        </StackRow>
        <div>
          <Toggle label={t('set.largeControls')} checked={s.largeControls} onChange={(largeControls) => updateSettings({ largeControls })} />
          <Note>{t('set.largeNote')}</Note>
        </div>
      </Card>
    </>
  );
}

export function LanguageSection() {
  const s = useSettings();
  const options: LanguagePreference[] = ['auto', ...LOCALES.map((l) => l.code)];
  const name = (code: LanguagePreference) => (code === 'auto' ? t('set.langAuto') : LOCALES.find((l) => l.code === code)!.name);
  const auto = LOCALES.find((l) => l.code === resolveLanguage('auto'))!.name;
  return (
    <>
      <RadioGroup
        className="srow-card lang-list"
        label={t('set.language')}
        options={options}
        value={s.language}
        onChange={(language) => updateSettings({ language })}
        render={(code, selected) => (
          <>
            <span lang={code === 'auto' ? undefined : code}>{name(code)}</span>
            {code === 'auto' && <span className="lang-hint">{auto}</span>}
            {selected && <IconCheck size={20} className="lang-check" />}
          </>
        )}
      />
      <Note>{t('set.langAutoNote', { name: auto })}</Note>
      <Note>{t('set.langMachine')}</Note>
      <a className="btn btn-ghost btn-block" href="https://github.com/botrading20-glitch/chalk/issues/new" target="_blank" rel="noreferrer">
        {t('set.langReport')}
      </a>
    </>
  );
}

export function PlatesSection() {
  const s = useSettings();

  function toggle(u: WeightUnit, plate: number) {
    const owned = u === 'kg' ? s.platesKg : s.platesLbs;
    const next = owned.includes(plate) ? owned.filter((p) => p !== plate) : [...owned, plate].sort((a, b) => b - a);
    if (!next.length) return;
    void updateSettings(u === 'kg' ? { platesKg: next } : { platesLbs: next });
  }

  return (
    <>
      <Note>{t('set.platesIntro')}</Note>
      {UNITS.map((u) => {
        const owned = u === 'kg' ? s.platesKg : s.platesLbs;
        return (
          <Card key={u} title={t(u === 'kg' ? 'set.platesKg' : 'set.platesLbs')}>
            <div className="chips wrap">
              {DEFAULT_PLATES[u].map((p) => {
                const on = owned.includes(p);
                return (
                  <button key={p} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(u, p)}>
                    {fmtNum(p, 2)} {t(`common.${u}` as Key)}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}
      <Note>{t('set.platesBar')}</Note>
    </>
  );
}

export function SyncSection() {
  return <SyncSettings />;
}
