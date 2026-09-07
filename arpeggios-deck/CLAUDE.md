# Arpeggios deck

Interactive walkthrough of Arpeggio Practice (JGTH pp. 76–78) using the shapes on pp. 25–36. Self-contained `index.html`.

## Data model
- `ARP[octaves][quality] = [{ rs, n: [[string, offset, finger], ...], alt?: [...] }, ...]`
- `rs` is the root string; offsets are relative to the root fret on `rs`. `alt` holds notes the book marks with a diamond (alternate stretch location).
- Qualities: `maj7 m7 dom7 m7b5 dim7 mMaj7 maj7s5`. 1-octave shapes exist on root strings 6, 5, 4, 3 (up to four fingerings each); 2-octave shapes on 6 and 5 (three each). 130 shapes total.
- Fingering is named by the finger on the root (`rootFinger`) plus root string; duplicates get (a)/(b). ø7 and °7 use a ring-finger shape where the other qualities use middle.
- Every shape is validated headlessly: all notes are chord tones of the quality. Finger numbers are not machine-checkable; verify against the book.
- Carries the shared `SCALES` block (see `../fretboard/CLAUDE.md`); keep it byte-identical
  across the three apps. `SHAPES` is the alias to `SCALES.major.shapes`.

## Harmony
- `TONAL` holds major, harmonic minor, melodic minor step sets. `diatonic(key, ton)` stacks scale thirds and matches the interval set to a quality; note names are spelled letter-by-letter (`spell`).
- Chord-tone labels: R, 3/b3, 5/b5/#5, 7/b7/bb7.

## Approaches
1. **Parallel · one key** (Ex. 1): every fingering of one quality in one key, sorted up the neck.
2. **Parallel · through the keys** (Ex. 2): one grip, cycle of 4ths.
3. **HDA** (Ex. 3): seven diatonic chords, fixed root string + finger, each root at or above the previous, tonic octave appended if it fits. Missing fingerings substitute the nearest finger and flag it.
4. **VDA** (Ex. 4, p. 78): scale position drawn as a hollow outline; every scale tone of the position, ascending in pitch from the 6th string to the 1st, becomes a root in turn and gets the diatonic arpeggio rooted at that exact string and fret. Candidate fingerings are limited to that root string; scoring prefers notes inside the window (position ±1 fret), tie-broken by notes coinciding with the scale shape. The sequence stops at the first root where no fingering fits with at most 2 notes outside; outside notes on shown cards are flagged, as the book allows. Cards show the root's string and fret. In 1-octave mode roots naturally run out at the 2nd string (no shapes exist there), in 2-octave mode at the 4th. Takes a tonality: major, harmonic minor or melodic minor, using that scale's own positions — `scalePlace(id, key, ton)` reads `SCALES[ton].shapes`, and `TONAL[ton].steps` must stay equal to `SCALES[ton].steps`. Validated headlessly across all keys, positions, octaves and tonalities: roots are position tones ascending in pitch, at the stated string/fret, never more than 2 notes outside, always flagged.

## Placement
`placeArp` keeps every note at fret 1 or above and, where possible, the top note at or below fret 19; `minRoot` forces HDA to climb.

## Triads (added)
- `QUAL` gains `maj min dim aug` (marked `triad: true`); `SIZE` groups qualities into
  triads / 7th chords and the "Chord size" control switches between them. `diatonic()`
  stacks two thirds in triad mode and matches the triad interval sets; `roman()` knows
  the triad symbols.
- The book has no triad arpeggio pages, so shapes are generated at load by
  `buildTriads()` / `genTriad()`: for each root string (6/5/4/3 for 1-octave, 6/5 for
  2-octave) and root finger (index → window root..root+4, pinky → root-4..root), each
  chord tone in ascending pitch goes on the highest string that keeps it in the window;
  fingers follow the book's convention for a five-fret window (index shapes stretch
  the index down, pinky shapes stretch the pinky up); a one-fret stretch is allowed
  when nothing else fits, as in the book's 5th-string 2-octave shapes. 40 shapes.
  Cards carry a "generated fingering" flag (`sh.gen`). `TRIAD_OVERRIDE["oct|q|rs|index|pinky"]`
  replaces any generated shape with a curated `[[string, offset, finger], …]` list and
  clears the flag. The pinky-root 2-octave triads from the 5th string are not generated
  (they need a position shift, not a stretch); add them via the override.
- VDA skips leading position roots that have no shape and shows a message when no
  shape fits at all, instead of an empty card.

## Notation (added)
- Every card shows staff + TAB in the card's actual key, engraved by LilyPond. Cells are
  pre-rendered for every shape × key by `notation/pipeline/` (see its README) into
  `notation/svg/arpeggios/` and fetched on demand by `hydrateNotation()`
  (cached per session). This is the one exception to "self-contained": diagrams work
  offline; engraved notation needs the site. When a fetch fails, `notate()` draws the same
  notes in the browser from LilyPond's own glyphs (`NOTE_DEFS`, 4 KB) and the caption says
  so, so nothing goes blank.
- `notationPanel()` builds the cell filename; `notation/pipeline/gen-*.js` builds the same
  name from the same data. If you rename a shape or change `ARP`/`SCALES`, re-run the
  pipeline (it only renders what's missing).
- "Download .ly" writes the card as a LilyPond page via `lyShape()` — the same generator the
  pipeline uses (shared with fretboard; keep in sync).

## Authoring page (edit.html)
The student page has no editing UI. `edit.html` is the triad-fingering editor —
pick octaves/quality/root string/root finger, click the board to add notes or
cycle fingers (click wraps 1 → 2 → 3 → 4 → 1; right- or ⌥-click removes), and copy the emitted `TRIAD_OVERRIDE`
line for index.html. Works in offset-from-root space with the book's five-fret
window shaded; validates chord tones, missing tones, root-to-root span; output
is sorted ascending by pitch. It also computes the shape's index in
`ARP[oct][q]` and prints the exact pipeline re-render command. Duplicates
`TRIAD_IV`/`genTriad`/`STR` between `===== triad generator =====` markers —
keep in sync with index.html. Edits live in memory only (no storage APIs).
Not linked from the landing page.
