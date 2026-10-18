/** RFC 4180 parser: quoted fields, escaped quotes and newlines inside quotes. */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  for (; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ''));
}

/** Semicolons instead of commas, as spreadsheets in many regions save them: decided by the header line. */
export function detectDelimiter(text: string) {
  const header = text.replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? '';
  return header.split(';').length > header.split(',').length ? ';' : ',';
}

/** A number cell: empty or unreadable is undefined, and a decimal comma is accepted. */
export function cellNumber(s: string | undefined) {
  if (s === undefined || s.trim() === '') return undefined;
  const v = Number(s.trim().replace(',', '.'));
  return Number.isFinite(v) ? v : undefined;
}

/**
 * A spreadsheet runs a text cell that starts with = + - @ (or a tab or return) as a formula.
 * One apostrophe in front keeps it text; a cell that already starts with apostrophes then a
 * trigger gets one more, so `unescapeCell` can take exactly one back off.
 */
const FORMULA_START = /^'*[=+\-@\t\r]/;
export const escapeCell = (s: string) => (FORMULA_START.test(s) ? `'${s}` : s);
export const unescapeCell = (s: string) => (FORMULA_START.test(s.slice(1)) && s.startsWith("'") ? s.slice(1) : s);

export function toCsv(rows: (string | number | undefined | null)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          if (v === undefined || v === null) return '';
          if (typeof v === 'number') return String(v);
          return `"${escapeCell(v).replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');
}

/** Phones get the share sheet (save to Files, Drive, mail…); desktops get a download. False when the user backed out of the share sheet. */
export async function saveFile(name: string, content: BlobPart, type: string) {
  const file = new File([content], name, { type });
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobile && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return true;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return false;
    }
  }
  downloadFile(file);
  return true;
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
