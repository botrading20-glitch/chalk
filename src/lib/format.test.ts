import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';
import { fmtClock, fmtDuration, fmtRest, inputNum, kgTo, parseClock, parseNum, toKg } from './format';

describe('number input', () => {
  it('accepts both decimal separators', () => {
    expect(parseNum('12.5')).toBe(12.5);
    expect(parseNum('12,5')).toBe(12.5);
    expect(parseNum('12.')).toBe(12);
    expect(parseNum('')).toBeUndefined();
    expect(parseNum('abc')).toBeUndefined();
  });

  it('prints plain decimals for input fields', () => {
    expect(inputNum(22.68, 1)).toBe('22.7');
    expect(inputNum(20)).toBe('20');
    expect(inputNum(undefined)).toBe('');
  });

  it('converts kg and lbs without drift', () => {
    expect(toKg(kgTo(100, 'lbs'), 'lbs')).toBeCloseTo(100, 10);
    expect(kgTo(100, 'kg')).toBe(100);
  });
});

describe('clock', () => {
  it('parses seconds, m:ss and h:mm:ss', () => {
    expect(parseClock('90')).toBe(90);
    expect(parseClock('1:30')).toBe(90);
    expect(parseClock('1:02:03')).toBe(3723);
    expect(parseClock('1::3')).toBeUndefined();
    expect(parseClock('')).toBeUndefined();
  });

  it('formats elapsed time, durations and rests', () => {
    expect(fmtClock(83)).toBe('1:23');
    expect(fmtClock(3723)).toBe('1:02:03');
    expect(fmtClock(-5)).toBe('0:00');
    expect(fmtDuration(4560)).toBe('1h 16min');
    expect(fmtDuration(3600)).toBe('1h');
    expect(fmtRest(0)).toBe('Off');
    expect(fmtRest(90)).toBe('1min 30s');
    expect(fmtRest(45)).toBe('45s');
  });
});

describe('csv', () => {
  it('handles quotes, escaped quotes, embedded newlines, CRLF and a BOM', () => {
    const text = '﻿a,b,c\r\n"x, y","say ""hi""","line1\nline2"\r\n\r\n1,,3';
    expect(parseCsv(text)).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'say "hi"', 'line1\nline2'],
      ['1', '', '3'],
    ]);
  });

  it('round-trips what it writes', () => {
    const rows = [
      ['title', 'n', 'empty'],
      ['Chest "heavy" day, 2', 12.5, undefined],
    ];
    expect(parseCsv(toCsv(rows))).toEqual([
      ['title', 'n', 'empty'],
      ['Chest "heavy" day, 2', '12.5', ''],
    ]);
  });
});
