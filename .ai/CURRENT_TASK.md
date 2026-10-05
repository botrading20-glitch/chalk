# Current task

## Task
No task is active. REL-101 is released; waiting on the owner's phone checks and two small decisions.

## Last release (2026-10-05)
- `setward` merged into `main` as 34d025d and pushed (owner: "merge and push it"). Pages run 37297499084 succeeded.
- Live at https://botrading20-glitch.github.io/chalk/: Setward title, manifest and header; bundle `index-z9IrtRPz.js`; CSP present with 0 violations; service worker in control; exercise photos load; no console messages.
- Contents: the Setward rebrand (6ce6fb4), UX-002 + UX-003 (83fd874), A11Y-002 (436c05f), DOC-002 (4ae76c3), notes. Evidence: `TEST_STATUS.md`; readiness: `RELEASE_CHECKLIST.md`.

## Open for the owner
- Phone checks in `RELEASE_CHECKLIST.md` → After deploy (both releases), including the installed name/icon refresh to Setward.
- **UX-002 default:** deleting a used custom exercise is refused. Keep, or drop it from routines automatically?
- **DX-002:** add ESLint (free, dev-only), or keep strict `tsc` only.

## Environment notes
- The dev server on :5173 (`vite --host 127.0.0.1`) was already running and was left running. Its browser storage on 127.0.0.1:5173 holds the QA sample (65 workouts).
- Local branches `quality-pass` and `setward` are merged and kept; `google-sync` is parked.
- ENV-002: deploys warn that `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19. If a deploy fails after that, pin `runs-on: ubuntu-24.04` in `.github/workflows/deploy.yml`.

## Next exact action
Ask the owner how the release behaves on the phone (checks 1–6 in `RELEASE_CHECKLIST.md` → After deploy) and for the two decisions above; then pick the next work with them.

## Last updated
2026-10-05
