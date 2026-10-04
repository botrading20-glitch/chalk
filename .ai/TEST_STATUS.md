# Test status

States: PASS · FAIL · PARTIAL · NOT RUN · BLOCKED · UNKNOWN.

## Baseline (2026-10-04 20:29, `main` @ 0698dc1, before any change)

| Check | State | Evidence |
|-------|-------|----------|
| Typecheck (`tsc --noEmit`, TS 7.0.2) | PASS | exit 0 |
| Unit tests (vitest 5.0.1) | PASS | 2 files, 19 passed, 2 skipped (`github.smoke`, opt-in) |
| Build (`vite build`, Vite 8.3.0) | PASS | main chunk 465 kB (145 kB gzip), lazy exercises chunk 844 kB (165 kB gzip), CSS 33 kB, precache 22 entries / 1.56 MB |
| `npm audit` | PASS | 0 vulnerabilities (prod and dev) |
| Lint | NOT RUN | No linter is configured. `tsc` runs strict with `noUnused*`. |
| Dev server UI | PASS | Workout tab renders at 375×812, empty database, no console errors |
| Runtime: Node 24.19.0, npm 11.17.0, Windows 11 | — | — |

**Pre-existing defects found by reading the code** (not regressions):
1. A render error blanks the whole app and leaves no way to export data. → REL-001
2. The "Save workout" button stays disabled for good if saving throws. → REL-002
3. Backup restore writes records without validation, can crash rendering and can create two weigh-ins on one day. → DATA-001
4. The routine and past-workout editors lose changes on the back gesture or on tapping an exercise name. → UX-001
5. `--text-3` contrast is 4.06:1 (dark) and 3.90:1 (light) on the page background, below AA 4.5:1. → A11Y-001
6. The search field shows no focus indicator. → A11Y-001

## Current (2026-10-04 ~21:20, branch `quality-pass` @ 506c14f)

| Check | State | Evidence |
|-------|-------|----------|
| A-01 Typecheck | PASS | `tsc --noEmit` exit 0 |
| A-02 Unit tests | PASS | 8 files: 59 passed, 2 skipped (opt-in GitHub smoke). New: `stats`, `format` (with CSV and `fmtSet`), `hevy`, `workouts`, `backup` tests. Mutation check: breaking the warm-up rule and 12-hour parsing each failed a test. |
| A-03 Build | PASS | Main chunk 474 kB (148.6 kB gzip), up from 465/145.4: +3.2 kB gzip for the crash screen, restore checks, drafts and CSP. Precache 22 entries / 1.57 MB. |
| `npm audit` | PASS | 0 vulnerabilities after adding `fake-indexeddb` |
| Lint | NOT RUN | none configured (DX-002) |
| S-01 App loads | PASS | dev and preview builds, no console errors |
| S-02 Navigation | PASS | tabs and back buttons used throughout the QA sweeps |
| S-03 Live workout survives reload | PASS | in-progress workout intact after reloads, an offline reload and a service-worker update |
| S-04 Set check + rest timer | PASS | rest bar counted down after checking sets (dev and preview) |
| S-05 Routine round trip | PASS | started routines pre-fill sets; routine editor save verified (UX-001) |
| S-06 Finish and history | PASS | "Workout 66 saved" detail page after finishing (REL-002 run); past-workout edit and save (UX-001) |
| S-07 Offline | PASS | preview server stopped → reload served by the service worker, app and workout intact |
| S-08 Sub-path build + CSP | PASS | `/chalk/` preview: zero CSP violations across restore, photos, fonts, share image, rest timer, blob audio, Progress calendar, body weight and plate calculator; a foreign fetch was blocked |
| S-09 Backup round trip | PASS | unit test (export → wipe → restore equal) and browser (confirm sheet → restore; stored records unchanged by cleaning) |
| S-10 Hevy import | PASS | browser: exported the 65 sample workouts as Hevy CSV, wiped, imported through Settings: 65 workouts, 937 sets before and after, 23 matched, 1 created, 5 routines from history |
| S-11 Crash screen | PASS | a malformed workout showed the recovery screen; its backup (save stubbed) held 66 workouts |
| Responsive | PASS | 320 / 360 / 375 / 1280 px: no page overflow on the swept routes; no clipped Previous values |
| Themes | PASS | dark and light screenshots of History, Progress and the live workout |
| Contrast | PASS | `--text-3` 5.21:1 (dark) and 5.30:1 (light) on the background |
| Keyboard focus | PARTIAL | global `:focus-visible` ring plus the new search ring; not swept screen by screen |
| Screen reader | NOT RUN | no screen reader in this environment; the charts keep their hidden data tables |
| Real phone (Android) | NOT RUN | needs the owner's device after deploy (see REL-100) |
| iPhone | BLOCKED | no device (QA-002) |
| Live GitHub sync | NOT RUN | needs the owner's token; sync code is unchanged and `syncCore` tests pass |

## Pre-existing defects found during QA (all fixed)
7. Charts drew at 320 px and overflowed phones narrower than about 386 px, including 375 px.
8. The charts' screen-reader table widened the page on phones.
9. The consistency calendar overflowed at 360 px.
10. The Back up / Restore buttons overflowed Settings on phones.
11. The Previous column cut off values, hiding last time's reps.
12. A mistyped huge weight froze the plate calculator (2 s at 1,000,000 kg; 117 s at 10,000,000 kg).

## Environment limitations
- No physical phone. The Android lock-screen behaviour (NN-13) and iPhone can't be verified here.
- Browser QA uses the desktop app's built-in Chromium with mobile emulation. Touch gestures are simulated as clicks.
- The GitHub sync live test needs the owner's token. It is not run, and AI sessions must not handle the token.
- When the desktop app's browser pane is hidden, the page renders no frames, so `requestAnimationFrame` and `ResizeObserver` never fire. Check `document.visibilityState` before trusting size or animation results.
- In Git Bash, `BASE_PATH=/chalk/` is rewritten to a Windows path; prefix `MSYS_NO_PATHCONV=1`.
