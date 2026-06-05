# Design

How the pieces fit. Pairs with [DECISIONS.md](DECISIONS.md) (the *what*) and
[CONTENT-MODEL.md](CONTENT-MODEL.md) (the genre/mood/template data).

## Architecture

```
ClipSlot right-click
        │  context-menu command  (cpfd.open)
        ▼
extension.ts (host)
        │  reads song.rootNote / scaleIntervals / tempo
        │  loads favorites from environment.storageDirectory
        │  injects { live, favorites } into the dialog via __LIVE_DATA__
        ▼
interface.html (modal webview) ── single source of truth for music + feel
        │  user picks genre · mood · key · mode · variation
        │  engine builds the progression + notes, renders cards, previews (Web Audio)
        │  star → favorites ;  Generate → postMessage
        ▼  { action:"generate", notes, lengthBeats, clipName, favoritesPatch? }
extension.ts ──► clipSlot.createMidiClip(lengthBeats); clip.notes = notes
              └► persist favorites patch to storageDirectory
```

All music + feel logic lives in the webview so the **preview and the written clip always
match** (same lesson as v1). The host only: reads Live context, persists favorites, and
writes the clip.

## Why the engine is client-side

`showModalDialog` returns one string and closes. The webview owns generation; the host
just executes the returned notes. Favorites need the host (filesystem), so the dialog
returns a `favoritesPatch` describing adds/removes that the host writes to disk. On open,
the host injects the current favorites alongside the Live context.

## Module map (src/, target layout)

- `extension.ts` — host: command, Live context, favorites IO, clip writing.
- `interface.html` — the whole UI + engine. As it grows, split the inline script into
  logical sections (kept in one file because the dialog loads from a data URL):
  - **theme/layout** (CSS)
  - **engine**: scale → chords, template → notes, feel application, naming
  - **content**: genre list + per genre/mood feel + template pools (see CONTENT-MODEL)
  - **state + UI**: pickers, variation, advanced panel, favorites panel
  - **preview**: Web Audio with per-genre tone presets
  - **host bridge**: `__LIVE_DATA__` in, `close_and_send` out

## Data model (engine types)

```ts
type Degree = number;                 // 0-based scale degree
type ChordSpec = { degree: Degree; bars: number };   // bars ∈ {1, 1.5, 2, …}
type Template = ChordSpec[];          // one progression; length + per-chord bars vary

type Feel = {
  swing: number;        // 0..0.5 of a step delayed on off-beats
  gate: number;         // 0..1 fraction of step/bar that the note sounds
  velocity: number;     // base 1..127
  dynamics: number;     // 0..1 spread of the velocity curve across the bar
  density: "sparse" | "normal" | "busy";
  articulation: "block" | "strum" | "stabs" | "arp";
  octaves: 1 | 2 | 3;
  humanize: boolean;
  adsr?: { attack: number; decay: number; sustain: number; release: number }; // 0..1, best-effort
};

type GenreId = string;                // e.g. "lofi"
type MoodId =
  | "happy" | "sad" | "dark" | "dreamy"
  | "energetic" | "chill" | "romantic" | "epic";

type GenreDef = {
  id: GenreId;
  name: string;
  tags: string[];                     // for search
  baseFeel: Feel;                     // genre default, before mood
  templates: Partial<Record<MoodId, Template[]>>;  // pool per mood (fallback to generic)
};
```

Resolution order for a generation:

1. Pick **genre** → `baseFeel` + template pool.
2. Apply **mood** → a `moodModifier` adjusts the feel and weights/filters templates.
3. **Variation** index → choose a template from the (genre, mood) pool (wrap; last = random
   diatonic).
4. Build chords from **key + mode** (root + chosen scale intervals) for each `degree`.
5. Lay out notes per `ChordSpec.bars` and the resolved `Feel`.
6. Advanced overrides replace any resolved `Feel` field the user touched.

## Note layout

Per chord: start = running bar offset (in beats); duration = `bars * beatsPerBar * gate`.
Articulation decides whether the chord is one block, strummed, retriggered stabs, or
arpeggiated across the chord's bars. Swing shifts off-beats; dynamics shape velocity across
the bar; humanize jitters timing/velocity and sets `velocityDeviation`. Same primitives as
v1, just driven by `Feel` instead of raw controls.

## Favorites

```ts
type FavGenre = GenreId;
type FavProgression = {
  id: string;             // uuid
  name: string;           // e.g. "Cm · Lo-Fi · Dreamy · i-VI-III-VII"
  genre: GenreId; mood: MoodId;
  root: number; mode: string;
  template: Template;
  feel: Feel;             // resolved feel snapshot
  createdAt: number;
};
type FavoritesFile = { genres: FavGenre[]; progressions: FavProgression[] };
```

Stored at `${storageDirectory}/favorites.json`. Host reads on open, writes on the
`favoritesPatch` returned with any dialog result (including plain "save" closes).

## Preview (Web Audio)

A small synth with a handful of tone presets (piano, EP, pad, pluck, synth). Genre/mood
maps to a default tone (e.g. Lo-Fi→EP, Cinematic→pad, House→pluck). The preview runs the
**same note list** the engine would write, scheduled at Live's tempo, with an envelope per
tone. No Live audio engine involved (see D18).

## UI layout (target)

```
┌ Chord Progression for Dummies ───────────── Cmaj · 120 BPM ┐
│  [ search genres…                          ]               │
│  ★ Favorites:  Lo-Fi   House   …                           │
│  Genres grid (scroll):  Pop  Rock  Lo-Fi  House  …         │
│                                                            │
│  Mood:  Happy Sad Dark Dreamy Energetic Chill Romantic Epic│
│  Key:  [C ▾]   Mode: [Minor ▾]                             │
│                                                            │
│  RESULT cards (1..N, widths ∝ bars)                        │
│     i        VI        III       VII                       │
│    Cm       A♭       E♭        B♭                          │
│                                                            │
│  [↻ Variation]  [▶ Listen ▾tone]  [★ Save]  [Generate]     │
│  [ ⚙ Advanced options ]                                    │
└────────────────────────────────────────────────────────────┘
```

Advanced is a collapsible drawer holding the v1 controls + the ADSR toggle, all pre-filled
from the resolved `Feel`.
