import type { ReactNode } from 'react';

// Small building blocks the Settings pages share.

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="card settings-group">
      {title && <h2 className="card-title">{title}</h2>}
      {children}
    </section>
  );
}

/** A label with a dropdown, for long lists of values. */
export function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="setting">
      <span>{label}</span>
      <select className="chip-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A label above a wider control (three or more segments, chips, a text box). */
export function StackRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span>{label}</span>
      {children}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="muted small">{children}</p>;
}
