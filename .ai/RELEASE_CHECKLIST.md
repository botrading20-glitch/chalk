# Release checklist

Pushing `main` deploys to the live app (NN-15); each new release needs the owner's authorization.

## Setward identity: local verification (2026-10-05)

**Status: complete locally, uncommitted and not deployed.** The live app still serves the prior Chalk release at `main` @ 6d15c2e. The earlier quality-pass approval does not authorize publishing this rebrand.

| Area | Item | State |
|------|------|-------|
| Identity | Setward name, split-S logo, header, browser/install metadata, icons, share card and reusable `branding/` assets saved locally | ✅ |
| Quality | 59 tests passed; 2 opt-in live-sync tests skipped; `/chalk/` production build passed, including typecheck and service worker | ✅ |
| Visual checks | Dark/light 360 px header without overflow; settings, icons and sample share card checked; no console warnings/errors in inspected preview | ✅ |
| Compatibility | `chalk` database/backup identifiers, `chalk-sync/1`, manifest start URL/scope and `/chalk/` address preserved; no dependencies added | ✅ |
| Publication | Owner authorization, commit and deployment | ⚠ pending |
| Phone checks | Installed name/icon refresh after deployment, plus outstanding checks below | ⚠ pending |

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
5. After the Setward deployment is authorized and completed, confirm the installed app name and home-screen icon refresh to Setward while existing workout data remains available.
