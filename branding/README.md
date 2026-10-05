# Setward

**Forward, one set at a time.**

Setward combines “set” with the direction of “forward”: a workout log built around steady progress. Its angular S is made from two opposing, interlocking strokes. The open cut keeps the mark distinct at small sizes.

- `setward-mark.svg`: transparent purple mark.
- `setward-mark-mono.svg`: single-colour mark, using `currentColor`.
- `setward-preview.png`: name, logo and tagline together.
- The installed-app and touch icons are in `public/`.

The mark uses the app's existing purple/charcoal palette: #131217 background, #7a55e6 purple, #b39dff on dark backgrounds, and #ecebf2 primary text. Use Big Shoulders Display at weight 800 for the wordmark and Archivo for supporting text. Keep at least one stroke-width of space around the mark. Do not stretch it or close the cut between strokes.

The canonical geometry lives in `src/lib/brand.ts`; the React header and Canvas workout card share these paths. The PNG icons use the same paths on a 512-unit canvas, translated by (112, 96) and scaled by 3.2. The maskable icon has a fully opaque background and keeps the mark inside the central 80% safe circle.

This is a visual rename. The IndexedDB name (`chalk`), backup identifier (`chalk`), sync format (`chalk-sync/1`) and existing `/chalk/` deployment address remain stable so existing installations and backups keep working.
