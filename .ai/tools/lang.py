L = {}
ORDER = ['en', 'fr', 'ar', 'es', 'de', 'pt', 'it', 'tr', 'nl', 'pl', 'id']
def lang(code, block):
    d = {}
    for line in block.strip().split('\n'):
        k, v = line.split('=', 1)
        d[k.strip()] = v.strip()
    L[code] = d
def build():
    for c in ORDER:
        assert c in L, c
        assert set(L[c]) == set(L['en']), (c, set(L['en']) ^ set(L[c]))
    return {k: [L[c][k] for c in ORDER] for k in L['en']}
