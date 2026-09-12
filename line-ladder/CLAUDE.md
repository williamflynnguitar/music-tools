# Line Ladder

Stand-alone improvisation line generator, instrument-neutral. The student
picks a progression (or types one), checks concepts, and climbs a smoothing
ladder; the app writes the line in concert pitch, engraves it (single staff,
key signature, no TAB, no fingerings), transposes parts at render time, and
runs a metronome. The handbook is one source among several: it is cited in
per-concept and per-preset `source` fields only, never in headings or chrome.

Files: `index.html` (engine + UI) plus plain `.js` concept packs in
`concepts/` loaded by `<script>` tags (`core.js`, `digital.js`). No build
step, no storage APIs, works from `file://`. Root `CLAUDE.md` conventions
apply, including the lookahead scheduler. Headless tests: `node check.js`.

## Pipeline

```
progression (preset or typed)
  → segment  one segment per chord: {ch, beats, at, cs: chordScale(ch)}
  → assign   Drill (one concept everywhere it applies; elsewhere the first
             applicable concept in REGISTRY order) or Mixed (seeded random
             per segment from the checked applicable set; locks pin a
             segment's concept across rerolls)
  → realize  concept degree string → written concert pitches, every segment
             starting from its degree 1 in the reference octave
  → smooth   enabled rungs, fixed order 1→4 (see ladder below)
  → range    rung 1's fold runs once more if enabled — rungs 2–4 may have
             re-left the range
  → engrave  in-app SVG (bars via toBars) + LilyPond source (lyExport)
```

Generation is always concert; `transposeBars`/`writtenFifths` transpose at
engrave time (B♭ +2/+2 fifths, E♭ +9/+3 fifths, bass = concert in bass
clef; flats preferred past 5 sharps). The **reference octave** is the C-to-B
octave containing the middle of the active range — C4–B4 for the guitar
(E3–B5 written) and neutral (A3–B5) presets, C3–B3 for bass (E2–G4).

## Concept registry

`window.LL_CONCEPTS` is an array of plain objects; the engine snapshots it
into `REGISTRY` at load. **Adding a concept = adding a data entry, never a
generator branch.** Registry order is the Drill fallback order — that is why
`digital-1235` sits first in `core.js` (a 2-beat chord in a Scale-run drill
must fall back to 1-2-3-5, reproducing the old Scale mode).

```js
{ id, name, short,                 // short is the bar label
  group,                          // checklist grouping by concept family
  source,                         // citation, shown only as a small info line
  tags,                           // metadata, not shown in v1
  applies: { qualities:[...], minBeats?, maxBeats? },
  degrees: [1,3,5,7],             // 1/3/5/7 = chord tones (against "chord"),
                                  // others index the collection; 9 = degree 2
                                  // an octave up, etc.
  against: "chord" | "scale",     // "scale" needs cs.steps, so it never
                                  // applies to º7 (chordScale returns {arp})
  rhythm: "eighths" | "eighths-hold" | "quarters",
  endpoint: null | {4:7, 8:3} }   // per-unit run endpoints (see templates)
```

Chord-tone pitches map through `ARPQ_TONES`: −6 is its own R–♭3–5–6
(William, 2026-09 — the 6 fills the "7" slot, so R–3–5–7 on Gm6 reads
G–B♭–D–E); plain 6 still borrows Δ7 as the old shape library did, 7sus4 the
dominant's 3rd.

## Rhythm templates (engine-owned; new rhythmic behavior is a new template)

Long chords split into units first: `unitPlan` peels 8-beat units, remainder
last (8→[8], 12→[8,4], 16→[8,8] — matching the old formulas).

- `eighths` — the degree string in straight 8ths over the whole segment;
  remaining 8ths **descend the collection stepwise** to the segment end
  (this fill is what makes `arp-up-scale-down` a data entry). No collection
  (º7) → the last note holds instead. A chord tone outside the collection
  (−6's natural 6 over harmonic minor) steps to the nearest collection tone
  in the walk's direction — `collStep`, shared with the approach rung.
- `eighths` + `endpoint` — the scale run, per unit: ascend from
  `degrees[0]`, turn, and land the unit's endpoint as a quarter on the last
  beat. 4-beat: 1..7 (7 the beat-4 quarter); 8-beat: 1..9 up, back down to
  3. Peak solves `p=(n−1+s+e)/2`; a non-integer or impossible peak falls
  back to a straight ascent.
- `eighths-hold` — per unit: pattern in 8ths, last note held to the unit
  end (the old 8~2, engraved so beat 3 shows). An 8-beat unit with a
  pattern a quarter of its slots mirrors: pattern up + held, pattern
  reversed + held — the old R-3-5-7 / 7-5-3-R.
- `quarters` — the degree string in quarters, last note held to the end.

A segment nothing applies to (or a hole a template can't fill) becomes
rests, beat-aligned by the same `decompose` used to split held notes at
barlines into tied pieces.

## Smoothing ladder

Each rung is a pure pass `(segments, per-segment events) → events`; order of
application is fixed 1→2→3→4 regardless of which are checked. After every
pass, whatever actually changed stamps the bars it touched with the rung's
mark — bar labels read `<short> <marks>`: `±8` fold, `inv` nearest start,
`→` approach, `7→3` seam. All off = raw (acceptance: every chord starts on
its own degree 1 in the reference octave, nothing folded).

1. **Fold to range** (`foldPass`) — any note outside the range moves an
   octave inward, per note. Replaces the old octave-displacement /
   12th-fret rules. Runs again after rungs 2–4 (the pipeline's range stage).
2. **Nearest chord-tone start** (`nearPass`) — rotate the degree string
   (inversion, wrapped degrees up an octave) and pick rotation + octave so
   the segment starts on the chord tone nearest the previous note.
   Candidates that keep the whole segment inside the range win outright, so
   the later fold rarely has to break a shape. Run/endpoint concepts don't
   rotate — they re-anchor their start octave only.
3. **Stepwise approach** (`approachPass`) — a segment-ending note held from
   beat 3 (dur ≥ 4 slots) shortens to beat 3, and beat 4 walks the
   segment's collection in two 8ths into the next segment's first note —
   whenever that target sits exactly three scale steps away, in either
   direction (the old rule was descending only; the target is whatever
   rung 2/4 chose). º7 has no collection and never approaches. A held note
   outside the collection (−6's 6) walks too: its first step is `collStep`'s
   nearest collection tone.
4. **Dominant seam 7→3** (`seamPass`) — a dominant resolving down a fifth
   ends on its ♭7 (re-rotating the pattern if its degrees hold a 7) and the
   next segment starts on its 3rd (rotation, or start-degree override for
   runs), octave chosen for voice-leading proximity with only a soft range
   penalty. Overrides rung 2's start for that seam only; a stale rung-3
   walk into the old start is stripped. Chained dominants: a segment
   already re-seamed keeps its 3rd start (no re-rotation to ♭7).

## Progressions

`PROGRESSIONS` keeps the old data structure (`{root, q, beats, ext?, fn?}`,
annotations built into the cycles, tunes parsed at load). Presets are named
by what they are; `source` fields carry the citations and are not rendered.
Typed changes (`parseProg`, shared with the tune texts): chords separated by
spaces, `|` for barlines, `/` repeats the chord for another beat; 1 chord =
4 beats, 2 = 2+2, any `/` or >2 chords = one beat per token, bars must sum
to 4; identical whole bars merge to 8/12/16-beat chords; `@` annotations as
before (`Cm7@ii/Bb`, `G7b9@v/Cm`, `Ab7#11@iv/Ebmel`, `F7@sec`, `Bbm7@own`).
The chord-symbol parser is the local copy of the Chartwright/Box Buddy
parser — still to be consolidated when the shared-file refactor happens.

Chord scales are unchanged: parent scale rotated to the chord root,
harmonic-minor parents in minor keys, melodic-minor parents labeled
parent-first, quality fallback flagged †. See `annotations-worksheet.md`
for William's rulings. All 14 tunes are now annotated — ATTYA, Blue Bossa
and Mr. P.C. from William's worksheet pass; the other 11 applied from his
rulings (2026-09, pending his review), with the blues tunes mirroring the
annotated blues presets and local ii–V arrivals tagged `@I` of the local
key. check.js asserts every progression builds flag-free, which validates
each annotation's degree against the chord root.

## Minor spelling

A minor tonic is written on whichever side its harmonic minor needs no double
accidental (`minorName`): D♯ and G♯ minor want C× and F× for the raised 7th, so
those regions are E♭ and A♭ — the two minor cells of *Tonal progressions* read
Fø7 B♭7♭9 E♭−6 and B♭ø7 E♭7♭9 A♭−6, and the whole-step minor cycle's A♭ cell
matches its own key label at last. D♭ and G♭ minor want doubles the other way,
so they stay C♯ and F♯. Scales come out letter-by-letter from the root
(`byDegree`) and fall back to the old borrow-from-the-relative-major only when
that needs a double.

`fromRoot` keeps a chord symbol and its scale on the same side. A♭7♭9 is the
one chord where that costs a double — its ♭9 really is B♭♭, and it is the only
one left anywhere in the app (concert and bass parts; B♭ and E♭ respell it to
C♭ and G♭). A spelling that would want two doubles is the outlier instead, so
a typed G♭m6 still draws F♯ harmonic minor. A typed D♯m6 or G♯m6 now gets the
sharp spelling it asked for, C×/F× and all, rather than a silent respelling.

## Engraving and export

`engrave` renders a single staff on the LilyPond glyph outlines: key
signature every system (courtesy accidentals carry across barlines and
systems — a letter altered in one bar re-marks its return), eighths beamed
in fours from beats 1 and 3, beat 3 always visible, rests to the beat,
chord symbols left-aligned and not restated unless changed, numeric 4/4,
bar number under every bar. Bass clef and rests are hand-drawn paths. No
TAB staff, no fingerings, no moving cursor during playback (bar rects exist
only as Mixed-mode lock targets — brass stroke when locked). `lyExport`
keeps the Argue head; parts wrap in `\transpose c d` / `\transpose c a`,
bass gets `\clef bass`, `\key` from the key selector.

## Metronome

Lookahead scheduler verbatim (25 ms interval / 130 ms lookahead): clicks on
2 and 4, count-in of 0/1/2 bars as quarter clicks (bar starts accented),
optional loop, space toggles. The line itself is not sounded.

## Open questions for William (carried over)

- 12/16-beat chords keep the old unit split ([8,4] / [8,8]) — never ruled on.
- Non-diatonic dominants (`fn:"sec"`) keep own Mixolydian, own Phrygian
  dominant with a ♭9 — assumption.
- Minor-i variants: −6/−Δ7 → own harmonic minor — assumption. Since the −6
  arpeggio now carries a natural 6, harmonic minor's ♭6 sits against it in
  scale fills and approach walks.

## Deferred (do not build until asked)

TAB post-pass · MUSC 120 grouping view (tags are already in the schema) ·
handout-cell pack · etude assembly / weighted fill / lick journal ·
strict-handout mode.

## Old engine

The position-based engine (VDA, fingerings, TAB) lives in git history —
last version at tag-less commit d7b72bf. The rebuild reproduces its degree
strings and rhythms exactly (checked against it: 100% match in scale mode,
98%+ pitch-class match in arp mode); octave contours differ where they
depended on fretboard positions, which are gone by design.
