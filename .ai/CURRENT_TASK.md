# Current task

## RESUME HERE: Setward 1.1 is built and verified on `training-tools`; waiting for the owner (2026-10-18)

**Branch `training-tools`** (cut from `main` @ 032513f; `main` is untouched, nothing pushed or merged, NN-15). All seven milestones are done and committed: M1 c6e8ba3 (e55f6ce), M2 2c85ed2, M3 ecfa27e, M4 daa4c63, M5 71cb1d0, M6 e1dafee, M7 the release-prep commit on top. Plan: `~/.claude/plans/c-users-ousse-downloads-fitness-app-imp-iridescent-hickey.md`. Details, evidence and limits per milestone: `DEVELOPMENT_ROADMAP.md` (TT-M1 to TT-M7), `TEST_STATUS.md` (Training tools), release record `RELEASE_CHECKLIST.md` REL-105.

**Baseline at the stop:** version 1.1.0; typecheck clean; 217 tests pass (2 skipped); contrast 0 of 732 failing; `/chalk/` production build fine (index chunk 112.6 kB gzip, 39 precache entries). No server is running. The dev browser origin (localhost:5173) holds the sample data; its language is back to English.

### Next exact action
1. **Ask the owner** whether to merge `training-tools` into `main` with `--no-ff` and push (this deploys, NN-15; rollback `git revert -m 1 <merge>`). The monthly report's mid-month comparison is settled: a month in progress is compared with the same days of the month before (2026-10-18).
2. After the merge and push: watch the Pages run, check the live page as for REL-104 (bundle, manifest, What's new once, a new install), and record it in REL-105 and `TEST_STATUS.md`.
3. Owner's phone checks: REL-105 (camera capture, video playback and sharing, the record toast, warm-ups, the report, Help), plus the older REL-101 to REL-104 ones.
4. Still open from before: the copyright holder in `LICENSE`, the Google Play decisions in `.ai/PLAY_STORE.md` (the data-safety and permissions notes now cover set videos), a native-speaker look at the translations. FEAT-007 (Contact page) stays deferred until Google sign-in.

### Working notes for the next session
- **New strings:** add to `src/i18n/<code>/training.ts` for all eleven languages in the same change (NN-17). Helpers saved in `.ai/tools/` (`lang.py`, `add_i18n.py`): write `mN.py` next to them (a `lang('en', """key=text""")` block per language, then `T = build()`), run `python .ai/tools/add_i18n.py path/to/mN.py "Section name"`; it appends to every language and refuses duplicate keys. Avoid plural messages (reuse `count()` keys); Indonesian has no plural forms.
- **Shell limits:** one Bash command over about 6 KB fails with "unexpected EOF" (split it); doubled backslashes are collapsed, so inside Python write `chr(92)` for a backslash and never type `\t` or `\r` in a Python string meant for TypeScript.
- **Vite sometimes serves a stale file** after an edit (seen once with `WorkoutDetail.tsx`): `touch` the file and reload.
- The working tree is CRLF (autocrlf); new files are LF, which is fine.
- **Sweeps in a hidden Browser pane** run at about one route load per second; start them in the page (`localStorage.__sweepSrc` holds the one used for 1.1) and poll `window.__sweep`. Check results against `document.documentElement.clientWidth`.

---

(Earlier handoff, Setward 1.0, below.)

## Task
Setward 1.0 is **released** (2026-10-17): `launch` was merged into `main` as c3da695 (`--no-ff`), pushed at the owner's request, deployed by Pages run 39056196923, and the live page was checked (`RELEASE_CHECKLIST.md` REL-104). The launch plan (`.ai/LAUNCH_PLAN.md`) is complete: M1 to M8. REL-101 to REL-103 are live and still wait on the owner's phone checks.

## This session (2026-10-17): release
- The owner said "Yes: merge launch into main with --no-ff and push it, then check the live site and record it." Merged as c3da695, re-ran typecheck, 163 tests, contrast and the `/chalk/` build on `main` (same bundle `index-DXCdjz-F.js`), pushed, watched the deploy succeed, checked the live site, recorded it. This notes commit is local on `main`; it has not been pushed (a push deploys again).

## Earlier today (2026-10-17): M8
- Owner approved M8 ("run the full verification and update the notes, then ask me before merging launch into main"). Ran every check in the plan; the sweeps (now measured against `clientWidth`) found the last layout problems, in the live workout's set table at large text, and they are fixed. Added REQ-019 to REQ-023, NN-17 and NN-18, REL-104 and the M8 test evidence. Nothing was merged or pushed.

## Earlier today (2026-10-17): M7
- Owner approved starting M7. Built the link previews, manifest shortcuts and screenshots, the home-screen actions, the privacy page, licence, user README, the wide-screen panel, version 1.0.0 with the What's new sheet and the store groundwork. Details and evidence: roadmap LAUNCH-M7 and `TEST_STATUS.md`.
- Open for the owner from M7: the copyright holder in `LICENSE` (now "The Setward authors"), and the Play decisions in `.ai/PLAY_STORE.md` (account fee, closed test, package name, contact email). Phone screenshots for Play must be retaken.

## Earlier today (2026-10-17): M6
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
1. `git checkout main`. 1.0 is live; nothing is waiting to be merged. If this notes commit is still unpushed, push it only if the owner asks (a push redeploys the same bundle).
2. Open for the owner: phone checks (`RELEASE_CHECKLIST.md`, REL-101 to REL-104), the copyright holder in `LICENSE`, the Google Play decisions in `.ai/PLAY_STORE.md`, a native-speaker look at the translations.
3. Ideas not started (none approved): retake the Play screenshots at 1080 × 1920 on a phone; re-measure the overflow sweeps if the layout changes (use `clientWidth`); Google Drive sync (parked branch `google-sync`, needs its origins in the CSP `connect-src`).

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
- Baseline at the stop: typecheck clean, 163 tests pass (2 skipped), contrast 0 of 732 failing, `/chalk/` build main chunk 168.55 kB gzip (Settings, Welcome, Programs and each language are lazy chunks). The dev browser has the sample data and default settings; no server is left running.
- The dev browser has the sample data; its settings row was reset (theme System, no goal, no name). To see the week card with a goal: `(await import('/src/lib/settings.ts')).updateSettings({ weeklyGoal: 4, profileName: 'Name' })` in the page console.
- The Hevy removal is final (owner decision); do not reintroduce Hevy wording.

## Last updated
2026-10-18 (1.1 built and verified on `training-tools`, waiting for the owner; 1.0 released 2026-10-17 and live)
