# Composition Assignments

Stand-alone app (not handbook-tied): a page of composition assignments for
William's composition students. Six sections of prompt cards; every card is
a disclosure with About copy, and several carry an inline seed-material tool
(Row Builder, Two Onsets, Pentatonic Shuffle, Pentatonic Lab, Cell Lab,
Alphabet Mapper, Motif Displacer) with the Groove card embedding a Spotify
playlist. No melody/chord/score entry in this version — the writing happens
on paper. Build brief: `BRIEF.md` in this folder.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage APIs (all state in memory). Root `CLAUDE.md` conventions apply,
including the lookahead scheduler (25 ms / 130 ms) for everything that keeps
time and `ctx.resume()` + a silent-buffer unlock on the first tap.

## Structure

- Header: sharps/flats toggle (applies to pitch-class spelling everywhere),
  shared tempo, master play/stop. Master play runs the open tool's primary
  playback; Space toggles it. One tool open at a time — tool panels are
  singletons moved under whichever card opened them, and opening one stops
  playback and collapses the rest.
- Assignment prompts are William's copy, verbatim, in the section order of the
  brief. The `(tool: …)` markers from the brief are rendered on the expand
  control, not as prompt text.
- **Every card is a disclosure** (rev 1.1): tap anywhere on a card to open
  prompt-as-heading + About + tool (where one exists); one card open at a
  time; the chevron rotates. About copy lives in the `ABOUT` table keyed by
  each card's `data-id` — William edits copy there, one place (the shipped
  text is his rev 1.1 draft). Cards carrying a tool keep the brass left rule.
- Engine is pure functions in the first `<script>` block (spelling, mappings,
  matrix, pentatonics, motif rhythm). It was developed against a headless
  test harness; if it changes, re-run the simulation (extract the block
  between `/* ===== engine:` and `</script>`, concat a test body, `node`).
- Engraving reuses the Line Ladder glyph outlines (`NOTE_DEFS`) and units
  (1 staff space = 1): `pitchStaff` (stemless noteheads, treble, per-note
  accidentals, optional labels under notes), `rootChart` (12-bar slash
  chart), `rhythmLine` (one-bar rhythm staff styled after the Charleston
  app's LilyPond RhythmicStaff cells: one line, thick two-space barline
  rects, beams, down-hanging flags — NOTE_DEFS stores flags in font coords,
  so they draw with an unflipped y-scale — dots, shallow filled tie
  crescents, 16th secondary beams with stubs, no per-row time signature; a
  wrapping sustain ties across the barline into the dimmed first note of
  the next repetition). Verify renderer changes by generating rotation
  sheets to PNG (`qlmanage -t` over composed SVGs) and reading them.

## Decisions taken where the brief left room (flag to William)

- **Digit spelling comes from the key, not the toggle.** Degrees of the
  chosen key spell diatonically (degree 3 of E is G♯ even in flats mode;
  degree 4 of G♭ is C♭). The header toggle governs pitch-class spelling
  (rows, pentatonics, edited letter mappings). The brief's "applies
  everywhere" read literally would misspell scale degrees.
- **Digits 8/9 escape the C4–B4 octave.** "Degree 1/2 up an octave" places
  them C5–B5; the one-octave rule holds for letters and plain degrees.
- **Accidental rule on the unmeasured pitch staffs**: altered notes always
  carry their accidental; a natural sign appears only when the same
  letter+octave was altered earlier in the line.
- **Pentatonic staffs show six noteheads** (home … home an octave up) so the
  five-interval pattern including the wrap is visible on the staff.
- **Pattern-name collisions print both names**: blues major and ritusen share
  `2 3 2 2 3`, so that rotation reads "blues major / ritusen". `PENTA_LIB`
  is the data table to edit.
- **Motif rotation labels**: `+n♪` on the eighth grid per the brief; the
  sixteenth grid uses `+n/16` because the Unicode sixteenth-note glyph is
  unreliable on phones.
- **Notation rules beyond the brief's 4/4 line** (beam from 1 and 3, nothing
  crossing beat 3, rests to the beat, no dotted rests):
  - 4/4 allows offbeat quarters and offbeat dotted quarters within each half
    of the bar; a whole-bar attack is a whole note.
  - 3/4 is conservative: no offbeat quarters (they render as tied eighths
    across the beat), dotted quarters only at 0 and the and-of-2 (the
    hemiola positions), halves on beats 1–2, no half rests, eighths beamed
    in pairs per beat.
  - 5/4 is 3+2: nothing crosses the seam after beat 3; the 3-group follows
    the 3/4 rules, the 2-group the 4/4 half-bar rules and beams its eighths
    as a four. A whole-bar attack is 𝅗𝅥. tied to 𝅗𝅥.
  - Sixteenth grids scale the same rules down one level (beat ≈ half-bar,
    beam per beat with secondary beams, dotted eighths allowed on the first
    two sixteenths of a beat).
  - Rotation staffs carry no time signature — the meter selector and entry
    grid establish it.
- **Playback registers**: rows and pentatonics play within one octave from
  their first note (matching the staff); pentatonic drone is the home note
  an octave below. Motif attacks are a noise-burst transient plus a
  fixed-pitch tone (G3) held for the notated duration, so playback observes
  the ties — a looped rotation's last note sustains across the barline into
  the next cycle (William's 2026-09-09 ruling), while Play all ends each
  rotation's last note at its barline (separate examples, no self-repeat).
- **Two Onsets** (2026-09-09 request) enumerates every placement of two
  onsets in one bar, grouped by cyclic spacing — a shape and its
  displacements, with wrapped placements in the same family (the loop and
  the engraved tie teach why "a dotted quarter apart" can cross the
  barline). Eighth grid only in v1; the row engine is `twobarFamilies`
  (tested), engraving and tie-observing playback are the Motif Displacer's.
- **Pentatonic Shuffle** (same request batch): root x major/minor pentatonic
  autopopulates (the other rotations live in the Pentatonic Lab), Shuffle
  permutes the order as a melodic seed; root/type changes reset to scale
  order. Spelling follows the header toggle.
- **Cell Lab** (same request batch): 3-5 note cell, hand-built (repeats
  allowed; Random draws distinct pitches) with in-place transforms —
  Invert mirrors around the current first note, Retrograde reverses,
  +1/-1 transpose chromatically and merge in the breadcrumb ("inv - retro
  - +2"); Reset restores the last hand-entered cell. Chained ops give RI
  for free.
- Matrix labels: standard four-sided layout (P left, R right, I top, RI
  bottom), P0 = the row as entered, main diagonal is constant and tinted.
  Clicking any label selects and plays that form; the root-chart view and
  "Copy form" follow the selection.
- **Whole-card tap targets** (William's 2026-09-09 report on the first cut:
  "none of this is clickable" — the only control was the small chevron).
  Rev 1.1 made every card a disclosure, which resolved it at the design
  level. Clicks inside an open tool never collapse it — the card listener
  checks `composedPath()`, not `closest()`, because tool controls re-render
  their own subtree and detach the click target before the bubbling
  listener runs.
- **Alphabet letters walk the chromatic scale from A** (A=A, B=A♯/B♭, C=B,
  D=C … Z=A♯) — William's 2026-09-09 ruling: "chromatic, not diatonic",
  replacing the brief's wrap-the-naturals default. All 12 pcs are reachable
  from text; spelling follows the header toggle. Digits stay scale degrees
  of the chosen key (reconfirmed in the rev 1.1 About copy). Reset restores
  the chromatic default.

## Open items

- **The Spotify playlist is private.** William flips it public in Spotify
  before students use it; until then the embed shows nothing. The thirteen
  tunes are in the page as a plain list (rev 1.1 §2), which is also the
  offline story; the iframe src is set only when the card opens.
- The rev 1.1 About copy shipped as William's draft — he edits it in the
  `ABOUT` table.
- Digit default and sharps default are implemented per the original brief;
  William to confirm. If Pat Martino's published mapping differs from the
  chromatic walk, it's a `LETTER_DEFAULT` edit.

## Deferred (do not build until asked)

- Melody and chord entry in the app, with per-assignment lint (strict/flag)
  and per-note chord-tone readout
- Rev 1.1 §4 lookup tools, pending William's picks (each a table, no entry):
  increasingly-colorful chord-tone table; harmonic major scale + diatonic
  sevenths; diatonic-over-chromatic readout (key × chord → what each scale
  pitch becomes); 32-bar modulation targets with their ii–V and the
  backdoor ii–V
- Reharm ladder tool with the four melodies notated and a chord-tone lookup
- Form builder (32-bar modulations, odd phrases, harmonic-rhythm ruler)
- Submission export (seed material as PDF alongside the student's score)
- Groove capture-and-mutate tool
