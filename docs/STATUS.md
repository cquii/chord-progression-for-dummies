# Status & next session

**As of 2026-06-05 — scaffold v0.1.0.** Planning + docs done; real engine/UI not built yet.

## Done

- Project scaffold builds (Node 24): `npm install` → `npx tsc --noEmit` (0) → `npx tsx build.ts` (36 kb).
- Loads in Live: context-menu **"Chord Progression for Dummies…"** on an empty Session
  clip slot, opens a placeholder dialog.
- Design fully captured: [DECISIONS.md](DECISIONS.md), [DESIGN.md](DESIGN.md),
  [CONTENT-MODEL.md](CONTENT-MODEL.md).
- Git initialised locally (not pushed). `vendor/*.tgz` untracked (Ableton beta SDK, not
  redistributable) but kept on disk for `npm install`.

## Not started (next session)

1. **Engine** in `src/interface.html`: scale+mode → chords; `Template` (`{degree,bars}[]`)
   → notes; apply resolved `Feel`; chord naming. (Port the proven note-layout from the
   sibling `chord-progression` v1.)
2. **Content** (`CONTENT-MODEL.md`): genre list (~24) with `baseFeel` + per-mood template
   pools; 8-mood feel deltas; mode interval table.
3. **UI**: searchable genre list with pinned favorites; mood row; key + mode pickers;
   result cards (width ∝ bars); Variation / Listen / Save / Generate.
4. **Favorites**: host reads/writes `${storageDirectory}/favorites.json`; dialog returns a
   `favoritesPatch`; Favorites panel (genres pinned + progressions recall/re-generate).
5. **Preview**: Web Audio synth with per-genre tone presets (piano/EP/pad/pluck/synth).
6. **Advanced** drawer: v1 controls + best-effort ADSR (only if instrument exposes
   Attack/Decay/Sustain/Release params).

## Open questions for next time

- Publish to GitHub public like the other two? (If yes: `vendor/*.tgz` already gitignored,
  add MIT — done — and `gh repo create`.)
- Exact final genre list + which moods get bespoke template pools vs generic fallback.

## How to resume

```bash
cd /Users/d/git/chord-progression-for-dummies
nvm use 24            # or: . "$HOME/.nvm/nvm.sh"; nvm use 24
npm install
npm start             # needs Live 12 Beta open + Developer Mode ON, .env set
```
Read `docs/DECISIONS.md` first — it is the source of truth for every choice.
