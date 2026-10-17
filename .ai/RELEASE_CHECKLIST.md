# Release checklist

Pushing `main` deploys to the live app (NN-15); each new release needs the owner's authorization.

## REL-104: branch `launch` (Setward 1.0), verified 2026-10-17, NOT yet released

**Decision: READY WITH DOCUMENTED LIMITATIONS, waiting for the owner's go-ahead (NN-15).** Nothing is merged, pushed or deployed. The branch is local, eight milestones ahead of `main` (M1 Hevy removal and Strong import, M2 i18n and settings model, M3 the Forward look, M4 grouped Settings, M5 welcome / starter programs / past workouts / recent records, M6 ten languages and Arabic right to left, M7 link previews / privacy page / licence / README / wide-screen panel / What's new / store notes, M8 verification fixes). Rollback after a release: `git revert -m 1 <merge>` and push; installed copies update on next open.

**Data safety:** no Dexie schema change and no sync-format change in the whole branch (the `chalk` database name, backup `app: 'chalk'`, `chalk-sync/1` and the `/chalk/` scope are untouched). New per-device state is prefs in `kv` (`lastSeenVersion`, `welcomeSeen`, backup reminder) and new fields in the settings record with defaults, so an existing install opens exactly as before, keeps English until the user picks a language, and sees the What's new sheet once. Backups made by any earlier version still restore (`backup.test.ts`).

| Area | State |
|------|-------|
| Typecheck, 163 tests (2 skipped), contrast 732 pairs 0 failing, `npm ci --dry-run`, secret scan, tree clean | ✅ |
| `/chalk/` production build | ✅ main chunk 168.55 kB gzip (baseline 153.77); languages 14 to 17.5 kB each, lazy and precached; Arabic font cached on first use; 37 precache entries |
| Smoke S-01 to S-16 (dev with sample data, and the preview on empty storage) | ✅ |
| Existing user: no welcome screen, data intact (65 workouts, 6 routines, 1,004 exercises, 16 weigh-ins) | ✅ dev |
| First run: welcome, starter program, workout, save; past workout; backup, erase, restore; Strong and Setward CSV; data check; crash screen and repair (in French) | ✅ preview |
| Offline: reload with the server down, in French | ✅ preview |
| Overflow: every route, all ten languages at 320 and 375 px (and German, French, Dutch, Polish, Turkish, Arabic at extra-large text with larger controls); English at 320, 360, 375 and 412 px in four or more setting combinations; all measured against `clientWidth` | ✅ after the fixes recorded in TEST_STATUS (M6, M8) |
| Keyboard and reduced motion | ✅ no unnamed control on 27 routes, arrow keys in radio groups, motion off under the setting |
| CSP and service worker | ✅ 0 violations; `privacy.html` served as itself; no console errors in the final build |
| Owner's go-ahead (NN-15) | ⏳ asked, not given |
| Real phone, iPhone, screen reader | ⚠ not run (owner) |
| Native-speaker review of the translations | ⚠ not run: all ten are machine translations |
| Real link previews (Facebook debugger, WhatsApp) and launcher long-press shortcuts | ⚠ need the deployed address and a phone |
| Google Play | ⚠ groundwork only (`.ai/PLAY_STORE.md`); screenshots must be retaken; the owner decides fee, testers, package name |

Known limitations: the translations are machine-made and some wording will be off; exercise names and instructions stay English; a few translated words are short on purpose (German "Weiter", the set-table headers); at the largest text size the live workout's Previous column is hidden on phones, and the placeholders show last time instead; the Arabic font needs the network the first time Arabic is shown; the privacy page is English only; `LICENSE` names "The Setward authors" until the owner chooses a name; sweeps before M6 may have been measured against `innerWidth` (redone for the whole app in M6 and M8).

After a release, the owner (or a session with the live address) should check: the live page loads and the service worker updates; the What's new sheet appears once on a device that has data; `/chalk/privacy.html` opens as the privacy page; Chrome devtools, Application, Manifest shows the shortcuts and screenshots with no errors; a link to the app pasted into Facebook's sharing debugger and WhatsApp shows the preview image.

## REL-103: branch `data-check` (Check data), released 2026-10-16

**Decision: READY WITH DOCUMENTED LIMITATIONS.** The owner approved ("Merge data-check into main and push it"); merged as e7ad7fe and deployed (Pages run 38953196792). No data migration, schema change or sync-format change: the check only reads, and writes only when the user taps Repair or Delete. Rollback: `git revert -m 1 e7ad7fe` and push.

| Area | State |
|------|-------|
| Typecheck, 88 tests, `/chalk/` build, `npm ci --dry-run`, secret scan (on `main`) | ✅ |
| Browser QA: healthy data, crash → check → backup → Keep/Delete → reload, three repairs | ✅ dev and `/chalk/` preview |
| 320 px, dark and light, no overflow | ✅ |
| Preview CSP and service worker | ✅ 0 violations |
| Owner's go-ahead (NN-15) | ✅ 2026-10-16 |
| Deployed and live page checked | ✅ bundle `index-D2GzHZz1.js`, manifest scope `/chalk/`, 5 routes, Check data opens, 0 CSP violations, no console errors, 0 annotations |
| Screen reader | ⚠ not run |
| On the phone | ⚠ pending (owner) |

Known limitations: the workout in progress is not checked; a custom exercise with a missing `source` is checked but left out of backups; two same-day weigh-ins from different devices are not flagged; repairs fix shape, not meaning. The live site was checked on empty storage (read-only); the damaged-record flow was exercised on the same bundle in the `/chalk/` preview.

On the phone after deploy: Settings → Your data → Check data for problems should say "No problems found" and list your counts.

## REL-102: branch `features` (stopwatch, reorder, warm-up colour), released 2026-10-05

**Decision: READY WITH DOCUMENTED LIMITATIONS.** The owner approved; merged as c232c2d and deployed (Pages run 37302757241); the live page checks out. No data migration or schema change: the stopwatch only adds an optional field to the workout in progress (never synced or saved), and reordering only rewrites `order` values. Rollback: `git revert -m 1 <merge>` and push.

| Area | State |
|------|-------|
| Tests, typecheck, `/chalk/` build | ✅ |
| Browser QA of each feature, 320 px, both themes | ✅ |
| Preview S-01/S-02/S-08 (CSP) | ✅ |
| Beep heard at the stopwatch target | ⚠ not checked here (phone) |
| Owner's go-ahead (NN-15) | ✅ 2026-10-05 |
| Deployed and live page checked | ✅ |

On the phone after deploy: time a plank and check the beep and buzz at the target; reorder a folder by dragging with a finger; check that W badges are orange.

## REL-101: branch `setward` (rebrand + backlog fixes), released 2026-10-05

**Decision: READY WITH DOCUMENTED LIMITATIONS.** The owner approved ("merge and push it"); merged as 34d025d and deployed the same day (Pages run 37297499084). The live page serves the Setward build with no CSP violations or console errors. On-phone checks below are still open.

| Area | Item | State |
|------|------|-------|
| Functionality | Setward name/logo/icons/share card; UX-002, UX-003, A11Y-002, DOC-002 | ✅ |
| Quality | 62 tests pass (2 opt-in skipped); `/chalk/` build incl. typecheck and service worker | ✅ |
| Runtime | Dev-browser checks of each fix; preview S-01/S-02/S-08: 0 CSP violations, no console messages | ✅ |
| Responsive | Header at 320 px and 360 px fits; no overflow on 6 preview routes | ✅ |
| Accessibility | Segmented keyboard pattern; brand text stays readable by screen readers; no screen-reader pass | ⚠ partial |
| Compatibility | `chalk` database/backup ids, `chalk-sync/1`, `start_url`/`scope` `/chalk/` unchanged; no new dependencies; Dexie schema unchanged | ✅ |
| Data | No data migration. UX-002 only blocks a delete; nothing is rewritten | ✅ |
| Rollback | `git revert -m 1 <merge>` and push; installed apps pick it up on the next open | ✅ |
| Authorization | Owner's go-ahead to merge and push (NN-15) | ✅ 2026-10-05 |
| Deployment | Pages run 37297499084; live bundle `index-z9IrtRPz.js`; manifest Setward with `/chalk/` scope | ✅ |
| Phone | Installed name/icon refresh and the checks below | ⚠ pending (owner) |

Known limitations: no screen-reader pass; iPhone untested; Android lock-screen controls (QA-003) never reported on. Chrome on Android updates an installed app's name and icon on its own schedule (it checks when the app is opened, roughly once a day at most) and may ask to confirm the change.

## Quality-pass release: historical decision (REL-100)

**Decision (2026-10-04): READY WITH DOCUMENTED LIMITATIONS.** The owner approved; merged as 6d15c2e and deployed the same day (Pages run 37229036212). On-phone checks below are still open.

| Area | Item | State |
|------|------|-------|
| Functionality | All product requirements (REQ-001 to REQ-015) still work; smoke S-01 to S-11 pass | ✅ |
| Quality | Typecheck, 59 tests and build pass; no lint configured (DX-002) | ✅ / deferred |
| Security | CSP in production; token handling unchanged; `npm audit` clean | ✅ |
| Data integrity | Restore checks records, keeps unknown fields and one weigh-in per day; sync format and semantics untouched (NN-05) | ✅ |
| Backward compatibility | Old backups restore (test); the Dexie schema is unchanged; drafts use new `kv` keys only | ✅ |
| UX | Edits survive leaving editors; restore asks first; failures are shown | ✅ |
| Accessibility | Contrast AA for tertiary text; focus visible; screen reader not tested | ⚠ partial |
| Responsive | 320 / 360 / 375 / desktop checked; no overflow | ✅ |
| Performance | +3.2 kB gzip on the main chunk; no new runtime dependencies | ✅ |
| Testing on devices | Owner's Android phone after deploy; iPhone untested | ⚠ pending |
| Documentation | `CLAUDE.md`, `README.md`, `.ai/` current | ✅ |
| Reproducibility | Node 24, `npm ci`, commands in `CLAUDE.md`; Git Bash note recorded | ✅ |
| Known issues | Listed in the roadmap "Discovered" table (all low severity) | ✅ documented |
| Rollback | `git revert -m 1 <merge>` and push; installed apps update on next open | ✅ |

## After deploy (on the phone)
1. Open the live app and let it update (it reloads itself once).
2. Run a real set: check it off, let the rest timer run with the screen locked (NN-13 unchanged, but confirm).
3. Edit a routine, use the back gesture, reopen it: the changes are there with the bar.
4. Settings → Back up data still downloads a file.
5. REL-101 (deployed 2026-10-05): the installed app's name and home-screen icon become Setward (accept Chrome's update prompt if it shows one), and all workouts are still there.
6. REL-101: deleting a custom exercise that a routine uses is refused with a message saying where it's used.
7. REL-103 (deployed 2026-10-16): Settings → Your data → *Check data for problems* reads "No problems found" with your counts of workouts, routines, exercises and weigh-ins.
8. REL-104 (once released): open the app on your phone and let it update; the What's new sheet shows once and all your workouts, routines and settings are still there. Settings → Language: try French and Arabic. A real set with the rest timer and the screen locked still beeps (NN-13).
9. REL-104: long-press the home-screen icon (Android): *Start workout* and *Log body weight* open the right screens.
10. REL-104: Settings → About → Privacy → *Privacy page* opens the static policy.
