import type { Key } from './catalog';
import { t } from './index';

/**
 * A map of `<prefix>.<key>` messages that reads like a constant but translates
 * when it is read, so the labels follow the language without changing callers.
 */
export function labelMap<K extends string>(prefix: string, keys: readonly K[]): Record<K, string> {
  const map = {} as Record<K, string>;
  for (const k of keys) Object.defineProperty(map, k, { enumerable: true, get: () => t(`${prefix}.${k}` as Key) });
  return map;
}
