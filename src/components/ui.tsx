import { useState, type ReactNode } from 'react';
import { IMAGE_BASE } from '../lib/meta';
import { goBack } from '../lib/router';
import type { Exercise } from '../types';
import { IconBack } from './Icons';

export function PageHeader({
  title,
  back,
  actions,
  large = false,
}: {
  title: ReactNode;
  /** Fallback route for the back button; omit to hide it. */
  back?: string;
  actions?: ReactNode;
  large?: boolean;
}) {
  return (
    <header className={`page-head ${large ? 'large' : ''}`}>
      {back !== undefined && (
        <button className="icon-btn" onClick={() => goBack(back)} aria-label="Back">
          <IconBack />
        </button>
      )}
      <h1 className="page-title">{title}</h1>
      <div className="page-actions">{actions}</div>
    </header>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
    </label>
  );
}

function initials(name: string) {
  return (
    name
      .split(/[\s(),-]+/)
      .filter((w) => /^[a-z0-9]/i.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '?'
  );
}

export function ExerciseAvatar({ exercise, size = 44 }: { exercise?: Exercise; size?: number }) {
  const [failed, setFailed] = useState(false);
  const img = exercise?.images[0];
  const style = { width: size, height: size };
  if (img && !failed) {
    return (
      <img className="ex-avatar" style={style} src={IMAGE_BASE + img} loading="lazy" alt="" onError={() => setFailed(true)} />
    );
  }
  return (
    <span className="ex-avatar mono" style={{ ...style, fontSize: size * 0.34 }} aria-hidden="true">
      {initials(exercise?.name ?? '')}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}
