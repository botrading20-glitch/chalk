import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { WHATS_NEW, whatsNewAction } from './whatsNew';

const entries = { '1.0.0': [] };

describe('whatsNewAction', () => {
  it('shows the list once to a device that has data and updates', () => {
    expect(whatsNewAction({ seen: '', version: '1.0.0', hasData: true }, entries)).toBe('show');
    expect(whatsNewAction({ seen: '0.9.0', version: '1.0.0', hasData: true }, entries)).toBe('show');
    expect(whatsNewAction({ seen: '1.0.0', version: '1.0.0', hasData: true }, entries)).toBe('none');
  });

  it('only records the version on a new, empty install', () => {
    expect(whatsNewAction({ seen: '', version: '1.0.0', hasData: false }, entries)).toBe('remember');
  });

  it('records a version with nothing to tell instead of showing an empty list', () => {
    expect(whatsNewAction({ seen: '1.0.0', version: '1.0.1', hasData: true }, entries)).toBe('remember');
  });

  it('shows to a device whose recorded version is older even when it is empty', () => {
    expect(whatsNewAction({ seen: '0.9.0', version: '1.0.0', hasData: false }, entries)).toBe('show');
  });
});

describe('WHATS_NEW', () => {
  it('only points at messages the catalog has', () => {
    for (const items of Object.values(WHATS_NEW)) {
      expect(items.length).toBeGreaterThan(0);
      for (const [title, text] of items) {
        expect(en[title]).toBeTruthy();
        expect(en[text]).toBeTruthy();
      }
    }
  });
});
