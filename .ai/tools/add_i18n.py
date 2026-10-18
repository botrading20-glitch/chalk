"""Append translations to src/i18n/<code>/training.ts for all eleven languages.
Usage: python add_i18n.py <module.py> [section comment]
The module defines T: dict key -> [en, fr, ar, es, de, pt, it, tr, nl, pl, id]."""
import importlib.util, os, sys, re
ROOT = r'C:\Users\ousse\Fitness\src\i18n'
LANGS = ['en', 'fr', 'ar', 'es', 'de', 'pt', 'it', 'tr', 'nl', 'pl', 'id']
HEADER = {
  'en': "import type { Message } from '../message';\n\n// Training tools: warm-ups, muscle map, monthly report, guides, set videos.\nexport default {\n",
}
FOOT = "} satisfies Record<string, Message>;\n"
spec = importlib.util.spec_from_file_location('m', sys.argv[1]); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
section = sys.argv[2] if len(sys.argv) > 2 else ''
def q(s):
    bs = chr(92)
    return "'" + s.replace(bs, bs + bs).replace("'", bs + "'") + "'"
for i, code in enumerate(LANGS):
    path = os.path.join(ROOT, code, 'training.ts')
    if not os.path.exists(path):
        head = HEADER['en'] if code == 'en' else "import type { Message } from '../message';\n\nexport default {\n"
        text = head + FOOT
    else:
        text = open(path, encoding='utf-8').read()
    existing = set(re.findall(r"^  '([^']+)':", text, re.M))
    lines = []
    for k, vals in m.T.items():
        assert len(vals) == 11, (k, len(vals))
        assert k not in existing, 'duplicate ' + k
        lines.append(f"  {q(k)}: {q(vals[i])},\n")
    block = ('\n  // ' + section + '\n' if section else '') + ''.join(lines)
    idx = text.rindex(FOOT)
    text = text[:idx] + block + text[idx:]
    open(path, 'w', encoding='utf-8', newline='\n').write(text)
print('added', len(m.T), 'keys to', len(LANGS), 'languages')
