# ADR-001: Keep editor drafts in `kv` instead of blocking navigation

- **Date:** 2026-10-04
- **Status:** Accepted
- **Tasks:** UX-001 (REQ-Q01)

## Context
The routine editor (`RoutineEdit`) and the past-workout editor (`EditWorkout`) keep changes in React state until **Save**. Any other exit throws them away without asking:
- Android's system back gesture (the owner uses Android),
- tapping an exercise name inside the editor, which is a link to the exercise page,
- closing the tab, or the OS killing the installed app.

The live workout doesn't have this problem because it writes every change to `kv` (NN-04).

## Options considered
1. **Confirm on the in-app Back button only.** Simple, but it misses the gesture, links and app kills, which are the common cases on a phone.
2. **Block navigation in the hash router.** Push a guard history entry and confirm on `popstate`. It has to fake history entries, gets the depth accounting in `goBack()` wrong after a save, can't stop the app being killed, and puts every navigation path at risk.
3. **Persist drafts.** Write the editor state to `kv` under `draft:<kind>:<id>` on every change, the way the live workout does. Restore it when the editor opens, with a bar offering **Discard**. Ask before discarding only on the in-app Back button, where leaving is clearly intended.

## Decision
Option 3.

## Consequences
- No exit loses edits. Reopening the editor brings them back with a visible "Unsaved changes · Discard" bar.
- Drafts are per device and never synced. `kv` isn't synced, and the sync trigger only watches the four data tables. **Erase all data** clears them along with the rest of `kv`.
- A draft is deleted when it matches the saved version again, on Save, and on Discard. A draft for a routine that was deleted elsewhere is left behind in `kv` (a few kB at most). Deleting a routine from its own editor clears its draft.
- If the routine changes on another device while a draft exists, **Save** overwrites it with the draft, as before. The user is saving deliberately.
- The exercise form isn't covered. It's short, and leaving it costs little.

## Rejected
- Option 2: too fragile for a core navigation path (NN-12), and it still can't survive the app being killed.
