# Stripes

The half-whole diminished scale (JGTH pp. 22–23) as the thing a guitarist
actually needs from it: a chord symbol becomes one of three *families*, and a
family is one striped picture on the neck. Phase 1 (Nov 2026) is Lookup and
the Conversion drill; brief in `briefs/stripes-build-brief.md`. Single
self-contained `index.html`, no dependencies, no browser storage. On the spine
in the Scales section between Fretboard and Scale practice (page order).

The page never calls anything "half-whole" or "whole-half". The words are
family, stripe, lit, dark, anchor, round, prompt. Never "card" or "deck".

## Engine (between `===== stripes engine =====` markers, headless)

Pitch classes 0–11, C = 0. Family `f` ∈ {0,1,2}:

| f | name (its four dominant roots) | collection `pc mod 3 ∈ {f, f+1}` | dark `pc mod 3 = f+2` |
|---|---|---|---|
| 0 | C · Eb · Gb · A | C Db Eb E Gb G A Bb | D F Ab B |
| 1 | Db · E · G · Bb | Db D E F G Ab Bb B | C Eb Gb A |
| 2 | D · F · Ab · B | D Eb F Gb Ab A B C | Db E G Bb |

The dark notes of each family are the dominant roots of another; each family
is two dim7 chords a half step apart. Family names use the fixed spellings
above (`NAMES`, flats throughout) and are never respelled per input. The
quick-pick root row says **F#, never Gb** (root CLAUDE.md rule for every root
ring), while the family name keeps the brief's Gb.

- Dominant root `r` → family `r mod 3`.
- Diminished root `d` (dim, dim7, °, °7, o, o7) → family `(d − 1) mod 3`.
  Spoken: "a half step below the dim root is the dominant root."
- Slash chords use the chord above the slash; the bass is ignored.
- Rejected with a one-line note, never silently mapped: `alt`, `b13`, `#5`,
  `+` → "This chord wants b13. That's the altered scale, not a diminished
  family."; `ø`, `m7b5`, `-7b5` → "Half-diminished isn't a diminished-scale
  chord."; anything else → "Not a dominant or diminished chord, so no
  diminished family."
- Fretboard: open-string pc `s`, fret `x` is dark iff `(s + x) mod 3 = f + 2`.
  Standard tuning gives three string groups with identical dark frets:
  E·G·e dark at `x ≡ f+1`, D·B at `x ≡ f`, A at `x ≡ f+2` (mod 3).
- Anchor rule (static text under every neck): dominant root = lower note of a
  lit pair; dim root = upper note.

`parse(text)` accepts root `A–G` + `#`/`b`/`♯`/`♭`, qualities `7 9 13` with
any combination of `b9 #9 #11 13` (parentheses and commas ignored), the six
diminished spellings, an optional `/bass`; case-insensitive. A base `9` with
`b9`/`#9`, or `13` with a `13` tail, is rejected as nonsense.

Chord tones are only the degrees the symbol names: `13` adds the 13 and not
an implied 9, because the natural 9 is a dark note in every family. A `9` or
`9#11` chord is accepted (the brief lists them) but its 9 is outside the
collection: it gets no dot, and the result line says so ("the 9 (A) is not in
the family — this scale gives the b9 and #9 instead"). The brief did not
address this case; William's to veto.

Degree labels: dominants `R b9 #9 3 #11 5 13 b7`; dim7 `R 9 b3 11 b5 b13 °7 7`.
The brief wrote `bb7`; the page writes **°7**, per the root rule that no
double flat appears anywhere (William, 2026-09-12).

## Lookup

Text field + quick-pick row (12 roots × `7 13b9 7#11 7#9 dim7 dim`); result
line (family in brass, conversion sentence in bone, rejection note in red);
SVG neck frets 0–15 or 0–24, 1st string on top, dark cells shaded one step
darker than the ground, lit frets bone dots, chord tones brass, the family's
four dominant roots ringed; "show string groups" relabels the nut `E·G·e /
D·B / A`; "note names on dots" shows pc names, chord tones by degree. Three
family thumbnails (6 strings × 12 frets) always visible, active one brass;
tapping one shows that family with no chord. No animation: redraw.

## Conversion drill

Levels 1–4 (plain 7s → dim7/°7 → mixed with extensions and enharmonic roots →
plus dim triads, slash chords and distractors, at most 1 in 4). 12 or 24
prompts; three family buttons, a fourth "Not this scale" at level 4; a plain
"7 of 12" count; response time measured silently from prompt render. After
each answer: Correct/Incorrect, the conversion sentence, the neck for the
correct family with chord tones in brass; advance on tap, space or enter;
keys 1–4 answer. Summary: accuracy, median response, slowest prompt type
(mean per type), every miss as `prompt → your answer → correct family`, Copy
summary (clipboard API with a textarea fallback). Hint toggle shows the three
thumbnails during the prompt. Nothing persists across reloads.

## Acceptance checklist

`node stripes/check.js` (or `?test=1` in the browser, logged to the console)
runs items 1–4 and 7 of the brief's checklist — 562 assertions — and prints
the full conversion table, the dark-fret lists per family and string, the
parser fixture (57 symbols) and the hand-checked degrees for G13b9, Bdim7 and
Db7#11. Items 5, 6 and 8 (no motion, 375 px drill round, OG tags and nav)
were checked by hand in the browser on 2026-11-06. The only transitions in
the file are the shared practice strip's panel slide, which is the suite's
block, not this page's, and is off under `prefers-reduced-motion`.

## Practice strip (Nov 2026)

Carries the shared bottom strip — see root `CLAUDE.md`, "Practice strip".
Synced from `arpeggios-deck` by `scripts/strip-sync.js`; never hand-edit the
copy. No Play of its own, so nothing to wire. **No Benchmarks list yet:**
the brief names none and benchmarks are William's to write
(`briefs/benchmarks.md`), so the button drops itself until he adds a
"## Stripes" section there and `scripts/benchmarks-sync.js` gets the heading.

## Deferred (brief, not built in phase 1)

- Mode 3, Structures: overlays on the lit neck for the two dim7 grips, the
  four major triads, four minor triads, four dominant 7 arpeggios, and a
  user-entered four-note cell transposed in minor thirds; handoff into Line
  Ladder.
- Mode 4, Through changes: progressions (blues with passing dims, rhythm
  changes bridge, leadsheet presets once the TUNES table exists) with every
  chord coloured by family.
- Audio playback of the collection / chord tones (Web Audio, suite scheduler).
- Left-handed fretboard mirror.
- Alternate tunings (drop D changes only the low string's group).
- Response-time trend across sessions (needs stored data; wait for the
  accounts decision).
