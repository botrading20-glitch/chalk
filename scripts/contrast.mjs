// Contrast check for every theme, accent and contrast setting in src/styles.css.
//   node scripts/contrast.mjs          prints failures and exits 1 if there are any
//   node scripts/contrast.mjs --all    prints every pair
// Text pairs need 4.5:1 and indicators (rings, fills, icons) 3:1. Tokens are read from the
// stylesheet with the same cascade the browser uses, so a token change is checked as it lands.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// --- Read the token blocks -------------------------------------------------------------------

const blocks = [];
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const vars = {};
  for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
  if (!Object.keys(vars).length) continue;
  for (const sel of m[1].split(',').map((s) => s.trim())) {
    if (!sel.startsWith(':root')) continue;
    const attrs = [...sel.matchAll(/\[data-(\w+)='([^']*)'\]/g)].map((a) => [a[1], a[2]]);
    blocks.push({ attrs, spec: 1 + attrs.length, order: blocks.length, vars });
  }
}

function tokens(state) {
  const applies = blocks
    .filter((b) => b.attrs.every(([k, v]) => state[k] === v))
    .sort((a, b) => a.spec - b.spec || a.order - b.order);
  const out = {};
  for (const b of applies) Object.assign(out, b.vars);
  return out;
}

// --- Colour maths ----------------------------------------------------------------------------

function parse(value) {
  const v = value.trim();
  let m = v.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
  }
  m = v.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)$/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  throw new Error(`Cannot read colour: ${value}`);
}

const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const unlin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function luminance({ r, g, b }) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `top` at its alpha over an opaque `under`. */
function over(top, under) {
  const a = top.a;
  return { r: top.r * a + under.r * (1 - a), g: top.g * a + under.g * (1 - a), b: top.b * a + under.b * (1 - a), a: 1 };
}

/** color-mix(in srgb, A pct%, B) with B opaque (or transparent when `b` has alpha 0). */
function mixSrgb(a, pct, b) {
  const p = pct / 100;
  return { r: a.r * p + b.r * (1 - p), g: a.g * p + b.g * (1 - p), b: a.b * p + b.b * (1 - p), a: 1 };
}

function toOklab({ r, g, b }) {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function fromOklab([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const clamp = (x) => Math.min(255, Math.max(0, unlin(x)));
  return {
    r: clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a: 1,
  };
}

/** color-mix(in oklab, A pct%, B). */
function mixOklab(a, pct, b) {
  const p = pct / 100;
  const [x, y] = [toOklab(a), toOklab(b)];
  return fromOklab(x.map((v, i) => v * p + y[i] * (1 - p)));
}

// --- The pairs -------------------------------------------------------------------------------

const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const THEMES = ['dark', 'light'];
const ACCENTS = ['purple', 'indigo', 'teal', 'pink'];

const rows = [];
let failures = 0;

function check(label, kind, fg, bg, state) {
  const need = kind === 'text' ? 4.5 : 3;
  const got = ratio(fg, bg);
  const ok = got >= need - 0.005;
  if (!ok) failures++;
  rows.push({ ok, text: `${ok ? 'pass' : 'FAIL'}  ${got.toFixed(2).padStart(5)} (${need})  ${label}  [${state}]` });
}

for (const theme of THEMES) {
  for (const black of theme === 'dark' ? [false, true] : [false]) {
    for (const contrast of ['normal', 'high']) {
      for (const accent of ACCENTS) {
        const state = { theme, black: String(black), contrast, accent };
        const tag = `${theme}${black ? '+black' : ''} ${contrast} ${accent}`;
        const tk = tokens(state);
        const c = (name) => parse(tk[name]);
        const bg = c('--bg');
        const surface = c('--surface');
        const surface2 = c('--surface-2');
        const accentC = c('--accent');
        const deep = mixOklab(accentC, 70, { r: 13, g: 6, b: 24, a: 1 });

        for (const [n, under] of [['bg', bg], ['surface', surface], ['surface-2', surface2]]) {
          check(`text on ${n}`, 'text', c('--text'), under, tag);
          check(`text-2 on ${n}`, 'text', c('--text-2'), under, tag);
          check(`accent-ink on ${n}`, 'text', c('--accent-ink'), under, tag);
        }
        check('text-3 on bg', 'text', c('--text-3'), bg, tag);
        check('text-3 on surface', 'text', c('--text-3'), surface, tag);
        check('danger on surface', 'text', c('--danger'), surface, tag);

        // Buttons and tabs: white on the accent and on the darker end of the hero gradient.
        check('on-accent on accent', 'text', c('--on-accent'), accentC, tag);
        check('on-accent on accent-deep', 'text', c('--on-accent'), deep, tag);

        // Set badges: coloured text on its own 14% tint over the card.
        for (const [ring, ink] of [['--warmup', '--warmup'], ['--fail', '--fail-ink'], ['--drop', '--drop-ink']]) {
          const tint = over({ ...c(ring), a: 0.14 }, surface);
          check(`${ring.slice(2)} badge text`, 'text', c(ink), tint, tag);
          check(`${ring.slice(2)} badge ring`, 'ui', c(ring), surface, tag);
        }

        // Week card: text on the tinted end of the wash, and the chip.
        const wash = mixSrgb(accentC, 20, surface);
        check('text-2 on week wash', 'text', c('--text-2'), wash, tag);
        check('accent-ink on week wash', 'text', c('--accent-ink'), wash, tag);
        check('text on streak chip', 'text', c('--text'), mixSrgb(accentC, 24, surface2), tag);

        // Indicators.
        check('accent ring on surface', 'ui', accentC, surface, tag);
        check('accent ring on bg', 'ui', accentC, bg, tag);
        check('viz on surface', 'ui', c('--viz'), surface, tag);
        check('tick (white) on accent dot', 'ui', WHITE, accentC, tag);
        check('tick (white) on done', 'ui', WHITE, c('--done'), tag);
        check('done on surface', 'ui', c('--done'), surface, tag);
        if (contrast === 'high') check('line on surface', 'ui', c('--line'), surface, tag);
      }
    }
  }
}

const show = process.argv.includes('--all') ? rows : rows.filter((r) => !r.ok);
for (const r of show) console.log(r.text);
console.log(`\n${rows.length} pairs checked, ${failures} failing.`);
process.exit(failures ? 1 : 0);
