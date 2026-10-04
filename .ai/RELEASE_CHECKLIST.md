# Release checklist

For merging `quality-pass` into `main` (REL-100). Pushing `main` deploys to the live app (NN-15).

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
