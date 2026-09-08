# Triad Voicings

Companion to JGTH pp. 39–43 (Triads in close and open position) and p. 81
(Exploring Triads, Ex. 8). The triad counterpart to Inversion Drill; engine
code copied from inversion-drill (drill flow, key-study scaffolding, .ly
export) and box-buddy (pitch-based voicing engine, chord-box renderer) per
the no-build-step rule. Single self-contained `index.html`, no dependencies,
no browser storage. Headless tests: `node check.js`.

## What the book actually prints (verified from the PDF, not assumed)

The build brief's sanity checks said pp. 40–43 are in C; they are in **G**
(e.g. p. 40 row 1 is B-D-G at 4-3-3, D-G-B at 7-8-7, G-B-D at 12-12-10 on
strings 3-2-1). Cells in each row are the three inversions **ascending by
neck position** — each inversion's lowest playable placement — not a fixed
root/1st/2nd column order. The Shapes tab follows the book: ascending
order, inversion named on the card. `check.js` verifies the engine against
every closed cell of pp. 40–41 and the open defaults/alternates of
pp. 42–43, all decoded from the PDF at the pixel level (`boxes.py` history
in the repo's commit message).

## Voicing model

- Closed (pp. 40–41): three chord tones within an octave on an adjacent
  string set (1-2-3 · 2-3-4 · 3-4-5 · 4-5-6), one per string. `closedAll`
  enumerates by pitch — exactly one placement per octave; display the
  lowest (fret 0 allowed), "+8va" steps up while the top voice stays ≤
  fret 15 (`MAXF`).
- Open (pp. 42–43): a closed inversion with the **middle voice dropped an
  octave** (closed root → open 1st, closed 1st → open 2nd, closed 2nd →
  open root — named by the new bass). Open voicings are pitch sets, not
  string-set shapes, so `openPlacements` **enumerates** every distinct-string
  placement (frets 0–15, fretted span ≤ 5 — `OPEN_SPAN`; open strings don't
  count toward the span) rather than storing a table: the book's "or"
  alternates are exactly these enumerations, and augmented gets them on
  nearly every cell because the shape is symmetric. Rows group by top-voice
  string (top = 1, middle = 2, bottom = 3); within a row the default is the
  placement with the smallest span, then lowest fret; the rest are alt
  chips. The brief assumed span ≤ 4, but p. 42's G-minor middle-row 2nd
  inversion (5-3-8) needs 5; the book also prints a few defaults that
  follow the parallel major cell's string distribution rather than the
  tightest span — those book shapes appear as alts here (listed in the
  build commit).

## Key study (Ex. 8, p. 81)

Book-faithful: pick key + tonality and a **closed** string set; the app
finds the lowest in-key note on the set's top string (fret 0 counts) and
offers the three diatonic triads that harmonize it — root of X, 3rd of Y,
5th of Z. The choice fixes the inversion for the whole run (shown as a
consequence). The run is the 8 ascending diatonic chords **starting from
the chosen chord**, top voice walking up the scale, with roman numerals
(major I ii iii IV V vi vii°; harmonic minor i ii° III+ iv V VI vii°).
Ex. 8 (F major, 2-3-4, root of C) reproduces exactly — asserted in
check.js. Playback on the shared lookahead scheduler (25 ms / 130 ms),
one chord per beat or per bar, count-in, descending option, **no moving
cursor** (no visual highlight at all while playing — the brief's rule).
"Download .ly" uses the shared `lyDocument()` with a triad chord-name
variant (`lyTriadName`); live rendering only, no pre-rendered cells in v1.
The book prescribes closed sets only, so the brief's "include open rows"
toggle (its assumption B, unconfirmed) is left out of v1.

## Drill

Prompt = (root, quality, inversion, position, set/row). **Reveal**: prompt
text, then box + staff on demand. **Choose**: four boxes, pick the named
voicing — distractors are other inversions/qualities on the same set and
root, never other roots. Tiers from the skills checklist (pp. 164–167):
1 = closed 1-2-3 + 2-3-4 (all qualities) · 2 = closed 3-4-5 + 4-5-6 ·
3 = open middle + bottom rows · 4 = open top row + everything · Custom =
any combination. Streak in memory only. The brief's "Show" mode is the
Shapes tab; no Through-changes tab in v1 (left out entirely, per brief).

## Rendering

- Chord boxes: box-buddy's `diagramSVG` adapted to the family palette —
  × muted, O open, `Nfr` when off the nut, box grows past 5 rows for
  wide spans, **frets only, no finger numbers**; root dot brass.
- Staff: stacked whole-note heads on the shared LilyPond glyph outlines
  (`NOTE_DEFS` — clef and accidentals; the brief said to reuse "the
  Inversion Drill engraver" but that app has no live staff renderer, so
  this one is new here). Accidentals stack leftward when they collide.
  Key-study cells add TAB digits under the staff.
- Full-neck view (Shapes tab): the selected inversion's three notes on a
  0–15 neck, other shown inversions faint; click any position to re-root,
  as in Arpeggio Practice.

## Known engine-vs-book differences (deliberate)

- G on 2-3-4, closed 2nd inversion: the engine's lowest is the all-open
  D-G-B (0-0-0); the book prints 12-12-12 (it avoids the unmovable
  all-open voicing). "+8va" reaches the book's cell.
- A few open defaults differ where the book prefers the parallel-major
  string distribution over the tightest span (the book's shape is always
  present as an alt chip).

## Next (unbuilt)

Through changes with triad-reduced progressions; pre-rendered LilyPond
cells per key via `notation/pipeline`; melodic minor tonality in the key
study; the open-rows toggle for the key study (assumption B); finger
numbers if ever wanted (would need an assigner — see box-buddy's note).
