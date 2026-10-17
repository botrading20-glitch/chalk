import { Fragment, type ReactNode } from 'react';
import type { Key } from './catalog';
import { template } from './index';
import type { Vars } from './message';

type Part = ReactNode | ((children: string) => ReactNode);

/**
 * A message with markup: <b>text</b> wraps the text with the function given under "b",
 * and {name} is replaced by the node (or text) given under "name". Tags don't nest.
 */
export function tRich(key: Key, parts: Record<string, Part> = {}, vars?: Vars): ReactNode {
  const text = template(key, vars);
  const out: ReactNode[] = [];
  const pattern = /<(\w+)>([\s\S]*?)<\/\1>|\{(\w+)\}/g;
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, tag, inner, name] = m;
    const part = parts[tag ?? name] ?? vars?.[name ?? ''];
    out.push(
      <Fragment key={m.index}>{typeof part === 'function' ? part(inner ?? '') : (part ?? (tag ? inner : m[0]))}</Fragment>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
