# Content model

The genre / mood / template / feel data that drives generation. This is the part that gets
authored and tuned over time. Types are in [DESIGN.md](DESIGN.md).

## Genres (starter list — big + searchable)

Curated, grouped for the search list. Tweak freely; each needs a `baseFeel` + template pools.

| Group | Genres |
| --- | --- |
| Pop / Rock | Pop, Rock, Indie, Folk/Acoustic, Country |
| Urban | Trap/Hip-Hop, R&B/Soul, Funk, Reggaeton/Latin, Afrobeat |
| Electronic | House, Deep House, Techno, Trance, Synthwave, Future Bass, Dubstep, Drum & Bass |
| Jazz / Roots | Jazz, Blues, Gospel |
| Screen | Cinematic/Score, Ambient, Lo-Fi |

~24 genres. Favorites pin the user's picks to the top so the list stays fast to use.

## Moods (8) — feel deltas

Mood is applied **on top of** a genre's `baseFeel`. Values are intent, to be tuned by ear.

| Mood | swing | gate | velocity | dynamics | density | articulation lean | octaves | template lean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Happy | light | medium | high | medium | normal | block/strum | 1–2 | bright, major-leaning degrees |
| Sad | none | long | low-med | low | sparse | block | 1 | minor, descending |
| Dark | none | medium | med | low | normal | stabs | 1 | minor, b2/b6 colour |
| Dreamy | light | long | low | low | sparse | pad/arp | 2 | wide, suspended |
| Energetic | medium | short | high | high | busy | stabs/arp | 2 | driving, repeated roots |
| Chill | medium | medium | low-med | medium | normal | strum | 1–2 | smooth, ii–V motion |
| Romantic | light | long | med | medium | normal | block/arp | 1–2 | maj7/min7 rich |
| Epic | none | long | high | high | normal→busy | block→arp build | 2–3 | big I–VI–IV, octave stacks |

## Templates

A template is `{ degree, bars }[]`. `bars` may be `1`, `1.5`, `2`, etc. and may vary within
the progression. `degree` is 0-based into the chosen scale (key + mode).

Examples (illustrative — real pools live in code, several per genre × mood):

```ts
// Lo-Fi · Dreamy — long, hazy, 2-bar chords
[ {degree:0,bars:2}, {degree:5,bars:2}, {degree:3,bars:2}, {degree:4,bars:2} ]   // i VI iv v

// Pop · Happy — classic 4-chord, 1 bar each
[ {degree:0,bars:1}, {degree:4,bars:1}, {degree:5,bars:1}, {degree:3,bars:1} ]   // I V vi IV

// Jazz · Chill — ii–V–I with a turnaround, mixed lengths
[ {degree:1,bars:1}, {degree:4,bars:1}, {degree:0,bars:2}, {degree:5,bars:1}, {degree:1,bars:0.5}, {degree:4,bars:0.5} ]

// Cinematic · Epic — long, building
[ {degree:0,bars:2}, {degree:5,bars:2}, {degree:3,bars:2}, {degree:4,bars:1}, {degree:4,bars:1} ]
```

Chord voicing (triad vs 7th/tensions) comes from the resolved `Feel`/Advanced, not the
template — the template is purely harmonic motion + rhythm length.

## Mode → scale intervals

Key picker = root note. Mode picker selects the interval set used to realise each `degree`:

```ts
const MODES = {
  Major:      [0,2,4,5,7,9,11],
  Minor:      [0,2,3,5,7,8,10],   // natural minor
  Dorian:     [0,2,3,5,7,9,10],
  Phrygian:   [0,1,3,5,7,8,10],
  Lydian:     [0,2,4,6,7,9,11],
  Mixolydian: [0,2,4,5,7,9,10],
  HarmonicMinor: [0,2,3,5,7,8,11],
};
```

Major/Minor are the friendly defaults; the rest are available in the mode picker for users
who want them. Mood does **not** change the mode (D6) — it only weights template choice and
feel.

## Authoring workflow

1. Define each genre's `baseFeel` + tone preset (DESIGN preview).
2. Write 3–6 templates per *genre × mood* the genre supports (not every mood needs a
   bespoke pool — fall back to a generic pool + mood feel delta when thin).
3. Tune feel values by ear against the Web Audio preview.
4. Keep degrees diatonic to the chosen mode so any key + mode stays musical.
