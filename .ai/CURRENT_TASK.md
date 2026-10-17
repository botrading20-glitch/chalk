# Current task

## Task
Setward 1.0 launch work on branch `launch` (local only: not pushed, not merged, not deployed). The owner-approved plan is `.ai/LAUNCH_PLAN.md`; milestone status is in the roadmap ("Setward 1.0 launch"). **Stopped after M6** (2026-10-17): M1 (Hevy retired, Strong import, Setward CSV), M2 (i18n layer, settings model, rem/logical CSS), M3 (the Forward look), M4 (grouped Settings, every new setting wired), M5 (welcome, starter programs, log a past workout, recent records) and M6 (the ten translations and Arabic right-to-left) are done and committed. M7 (link previews, privacy page, licence, README, store groundwork, version 1.0.0) is next. REL-101 to REL-103 are live and still wait on the owner's phone checks.

## This session (2026-10-17): M6
- Owner approved starting M6 and asked to see the Settings home in Arabic and in French (375 px) as soon as the first two languages existed: sent. Then wrote the other eight catalogs, the Arabic right-to-left pass and a per-language overflow sweep. Details and evidence: roadmap LAUNCH-M6 and `TEST_STATUS.md`.
- **Lesson for sweeps:** when a page overflows sideways, a phone-sized browser widens `window.innerWidth` to match, so a check against `innerWidth` passes. Measure against `document.documentElement.clientWidth`. Earlier sweeps that used `innerWidth` could have missed page-level overflow; the M6 sweeps were redone with `clientWidth` and found (and fixed) real ones.

## Earlier today (2026-10-17): M5
- Owner approved starting M5 and asked to see the welcome screen first: sent dark and light 375 px screenshots as soon as it existed, then built the programs, the past-workout editor and the records list. Details and evidence: roadmap LAUNCH-M5 and `TEST_STATUS.md`.

## Earlier today (2026-10-17): M4
- Owner approved starting M4 and asked to see the Settings home first: sent dark and light 375 px screenshots as soon as the home existed, then built the eleven pages and wired the settings. Details and evidence: roadmap LAUNCH-M4 and `TEST_STATUS.md`.

## Earlier today (2026-10-17): M3 checkpoint 2 and checks
- The owner approved the Forward direction at checkpoint 1. Built the celebration, History and workout detail, exercises, Progress (heat map and gradient charts), body weight and the share card, then ran the M3 checks. Details and evidence: roadmap LAUNCH-M3 and `TEST_STATUS.md`.

## Earlier today (2026-10-17): M3 checkpoint 1
- Built the "Forward" tokens, the shared-component pass, the Home week card, the live-workout header, the set-check pop and `scripts/contrast.mjs` (0 of 708 pairs failing). Details, evidence and what is left: roadmap LAUNCH-M3 and `TEST_STATUS.md`.
- The owner was sent dark and light 375 px screenshots of Home and the live workout. The Settings home is not part of this checkpoint: it is the first screen of M4, so the owner sees it with its sub-pages.
- Decision recorded: NN-16 amended (`DECISIONS.md`, `NON_NEGOTIABLES.md`).

## Earlier session (2026-10-16)
- The owner gave the master prompt (v2) and "implement the first complete, usable workflow". The core logging workflow already exists and is live, so the owner chose DATA-002 from the backlog.
- Built `src/lib/dataCheck.ts`, `src/components/DataCheck.tsx` and `src/lib/dataCheck.test.ts`, with entry points in Settings and on the crash screen. Design, limits and evidence: roadmap DATA-002 and `TEST_STATUS.md` (Data check).
- Committed on `data-check` (code and tests ce3daae, notes e991ab7), then merged into `main` as e7ad7fe and pushed at the owner's request ("Merge data-check into main and push it"). The live page was verified.
- The commit recording this release in these notes was pushed afterwards at the owner's request ("Push the notes commit"), which deployed the same bundle a second time.

## Last release (2026-10-16)
- `data-check` merged into `main` as e7ad7fe and pushed (owner: "Merge data-check into main and push it"). Pages run 38953196792 succeeded, 0 annotations.
- Live at https://botrading20-glitch.github.io/chalk/: bundle `index-D2GzHZz1.js`, Check data opens, 0 CSP violations, no console errors. Evidence: `TEST_STATUS.md`; readiness: `RELEASE_CHECKLIST.md`.

## Earlier release (2026-10-05)
- `setward` merged into `main` as 34d025d and pushed (owner: "merge and push it"). Pages run 37297499084 succeeded.
- Live at https://botrading20-glitch.github.io/chalk/: Setward title, manifest and header; bundle `index-z9IrtRPz.js`; CSP present with 0 violations; service worker in control; exercise photos load; no console messages.
- Contents: the Setward rebrand (6ce6fb4), UX-002 + UX-003 (83fd874), A11Y-002 (436c05f), DOC-002 (4ae76c3), notes. Evidence: `TEST_STATUS.md`; readiness: `RELEASE_CHECKLIST.md`.

## Open for the owner
- Phone check for REL-103 in `RELEASE_CHECKLIST.md`: Settings → Your data → Check data for problems.
- Phone checks for REL-102 in `RELEASE_CHECKLIST.md`: the stopwatch beep and buzz at the target, finger-dragging in the reorder sheet, orange W badges.
- Phone checks in `RELEASE_CHECKLIST.md` → After deploy (both releases), including the installed name/icon refresh to Setward.
- Decided 2026-10-05: keep blocking the delete of a used custom exercise (UX-002); no ESLint (DX-002 cancelled). See `DECISIONS.md`.

## Environment notes
- No dev server or preview is left running (the ones started on 2026-10-16 were stopped). A fresh browser origin starts empty: restore `tmp-import/chalk-sample-backup.json` from Settings → Restore backup.
- Local branches `quality-pass`, `setward`, `features` and `data-check` are merged and kept; `google-sync` is parked.
- ENV-002: deploy jobs are pinned to `ubuntu-24.04` (2026-10-05) because `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19. Revisit when GitHub retires that image.

## Next exact action (resume here)
1. `git checkout launch` (HEAD should be the commit "Translate into ten languages and add the Arabic right-to-left pass"). Read M7 and M8 in `.ai/LAUNCH_PLAN.md`.
2. Start **M7**: Open Graph and Twitter tags with a 1200×630 `og-image.png` drawn in the dev browser, manifest `screenshots` / `shortcuts` / `categories` (`start_url` and `scope` unchanged, NN-12), `public/privacy.html` (same text as About → Privacy), a `LICENSE`, the README for users, a wide-screen side panel, version 1.0.0 with What's new shown once after updating, and the store groundwork (`.ai/PLAY_STORE.md`, `branding/store/`; nothing is submitted). The CSP stays unchanged: no new origins.
3. Then M8 (verify everything, update the notes, ask the owner before merging `launch` into `main` and pushing, which deploys). Merge and push only with the owner's go-ahead (NN-15).

### M3 design brief (decided, not yet built)
- Keep the violet-charcoal palette, purple accent, Big Shoulders Display and Archivo. Owner asked for refine + bolder together. Amend NN-16 in `DECISIONS.md` when it lands.
- Spend the boldness in one place: hero numbers and the post-workout celebration. Keep everything else quiet. Avoid the template tells (all-caps eyebrow labels, identical rounded cards with the same grey shadow, gradient washes everywhere, "A · B · C" meta strings where a plain phrase is better).
- Tokens to add: gradient and glow for hero elements only, elevation, radius and motion scales. Big Shoulders for big numbers (stats, clocks, records). A slanted motif from the split-S angle for progress bars, goal and streak chips. Layered surfaces with a subtle top highlight. Motion only where it answers an action (set check pop, sheet handle, route fade, celebration); it all turns off under reduce-motion.
- Screens: Home (greeting from `profileName`, "this week" card with day dots, weekly goal and streak), live workout, post-save celebration, History and workout detail, exercise list and detail, Progress (heatmap with intensity, gradient charts), body weight, share card.
- Checks: widths 320, 360, 375 and desktop; dark, light and black themes, normal and high contrast; text sizes up to extra-large; write `scripts/contrast.mjs` (text 4.5:1, indicators 3:1) and run it over every theme and accent (the indigo, teal and pink accent tokens in `styles.css` are provisional until it passes); no-overflow sweep on every route.

## Environment notes for the next session
- **Bash tool limit:** a single command longer than about 6 KB fails with "unexpected EOF". Split big heredocs into several calls. Doubled backslashes in a command are collapsed to one, so build strings containing a backslash with `chr(92)` or raw strings.
- **Handy helper pattern:** small python scripts that replace exact strings (each old string must exist once) were used for all the string extraction. `src/i18n/en/*.ts` holds the catalog parts, merged in `src/i18n/en.ts`; add a key there and use `t('key')`.
- Dev server: `.claude/launch.json` → `chalk-dev` (:5173) and `chalk-preview` (:4173, built with `MSYS_NO_PATHCONV=1 BASE_PATH=/chalk/ npm run build`). The dev browser has the sample data and default settings. No server is left running.
- Baseline at the stop: typecheck clean, 104 tests pass (2 skipped), contrast 0 of 732 failing, 125 tests, `/chalk/` build main chunk 166.85 kB gzip (Settings, Welcome and Programs are lazy chunks).
- The dev browser has the sample data; its settings row was reset (theme System, no goal, no name). To see the week card with a goal: `(await import('/src/lib/settings.ts')).updateSettings({ weeklyGoal: 4, profileName: 'Name' })` in the page console.
- The Hevy removal is final (owner decision); do not reintroduce Hevy wording.

## Last updated
2026-10-17 (M6 done; M7 next)
