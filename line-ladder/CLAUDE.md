# Line Ladder

Stand-alone improvisation line generator, instrument-neutral. The student
picks a progression (or types one), checks concepts, and climbs a smoothing
ladder; the app writes the line in concert pitch, engraves it (single staff,
key signature, no TAB, no fingerings), transposes parts at render time, and
runs a metronome. The handbook is one source among several: it is cited in
per-concept and per-preset `source` fields only, never in headings or chrome.

Files: `index.html` (engine + UI) plus plain `.js` concept packs in
`concepts/` loaded by `<script>` tags, in this order: `core.js`, `digital.js`,
then concept pack 2 — `cells.js`, `ways.js`, `routine.js`. Registry order is
the Drill fallback order, and pack 2 loads last so the fallback did not change
(still 1-2-3-5 on a 2-beat chord, R–3–5–7 elsewhere; `check.js` §12). No build
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
  subgroup?,                      // folds under a sub-heading inside its group
  optIn?: true,                   // starts unchecked in Mixed (all of pack 2)
  applies: { qualities:[...], minBeats?, maxBeats?,
             rows?: [{qualities, offsets, label}],   // realized-tones guard
             next?: {motion, qualities?} },          // what it must move to
  degrees: [1,3,5,7],             // 1/3/5/7 = chord tones (against "chord"),
                                  // others index the collection; 9 = degree 2
                                  // an octave up, etc. Zero and negatives
                                  // reach under the root: 0 is the 7th below
                                  // degree 1, -1 the 6th below (degBase is a
                                  // floor-mod), so 5-3-1-7 falling is [5,3,1,0]
  fixed?: true,                   // never rotated; rungs move it by octaves
  lands?: 3 | 5,                  // rung 4: the next segment starts here
  against: "chord" | "scale",     // "scale" needs cs.steps, so it never
                                  // applies to º7 (chordScale returns {arp})
  rhythm: "eighths" | "eighths-hold" | "quarters",
  endpoint: null | {4:7, 8:3} }   // per-unit run endpoints (see templates)
```

The four pack-2 schema features are generic — none names a concept:

- **`fixed`** — the order of the notes is the concept (a permutation, a Way),
  so rotation would turn it into a different one. Rung 2 and rung 4 re-anchor
  its octave only, down the path run/endpoint concepts already take.
- **`applies.rows`** — `matchRow` realizes the concept's *unrotated* degrees
  against the segment, reduces them to semitone offsets from the chord root
  mod 12, and needs one row to match both the quality and the offsets in
  order. When present it replaces `applies.qualities`. One entry covers several
  lines of a published table and refuses every case the table does not list.
  `buildLine` returns the matched row per segment (`line.rows`); the checklist
  prints its `label` under the concept ("here: 5-6-♭7-9"), because the same
  entry reads differently over different chords.
- **`applies.next`** — the concept needs a following segment whose root is
  `motion` semitones up and, if given, whose quality is listed. `appliesTo`
  takes the next segment as a third argument; every caller passes it.
- **`lands`** — see rung 4.

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
`→` approach, `7→3` seam landing on a 3rd, `→5` seam landing on a 5th. All
off = raw (acceptance: every segment's first note is its concept's
`degrees[0]` relative to the chord root in the reference octave, nothing
folded). A mark is stamped on the bar a changed note *begins*
in; the tied remainder of a held note in the next bar carries none.

1. **Fold to range** (`foldPass`) — any note outside the range moves an
   octave inward, per note. Replaces the old octave-displacement /
   12th-fret rules. Runs again after rungs 2–4 (the pipeline's range stage).
2. **Nearest chord-tone start** (`nearPass`) — rotate the degree string
   (inversion, wrapped degrees up an octave) and pick rotation + octave so
   the segment starts on the chord tone nearest the previous note.
   Candidates that keep the whole segment inside the range win outright, so
   the later fold rarely has to break a shape. Run/endpoint and `fixed`
   concepts don't rotate — they re-anchor their start octave only.
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
   **`lands` generalizes the seam**: after a segment whose concept carries
   `lands: 3 | 5`, the next segment starts on that degree in the octave
   nearest this segment's last sounding note, by the same mechanisms
   (rotation, start-degree override for runs, nothing if it already starts
   there). A `lands` concept says where its own line goes, so nothing is
   re-rotated to a ♭7 for it. A `fixed` next concept that starts elsewhere
   leaves the seam alone, unmarked; a `fixed` dominant that does not already
   end on its ♭7 offers no 7→3. Marks: `7→3` when the landing is a 3rd, `→5`
   when it is a 5th (`seam` / `seam5` in `marks`). With rung 4 off `lands`
   does nothing.
   A start a seam has claimed is tracked in `pinned`, not read off the change
   marks (Sep 2026): when rung 2 had already put the V on its 3rd, the seam
   changed nothing and stamped nothing, and the *next* seam then rotated the
   V back to end on its ♭7 — undoing a Way in, and breaking the chained-
   dominant rule above for the old concepts too (the bridge of rhythm
   changes). Fixing it changed 256 of 26,400 old-concept builds, all with
   rung 4 on; everything else in pack 2's engine work is output-neutral.

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

`fromRoot` keeps a chord symbol and its scale on the same side. A♭7♭9 is the one
chord where that costs a double: its ♭9 is strictly B♭♭, so `single` respells it
A♮ — the ordinary lead-sheet compromise. A letter wanting two doubles is the
outlier instead, so a typed G♭m6 still draws F♯ harmonic minor.

**No double accidental is written anywhere** (William, 2026-09-12). `single`
rewrites any ♭♭ or × to the single-accidental name of the same pitch, on the side
it was heading. The producers that could reach one are all guarded: `byDegree`
runs off the end of the alphabet on the outlier keys, `hmSpell`/`mmSpell` fall
back to `sideFor`'s clean side rather than raising an already-sharp leading tone
(the old `raiseName` turned C♯ into C×), and `fromRoot` respells its one. The
LilyPond export transposes through `transposeNote` instead of a `\transpose`
wrapper — LilyPond transposes by interval and keeps letters, so a concert A♯, E♯
or B♯ came out of `\transpose c a` as a double sharp even when the screen was
clean. `check.js` asserts the source carries no `\transpose` and no `eses`/`isis`.

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

## Concept pack 2 (Sep 2026)

Brief: `briefs/line-ladder-concept-pack-2.md`. Source: William's
*Introduction to Jazz Guitar* (2014) — 1-2-3-5 placements and permutations
(p. 59), Mike Steinel's "Three Ways In, Two Ways Out" (Appendix E, pp. 84–85),
the four components of Stan Smith's Scale/Arpeggio Routine (Appendix F, p. 86).
Every degree string was re-read against the rasterized pages. 38 entries; the
registry holds 46 (the brief counted 47 — core + digital are 8, not 9).

- **D1. Placements obey the chord-scale rulings.** "1-2-3-5 on the 9th of
  maj7" needs a ♯11, so it fires on `@IV` and is silent on `@I`. "5th of tonic
  minor" fires only on a melodic tonic (`@i/Cmel`, Solar) — the cycles rule −6
  as harmonic minor. "♭5 of ø" fires only on a Locrian ø (vii of major); a ii
  of minor fails. "9th of dominant" and both altered rows need melodic-minor
  annotations. An *imposed* mode that ignores the rulings is deferred. When a
  drilled concept fires nowhere, the sub line under the title says so.
- **D2. Ways use `eighths-hold`.** Four eighths on a 2-beat chord, as printed;
  on a 4-beat chord the fourth note holds through beats 3–4 and then resolves.
- **D3. Ways Out fire on any `7` whose next chord is a fourth up,** whatever
  its quality. Ways In: a m7 whose next chord is a dominant a fourth up.
- **D4. Permutations and placements run 2–4 beats** (`eighths-hold`);
  `digital-1235` stays 2-beat `eighths` because the Drill fallback depends on
  it. So none of them fires on a merged 8-beat chord.
- **D5. The assembled routine is not built** — the four components ship as
  separate concepts, each at its exact beat length.
- The book's ♭5-of-ø line prints its tones as ♭3-4-♭5-♭7, repeating the minor
  column; the row uses the corrected ♭5-♯5-♭7-♭9 (F G A C on Bø).
- The brief gave routine-1/2 the bar labels `→5` / `→9`, and rung 4 the mark
  `→5`. One bar could then read "→5 →5", so the labels are `sc→5` / `sc→9`
  (`check.js` §12 asserts no label reads as a rung mark).
- Checklist: groups fold (`<details>`, open state in `st.open`), all / none on
  each heading in Mixed, a shared citation printed once under the heading.
  Pack-2 groups start folded and unchecked (`optIn`), so the default Mixed
  draw is what it was — 23 permutations would otherwise swamp it.

**Questions for William:**
1. p. 86's text says components 1 and 2 repeat and 3 and 4 play once; the
   notation repeats 1 and 3 and plays 2 and 4 once. The notation is six bars
   plus the landing whole note, which does agree with the text's "6-bar
   phrase". The assembled routine follows whichever is right.
2. The ♭5-of-ø correction above — confirm.

## Open questions for William (carried over)

- 12/16-beat chords keep the old unit split ([8,4] / [8,8]) — never ruled on.
- Non-diatonic dominants (`fn:"sec"`) keep own Mixolydian, own Phrygian
  dominant with a ♭9 — assumption.
- Minor-i variants: −6/−Δ7 → own harmonic minor — assumption. Since the −6
  arpeggio now carries a natural 6, harmonic minor's ♭6 sits against it in
  scale fills and approach walks.

## Deferred (do not build until asked)

Imposed placements that override the chord-scale ruling (D1) · a
late-placement template putting a Way in the last two beats of a 4-beat chord
(D2) · two 1-2-3-5 cells paired across a 4-beat chord (p. 58) · the assembled
seven-bar routine (needs William's ruling, and a way to give the bars inside
one long static segment different concepts) · student-authored Ways (practice
suggestion 5 — belongs with the lick journal) ·
TAB post-pass · MUSC 120 grouping view (tags are already in the schema) ·
handout-cell pack · etude assembly / weighted fill / lick journal ·
strict-handout mode.

## Old engine

The position-based engine (VDA, fingerings, TAB) lives in git history —
last version at tag-less commit d7b72bf. The rebuild reproduces its degree
strings and rhythms exactly (checked against it: 100% match in scale mode,
98%+ pitch-class match in arp mode); octave contours differ where they
depended on fretboard positions, which are gone by design.

## Practice strip (Sep 2026)
Carries the shared bottom strip (Metronome and Benchmarks; this page's list is generated from `briefs/benchmarks.md` — edit it there and run `node scripts/benchmarks-sync.js`) — see root `CLAUDE.md`, "Practice strip". Synced from `arpeggios-deck` by `scripts/strip-sync.js`; never hand-edit the copy. `play()` calls `window.pfMetronomeStop()`: this tool has its own 2-and-4 metronome, and the strip's does not share its clock (William, 2026-09-19).
