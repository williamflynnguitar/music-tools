# Triad Voicings

Companion to JGTH pp. 39–43 (Triads in close and open position) and p. 81
(Exploring Triads, Ex. 8), plus William's 2014 *Introduction to Jazz Guitar*
pp. 25–27 for the "Over a bass note" tab (see its section below). The triad counterpart to Inversion Drill; engine
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
  placement (frets 0–15; open strings don't count toward the fretted span)
  rather than storing a table: the book's "or"
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
The book prescribes closed sets only; assumption B was confirmed by
William (Sep 2026), so the set picker now also offers the three **open
rows** ('open-top/middle/bottom' setIds). An open run pins the walked top
voice to the row's string and voices each chord with `openVoice` (same
`openShape`/`openPlayable` machinery and openRow-style ranking as the
Shapes tab), labelled as an extension of Ex. 8 in the sub text. The
top-voice-degree → inversion map flips for open (R/3/5 on top → open
2nd/root/1st). Six low combos (all open-bottom) have no playable
harmonization; renderKey shows a message instead of a run. check.js walks
every key × tonality × open row structurally.

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

## Over a bass note (Sep 2026)

Fourth tab, after Key study and before Drill. It answers what a triad is
for on a gig: a 7th chord is a triad over a bass note (TBN), the bassist has
the bass note, so a triad at the right interval above the root sounds the
chord's color. Source: *Introduction to Jazz Guitar* (2014), pp. 25–27 —
Ex. 19, Ex. 20 (p. 26), Ex. 21 and the four practice suggestions (p. 27).
JGTH 3rd ed. has no equivalent passage, so the tab cites the 2014 book. The
PDF is not in the repo (Dropbox, `Guitar Studio/OLD:UNUSED MATERIALS/`).
Brief: `briefs/triad-voicings-over-a-bass-note-brief.md`.

- **The table is a lookup of William's rulings, not a labeler.** `TBN` is
  4 qualities × 12 cells; nothing is computed except transposition.
  **Index = the interval of the triad's root above the bass note**, in
  semitones (`TBN_IV`), which is how p. 27 tells the student to think ("a
  major triad built a ♭6 above a given bass note results in X-7(♭6)"). A
  cell is a list of readings, each the suffix after the bass note's name:
  Ex. 21's B♭ cell carries two, hence the book's "thirteen applications".
  `[]` is a cell ruled to have no reading; a quality left `null` is not yet
  written.
- **Do not port `briefs/symbols.py`.** It names a pitch set over a bass and
  the quartal Function tab is built on it, so it looks like the obvious
  move. Run against Ex. 21 it agreed with the book on 3 of 12 cells (it
  returns "—" for the cell the book calls G13(sus4), and "6" for E♭13(♭9)).
  Its rules were fitted to William's quartal tables and encode his judgment
  about fourth stacks.
- **Major is from Ex. 21**, confirmed cell by cell against the page at
  400 dpi; check.js holds the thirteen printed strings. **Minor, augmented
  and diminished are not in the book** (practice suggestion 1 leaves them
  to the student), so they ship only when William rules them:
  `tbn-worksheet.md` carries Claude's proposals for him to correct. Until
  then those qualities draw Ex. 20's staff with no symbols and a "not yet
  written" notice, still play, and appear in no drill prompt and not in
  View 2's symbol list. Entering a ruled column is a data edit.
- **Ruled by William, 2026-09-19:** (1) the R cell stays **XΔ7** as Ex. 21
  prints it, even though a triad over its own root has no 7th — do not
  "correct" it to plain X; (2) the ♭2 cell, printed as a stacked alteration,
  is set inline as `X7(♭9 ♭13 sus4)`, in that order. **Still open:** the
  three worksheet columns.
- **View 1, One triad**: Ex. 20–21 as a live staff (`tbnSystemSVG`, on the
  `NOTE_DEFS` glyphs). Bass order starts a major third above the triad's
  root and descends twelve half steps; the triad's root sits in B♭3–A4
  sounding so C lands where the book prints it (bass E down to F, three
  ledger lines). Twelve cells do not fit a phone, so the row is cut into
  equal systems (12/6/4/3/2 by width, re-cut on resize) with the triad
  restated at the head of each — the one departure from the printed
  layout. A symbol that does not fit its cell drops its parenthesis to a
  second line, as the book stacks alterations. Clicking a cell selects it:
  the rule sentence in William's phrasing, then the triad's three
  inversions on the selected set (`tbnShapes` → `closedAll`, or `openRow`
  defaults with the Open toggle — practice suggestion 3). The bass note is
  named beside the boxes and never fretted.
- **View 2, One chord**: the reverse lookup (`tbnLookup`), the one for the
  stand. Chord root + a symbol from the distinct symbols in the ruled
  tables → every triad that sounds it, stated both ways ("C major triad,
  built a 4th above the root."). check.js walks all 12 basses × every
  symbol both directions.
- **Spelling.** Bass notes descend with flats as printed, with two
  exceptions that stop a staff contradicting itself: a bass note that is
  also a triad tone takes the triad's spelling (E over G♯, not A♭ under a
  G♯), and pc 6 is F♯ under a triad written with sharps (E over F♯).
  View 2 spells the triad's root by letter from the bass (a ♭5 above C is
  G♭, a 3rd above A is C♯) when that triad spells clean, else the ring's
  name. Consequence: View 1 prints G♭7alt. under a C triad, as the book
  does, while View 2's root ring offers F♯ (suite rule) and so reads
  F♯7alt. Flagged to William, not yet ruled. No double accidental can be produced;
  check.js asserts it on names, labels and the drawn staff.
- **Playback**: the bass note sounds first and sustains an octave or two
  below the triad's lowest voice (`tbnBassMidi`, never under E1; upper
  partials so a phone speaker finds the pitch); the triad enters one beat
  later at 80. Two events on the audio clock through the shared lookahead
  pattern (`tbq`), on their own gain bus so the next click fades what is
  still ringing. No visual change while it sounds. It is an audition, not
  timekeeping, so it does not stop the strip's metronome.
- **Its own drill** (the main Drill's tiers trace to the pp. 164–167
  checklist, which has no TBN material, and are untouched). Reveal: a chord
  symbol with its root, then triad name, rule and boxes. Choose: four boxes
  on one set, one inversion; distractors are same-quality triads at other
  intervals above the same bass note, never another bass note and never a
  triad that would also be right (`tbnChoose`). A wrong pick is told what
  chord it would have made. Streak in memory only.
- `strumAt` gained an optional destination node; `setTab` now shows a
  control when any of its tab classes matches (the old last-loop-wins
  logic hid the chord-tones check on Shapes after a tab round trip).

## Next (unbuilt)

**TBN Phase 2 — the bass note under the hand** (practice suggestion 4, for
playing without a bassist): closed triads on sets 1-2-3 and 2-3-4 only, the
bass note added on any lower string; enumerate by pitch as `openPlacements`
does, fretted span ≤ 4, open strings free, bass below the triad's lowest
voice. William cut 21 of 23 span-4 classes from the open triads by hand, so
expect the same: generate a numbered review sheet of every grip class
before any show in the app, and ship only what he keeps. Build after Views
1 and 2 are accepted. Deferred with it: the same table for the intervallic
voicing of the 2014 book's p. 33 (Ex. 29), a Through-changes mode comping
with TBN substitutions, and open triads with a fretted bass note.

Through changes with triad-reduced progressions; pre-rendered LilyPond
cells per key via `notation/pipeline`; melodic minor tonality in the key
study; the open-rows toggle for the key study (assumption B); finger
numbers if ever wanted (would need an assigner — see box-buddy's note).

## Audit note (Sep 2026, report-first — no changes made)
Modes and voicing types: Shapes = closed (4 sets) + open (3 rows); Drill =
closed + open via tiers; Key study = **closed only, by design** (the book
prescribes closed sets; the open-rows toggle is assumption B in "Next").
Spread voicings exist nowhere in the app (pp. 39–43 cover closed and open
only). Headless spot-check of bottom-row open triads for G, D, Am, E:
every pitch correct, and `closedAll`/`openRow` never emit a voicing off
the selected set/row (0 violations across all roots × qualities). Two
things that can read as bugs but are current design: (1) every bottom-row
open default basses on string 6 — openRow's four-string window prefers
bass on top-string+3; (2) with "All sets" checked, the set picker no
longer constrains the cards (it only drives the neck view), so the filter
can look broken. Both flagged to William in the Sep 2026 bug-sweep report.

## Open-placement playability rule (William, Sep 2026)
`openPlacements` filters the raw enumeration by hand mechanics, ruled in a
live session (~27 flagged shapes, all verified eliminated in check.js):
- outer voices stay inside a **four-string window**; a five-string spread
  survives only when the fretted span is ≤ 2 (the book's p. 42 D–B–G "or"
  cell is that class);
- fretted span ≤ 3 always allowed; span ≥ 5 is out (`OPEN_SPAN` is 4).
  **Span 4 survives only as the two bottom-row 6-4-3 grips** William kept
  from the numbered review of all 23 span-4 classes (Sep 2026): the °
  2-1-5 family (`6-4-3|f1,f0,f4`) and its minor sibling (`6-4-3|f2,f0,f4`)
  — `SPAN4_KEEP` in `openPlayable`. The other 21 classes were cut by hand,
  **including the book's printed G middle-row 2nd-inversion 5-4-8 cell
  (p. 42, class #17)** — a second printed-cell override — and the aug
  middle-row "or" pairs (p. 43), so aug inv0/inv2 middle rows now show a
  single shape. Defaults resettled onto compact five-string spreads for
  major 2nd-inv middle row and ° 2nd-inv top row.
Together the two passes removed 729 of 1508 placements; no quality ×
inversion × row lost its last placement; the ° 2nd-inversion middle row's
default is the compact five-string spread (6:2 4:1 2:1 class — the "B
card", confirmed kept). **Book conflicts, all ruled by William**: p. 42's
G- 5-3-8 cell, p. 42's G 5-4-8 cell (#17), and p. 43's aug middle-row
"or" pairs no longer enumerate — check.js asserts each absence.

## Rendering bounds (Sep 2026)
`chordStaffSVG`'s bottom edge follows the lowest head + ledger lines (low
bass notes used to be cut off at the fixed 6.4 bound); `boxSVG`'s left
margin is 2.0·sx so a two-digit "Nfr" label fits, with the label at
x0−0.5·sx clear of first-row dots. A scratchpad scan rendered every
displayable card (3,582 boxes + staffs: all closed cells, open
defs/alts/8va, key-study runs) and checks every SVG element against its
viewBox — re-run it after touching either renderer (it found 3,148
instances of the two old cut-off classes, 0 after).

## Practice strip (Sep 2026)
Carries the shared bottom strip (Metronome and Benchmarks; this page's list is generated from `briefs/benchmarks.md` — edit it there and run `node scripts/benchmarks-sync.js`) — see root `CLAUDE.md`, "Practice strip". Synced from `arpeggios-deck` by `scripts/strip-sync.js`; never hand-edit the copy. The Key study `play()` calls `window.pfMetronomeStop()`, so it stops the strip's metronome (William, 2026-09-19). The Key tab binds space to Play; while the Metronome panel is open the strip takes space first.
