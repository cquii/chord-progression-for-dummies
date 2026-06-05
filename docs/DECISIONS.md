# Decisions

Locked design decisions from the planning session. Each is a settled choice; change
here first, then in code.

## Product

- **D1 — Standalone extension.** New project `chord-progression-for-dummies`, separate
  from the existing `chord-progression` extension. Own manifest, repo, `.ablx`.
- **D2 — Goal.** A simpler, prettier chord generator than v1. The default UI shows only
  friendly choices; everything technical is hidden behind an **Advanced** button.
- **D3 — Entry point.** Right-click an empty **Session** clip slot →
  *"Chord Progression for Dummies…"*. Writes a MIDI clip into that slot (replaces any
  existing clip), named by key + mode + genre + roman numerals.

## Core controls (the pretty front)

- **D4 — Genre.** A **big, searchable list** (~20+) with a **Favorites section pinned at
  the top**. Each genre carries its own progression-template pool and groove/feel
  defaults.
- **D5 — Mood (8).** Happy, Sad, Dark, Dreamy, Energetic, Chill, Romantic, Epic. Mood
  drives the **feel** (swing, gate, velocity + dynamics, density, octave, ADSR-feel) and
  **weights which templates** are picked. Mood is independent of musical mode.
- **D6 — Key + Mode, up front.** A root-note picker (C … B) **and** a mode picker
  (Major / Minor / richer modes) are both visible in the main UI. Harmony is the user's
  explicit choice. Root defaults to Live's current root.
- **D7 — Variation.** One click cycles through the template pool for the current
  genre + mood (plus a random diatonic fallback), like v1's Variation.

## Generation model

- **D8 — Progression templates.** For each *genre × mood* there is a **pool of templates**.
  A template is an ordered list of `{ degree, bars }` entries. **Both the chord count and
  each chord's bar-length vary** by genre + mood (a chord may be 1, 1.5, or 2 bars, and
  lengths may differ within one progression).
- **D9 — Feel is derived, not asked.** Genre + mood + variation deterministically set
  swing, gate, velocity + a dynamics curve, density/rhythm pattern, articulation, octave,
  and humanize. The user never sees these unless they open Advanced.
- **D10 — Clip length.** Sum of the template's bars × beats-per-bar (4/4). MIDI written via
  `clipSlot.createMidiClip(lengthBeats)` then `clip.notes = NoteDescription[]`.
- **D11 — Tempo.** Never change Live's song tempo. Read it only for swing math and preview.

## Advanced panel

- **D12 — Everything from v1 lives here.** Articulation, octaves, resolution, gate, swing,
  intensity, humanize, notes/tensions — all overridable, pre-filled from the genre/mood
  defaults. Opening Advanced reveals them; the default UI hides all of it.
- **D13 — ADSR (best-effort, Advanced only).** The SDK can't control instrument envelopes
  from a clip generator. If — and only if — the track's instrument exposes device
  parameters literally named `Attack` / `Decay` / `Sustain` / `Release`, the mood's
  ADSR-feel sets them; otherwise it is silently skipped. Never shown as a technical control
  up front; it is one toggle inside Advanced.

## Favorites (persistent)

- **D14 — Persistence.** Stored as JSON in `context.environment.storageDirectory` (survives
  across Live sessions).
- **D15 — What's favoritable.** (a) **Genres** — starring pins them to the top of the list.
  (b) **Whole progressions** — starring saves the progression with its genre, mood, key,
  mode and feel.
- **D16 — Recall.** A **Favorites panel** lists saved progressions; from it the user can
  preview and re-generate one straight into Live.

## Preview

- **D17 — Web Audio with per-genre tone.** In-dialog audition uses a built-in browser synth
  with selectable tones (piano, EP, pad, pluck, synth) **auto-matched to the genre/mood**,
  and applies the feel (swing/gate/dynamics) so it sounds accurate.
- **D18 — No real-time plugin audition.** The dialog is a modal webview; the SDK has no
  transport control and no real-time MIDI send, so it cannot play the user's Live plugin
  while open. To hear it through their own instrument, the user generates the clip and
  presses play in Live. (Re-evaluate if the SDK adds transport / real-time MIDI.)

## Tech

- **D19 — Stack.** TypeScript + esbuild (HTML inlined via the `.html` loader),
  `@ableton-extensions/sdk` 1.0.0-beta.0 vendored in `vendor/`, Node ≥ 24.14.1, `.ablx`
  via `extensions-cli package`. Live context (root/scale/tempo) injected into the dialog
  through a single `__LIVE_DATA__` token.

## Known SDK constraints that shaped the above

No transport/play, no real-time MIDI send (→ D18). No instrument-envelope API except
named device parameters (→ D13). See the sibling repos' notes and the SDK capability audit.
