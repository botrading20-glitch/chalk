/** A translated string. Counts use one form per plural category the language needs; `other` is always there. */
export interface PluralMessage {
  other: string;
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
}

export type Message = string | PluralMessage;

/** Values for {placeholders}. A number in a plural message also picks the plural form (`n`). */
export type Vars = Record<string, string | number>;
