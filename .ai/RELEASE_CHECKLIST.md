# Release checklist

Pushing `main` deploys to the live app (NN-15); each new release needs the owner's authorization.

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
