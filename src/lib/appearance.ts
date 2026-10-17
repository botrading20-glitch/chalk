import { useEffect } from 'react';
import { useLocale } from '../i18n';
import type { Settings } from '../types';
import { useSettings } from './settings';

const THEME_COLOR = { dark: '#131217', black: '#000000', light: '#f3f3f6' };

/** Puts the look settings on the root element, where the stylesheet reads them. */
export function applyAppearance(s: Pick<Settings, 'theme' | 'blackTheme' | 'highContrast' | 'accent' | 'textSize' | 'reduceMotion' | 'largeControls'>, systemLight: boolean) {
  const root = document.documentElement;
  const resolved = s.theme === 'system' ? (systemLight ? 'light' : 'dark') : s.theme;
  root.dataset.theme = resolved;
  root.dataset.black = String(resolved === 'dark' && s.blackTheme);
  root.dataset.contrast = s.highContrast ? 'high' : 'normal';
  root.dataset.accent = s.accent;
  root.dataset.text = s.textSize;
  root.dataset.motion = s.reduceMotion === 'always' ? 'reduce' : 'system';
  root.dataset.controls = s.largeControls ? 'large' : 'normal';
  const color = resolved === 'light' ? THEME_COLOR.light : s.blackTheme ? THEME_COLOR.black : THEME_COLOR.dark;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

/** Keeps the root element's look attributes in step with the settings (and the system theme in Auto). */
export function useAppearance() {
  const s = useSettings();
  const { theme, blackTheme, highContrast, accent, textSize, reduceMotion, largeControls } = s;
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => applyAppearance({ theme, blackTheme, highContrast, accent, textSize, reduceMotion, largeControls }, media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, blackTheme, highContrast, accent, textSize, reduceMotion, largeControls]);
}

/** Changes whenever the language or a format setting does, so the screen redraws with the new formats. */
export function useFormatKey() {
  const locale = useLocale();
  const { timeFormat, weekStart, oneRmFormula } = useSettings();
  return `${locale}|${timeFormat}|${weekStart}|${oneRmFormula}`;
}
