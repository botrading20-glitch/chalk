import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// BASE_PATH lets the GitHub Pages workflow serve the app from /<repo>/.
const base = process.env.BASE_PATH ?? '/';

// Link previews (Open Graph, Twitter) need absolute URLs, so index.html carries __SITE_URL__ and this fills it in.
// It defaults to the live address; a fork or a custom domain sets SITE_URL (with a trailing slash) at build time.
const siteUrl = process.env.SITE_URL ?? 'https://botrading20-glitch.github.io/chalk/';
const siteUrlPlugin: Plugin = {
  name: 'chalk-site-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
};

// Content Security Policy for production builds (the dev server's hot reload
// needs inline scripts). The GitHub sync token sits in IndexedDB, so scripts
// only come from the app itself, and the network only reaches GitHub's API and
// the exercise photos. Blob URLs carry the share image and the rest-alert audio.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' blob: data: https://raw.githubusercontent.com",
  "font-src 'self'",
  "media-src 'self' blob:",
  "connect-src 'self' https://api.github.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const contentSecurityPolicy: Plugin = {
  name: 'chalk-csp',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
};

export default defineConfig({
  base,
  build: {
    // The exercise library is one lazily-loaded chunk by design.
    chunkSizeWarningLimit: 1000,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    siteUrlPlugin,
    contentSecurityPolicy,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Setward — workout log',
        short_name: 'Setward',
        description: 'Log sets, track records and follow your progress. Works offline.',
        theme_color: '#131217',
        background_color: '#131217',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['health', 'fitness', 'sports'],
        start_url: base,
        scope: base,
        // Long-press the home-screen icon: the app opens at `#/?action=...` (see src/lib/launch.ts).
        shortcuts: [
          {
            name: 'Start workout',
            short_name: 'Start',
            description: 'Begin an empty workout',
            url: `${base}#/?action=start`,
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Log body weight',
            short_name: 'Weigh in',
            description: 'Record today’s body weight',
            url: `${base}#/?action=weigh`,
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        // For the install prompt's richer card. They are fetched from the network when it is shown, not precached.
        screenshots: [
          { src: 'store/screenshot-home.jpg', sizes: '824x1830', type: 'image/jpeg', form_factor: 'narrow', label: 'Home, with this week and your routines' },
          { src: 'store/screenshot-workout.jpg', sizes: '824x1830', type: 'image/jpeg', form_factor: 'narrow', label: 'Logging a workout with the rest timer' },
          { src: 'store/screenshot-progress.jpg', sizes: '824x1830', type: 'image/jpeg', form_factor: 'narrow', label: 'Progress: your totals and latest records' },
          { src: 'store/screenshot-exercise.jpg', sizes: '824x1830', type: 'image/jpeg', form_factor: 'narrow', label: 'An exercise with its chart and personal records' },
          { src: 'store/screenshot-wide.jpg', sizes: '800x455', type: 'image/jpeg', form_factor: 'wide', label: 'Setward on a computer' },
        ],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // The Arabic font is 160 kB and only Arabic readers need it: it is cached the first time it is used.
        globIgnores: ['**/noto-sans-arabic-*.woff2', 'store/**', 'og-image.jpg'],
        // privacy.html is its own static page; without this the offline shell would answer for it.
        navigateFallbackDenylist: [/privacy\.html$/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /noto-sans-arabic-[\w-]*\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'arabic-font',
              expiration: { maxEntries: 2 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Exercise demo images from the open exercise database.
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-images',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
