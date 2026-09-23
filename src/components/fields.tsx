import { useEffect, useRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { fmtClock, inputNum, parseClock, parseNum } from '../lib/format';

type Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

/**
 * Text bound to IndexedDB arrives back asynchronously; holding a local copy
 * while the field is focused stops the caret jumping and keystrokes vanishing.
 */
function useBuffered(value: string, onChange: (v: string) => void) {
  const [text, setText] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(value);
  }, [value]);
  return {
    value: text,
    onFocus: () => {
      focused.current = true;
    },
    onBlur: () => {
      focused.current = false;
    },
    onChange: (e: { target: { value: string } }) => {
      setText(e.target.value);
      onChange(e.target.value);
    },
  };
}

export function BufferedText({
  value,
  onChange,
  ...rest
}: Omit<Base, 'onFocus' | 'onBlur'> & { value: string; onChange: (v: string) => void }) {
  return <input {...rest} type="text" {...useBuffered(value, onChange)} />;
}

export function BufferedTextarea({
  value,
  onChange,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'onFocus' | 'onBlur'> & {
  value: string;
  onChange: (v: string) => void;
}) {
  return <textarea {...rest} {...useBuffered(value, onChange)} />;
}

/**
 * Keeps its own text while focused so half-typed values like "12." or "12,"
 * survive re-renders; accepts both decimal separators.
 */
export function NumberField({
  value,
  onChange,
  decimals = 2,
  integer = false,
  ...rest
}: Base & { value: number | undefined; onChange: (v: number | undefined) => void; decimals?: number; integer?: boolean }) {
  const [text, setText] = useState(inputNum(value, decimals));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(inputNum(value, decimals));
  }, [value, decimals]);

  return (
    <input
      {...rest}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      autoComplete="off"
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(inputNum(value, decimals));
      }}
      onChange={(e) => {
        const t = e.target.value;
        if (!(integer ? /^\d*$/ : /^\d*[.,]?\d*$/).test(t)) return;
        setText(t);
        onChange(t === '' ? undefined : parseNum(t));
      }}
    />
  );
}

/** Accepts "90", "1:30" or "1:02:03"; shows m:ss once the field loses focus. */
export function DurationField({
  value,
  onChange,
  ...rest
}: Base & { value: number | undefined; onChange: (v: number | undefined) => void }) {
  const show = (v: number | undefined) => (v === undefined ? '' : fmtClock(v));
  const [text, setText] = useState(show(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(show(value));
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(show(value));
      }}
      onChange={(e) => {
        const t = e.target.value;
        if (!/^[\d:]*$/.test(t)) return;
        setText(t);
        onChange(t === '' ? undefined : parseClock(t));
      }}
    />
  );
}
