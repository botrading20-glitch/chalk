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

## Current

_Updated as tasks complete; see below._

| Check | State | Last run | Notes |
|-------|-------|----------|-------|
| Typecheck | PASS | baseline | |
| Unit tests | PASS | baseline | |
| Build | PASS | baseline | |
| Smoke S-01 | PASS | baseline | |
| Other smoke tests | NOT RUN | | |

## Environment limitations
- No physical phone. The Android lock-screen behaviour (NN-13) and iPhone can't be verified here.
- Browser QA uses the desktop app's built-in Chromium with mobile emulation. Touch gestures are simulated as clicks.
- The GitHub sync live test needs the owner's token. It is not run, and AI sessions must not handle the token.
