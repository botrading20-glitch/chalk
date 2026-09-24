// Draws a workout summary as a 1080×1350 PNG (the 4:5 portrait size most
// apps show uncropped), in the app's own colours and fonts.

export interface CardData {
  title: string;
  date: string;
  when: string;
  stats: { label: string; value: string }[];
  records: number;
  exercises: { name: string; sets: number; best: string; record: boolean }[];
}

const W = 1080;
const H = 1350;
const M = 80;
const ROW = 84;
const C = {
  bg: '#131217',
  line: '#2b2a33',
  text: '#ecebf2',
  text2: '#a7a5b3',
  text3: '#76747f',
  accent: '#7a55e6',
  accentInk: '#b39dff',
  ring: '#5f3fc4',
  onAccent: '#ffffff',
};
const DISPLAY = '"Big Shoulders Display Variable", "Archivo Variable", sans-serif';
const BODY = '"Archivo Variable", system-ui, sans-serif';
const TROPHY = new Path2D('M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20h7M10 17h4v3h-4z');

/** Cuts text to fit `max` pixels, ending in an ellipsis. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(`${text.slice(0, mid).trimEnd()}…`).width <= max) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo).trimEnd()}…`;
}

/** Greedy word wrap into at most `lines` lines; the last one is ellipsised. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, lines: number) {
  const out: string[] = [];
  let current = '';
  const words = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const next = current ? `${current} ${words[i]}` : words[i];
    if (ctx.measureText(next).width <= max || !current) {
      current = next;
      continue;
    }
    if (out.length === lines - 1) {
      out.push(fit(ctx, [current, ...words.slice(i)].join(' '), max));
      return out;
    }
    out.push(current);
    current = words[i];
  }
  if (current) out.push(fit(ctx, current, max));
  return out;
}

function trophy(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(TROPHY);
  ctx.restore();
}

/** The app icon: a bumper plate. */
function plate(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.ring;
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

export async function renderWorkoutCard(data: CardData): Promise<Blob> {
  // Canvas only uses fonts that have finished loading.
  await Promise.all([
    document.fonts.load(`800 120px ${DISPLAY}`),
    document.fonts.load(`600 36px ${BODY}`),
    document.fonts.load(`400 32px ${BODY}`),
  ]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Header: plate + wordmark, date on the right.
  plate(ctx, M + 22, M + 22, 22);
  ctx.fillStyle = C.accentInk;
  ctx.font = `800 48px ${DISPLAY}`;
  ctx.letterSpacing = '3px';
  ctx.fillText('CHALK', M + 58, M + 39);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = C.text2;
  ctx.font = `500 30px ${BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText(data.date, W - M, M + 36);
  ctx.textAlign = 'left';

  // Title, up to two lines.
  let y = M + 170;
  ctx.fillStyle = C.text;
  ctx.font = `800 120px ${DISPLAY}`;
  for (const line of wrap(ctx, data.title.toUpperCase(), W - 2 * M, 2)) {
    ctx.fillText(line, M, y);
    y += 112;
  }
  y -= 44;
  ctx.fillStyle = C.text2;
  ctx.font = `400 32px ${BODY}`;
  ctx.fillText(fit(ctx, data.when, W - 2 * M), M, y);
  y += 44;

  // Records banner, styled like the "saved" banner in the app.
  if (data.records > 0) {
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, 96, 24);
    ctx.fill();
    trophy(ctx, M + 28, y + 26, 44, C.onAccent);
    ctx.fillStyle = C.onAccent;
    ctx.font = `800 56px ${DISPLAY}`;
    ctx.fillText(`${data.records} NEW ${data.records === 1 ? 'RECORD' : 'RECORDS'}`, M + 92, y + 68);
    y += 96 + 40;
  } else {
    y += 16;
  }

  // Stats in equal columns.
  const col = (W - 2 * M) / data.stats.length;
  data.stats.forEach((s, i) => {
    const x = M + i * col;
    ctx.fillStyle = C.text3;
    ctx.font = `600 24px ${BODY}`;
    ctx.letterSpacing = '2px';
    ctx.fillText(s.label.toUpperCase(), x, y + 24);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = C.text;
    ctx.font = `700 64px ${DISPLAY}`;
    ctx.fillText(fit(ctx, s.value, col - 16), x, y + 96);
  });
  y += 136;

  ctx.fillStyle = C.line;
  ctx.fillRect(M, y, W - 2 * M, 2);
  y += 30;

  // Exercises: as many rows as fit above the footer.
  const footerY = H - M;
  const room = Math.floor((footerY - 50 - y) / ROW);
  const overflow = data.exercises.length > room;
  const shown = overflow ? data.exercises.slice(0, room - 1) : data.exercises;
  for (const ex of shown) {
    const base = y + 54;
    ctx.fillStyle = C.text3;
    ctx.font = `700 40px ${DISPLAY}`;
    ctx.fillText(`${ex.sets}×`, M, base);

    ctx.font = `400 32px ${BODY}`;
    const bestWidth = ex.best ? ctx.measureText(ex.best).width : 0;
    const trophyWidth = ex.record ? 44 : 0;
    ctx.fillStyle = C.text2;
    ctx.textAlign = 'right';
    if (ex.best) ctx.fillText(ex.best, W - M - trophyWidth, base);
    ctx.textAlign = 'left';
    if (ex.record) trophy(ctx, W - M - 32, base - 29, 32, C.accentInk);

    ctx.fillStyle = C.text;
    ctx.font = `600 36px ${BODY}`;
    ctx.fillText(fit(ctx, ex.name, W - 2 * M - 90 - bestWidth - trophyWidth - 28), M + 90, base);
    y += ROW;
  }
  if (overflow) {
    ctx.fillStyle = C.text3;
    ctx.font = `500 30px ${BODY}`;
    const more = data.exercises.length - shown.length;
    ctx.fillText(`+ ${more} more ${more === 1 ? 'exercise' : 'exercises'}`, M + 90, y + 50);
  }

  ctx.fillStyle = C.text3;
  ctx.font = `500 26px ${BODY}`;
  ctx.fillText('Logged with Chalk', M, footerY);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/png'));
}
