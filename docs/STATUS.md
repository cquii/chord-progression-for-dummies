# Status & next session

**As of 2026-06-05 — implemented v1.0.0.** Full engine + UI built, packaged `.ablx` ready.

## Done

- Builds (Node 24): `npx tsc --noEmit` (0) → production bundle 58 kb → `.ablx` packaged.
- **Engine** (`src/interface.html`): scale+mode → chords; `{degree,bars}[]` templates →
  notes; resolved `Feel` (articulation/density/gate/swing/velocity/dynamics/octaves/
  humanize); chord naming. Validated headless across all 24×8 genre×mood combos + 30
  variations (222 cases, 0 NaN/range errors).
- **Content**: 24 genres (tone + barScale + chars + base voicing), 8 moods (feel + char
  weighting), 18 templates + random diatonic fallback, 7 modes.
- **UI**: searchable genre list, favorites pinned, mood chips, key + mode pickers, result
  cards (width ∝ bars), Variation / Listen / Save / Generate.
- **Favorites**: host reads/writes `${storageDirectory}/favorites.json`; dialog returns the
  full favorites state; genres pin to top; progressions saved + recallable in the Favorites
  panel.
- **Preview**: Web Audio synth, per-genre tone preset (piano/EP/pad/pluck/synth).
- **Advanced** drawer: articulation, voicing, octaves, density, gate, swing, intensity,
  humanize + best-effort ADSR (host sets named Attack/Decay/Sustain/Release if the slot's
  instrument exposes them; silently skipped otherwise).

## Possible follow-ups

- Publish to GitHub public like the other two (`vendor/*.tgz` gitignored, MIT added).
- Author more bespoke templates per genre×mood (current selection is char-based with a
  shared template library — works, but more hand-tuned pools would add variety).
- Tune feel constants by ear in Live.

## How to resume

```bash
cd /Users/d/git/chord-progression-for-dummies
nvm use 24            # or: . "$HOME/.nvm/nvm.sh"; nvm use 24
npm install
npm start             # needs Live 12 Beta open + Developer Mode ON, .env set
```
Read `docs/DECISIONS.md` first — it is the source of truth for every choice.
