import type { en } from './en';
import type { Message } from './message';

/** Every message key; the English catalog is the source of truth. */
export type Key = keyof typeof en;

/** A complete translation: TypeScript fails the build when a key is missing. */
export type Catalog = Record<Key, Message>;
