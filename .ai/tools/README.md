# Helper scripts for adding translations

`lang.py` and `add_i18n.py` append new messages to all eleven languages at once (`src/i18n/<code>/training.ts`).

1. Next to `lang.py`, write a file like `m5.py`: `from lang import lang, build`, then one `lang('en', """key=text""")` block per language (en, fr, ar, es, de, pt, it, tr, nl, pl, id; one `key=text` per line, `{placeholders}` identical in every language), then `T = build()` (it checks that every language has the same keys).
2. Run `python .ai/tools/add_i18n.py path/to/m5.py "Section name"`. It refuses a key that already exists.
3. `npx vitest run src/i18n` checks keys, placeholders and tags.

Avoid plural messages (reuse the `count()` keys); Indonesian has no plural forms. The script path in `add_i18n.py` is this machine's repository folder.
