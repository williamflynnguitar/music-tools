# Arpeggios deck

Shown in the UI as **Arpeggio practice** (renamed Sep 2026); the folder and
URLs are unchanged.

Shape browser and practice walkthrough for JGTH arpeggios (shapes pp. 25–36,
Arpeggio Practice pp. 76–78). Self-contained `index.html`.

## Tabs
Three tabs: **Shapes** (default) · **Root** · **Practice**. Key, chord size,
quality, octaves, labels and notation are shared state across all three; each
tab renders its own control instances, all writing to the same `state`.
Practice is the original app, wrapped, not changed — the approaches, `placeArp`,
`diatonic`, `buildTriads`, `hydrateNotation` and the notation cell naming are
untouched; `rebuild` is wrapped only to mark the other tabs dirty.

- **Shapes**: one full neck (frets 0–19, inline SVG from `neckSVG`) with every
  shape of the quality/octaves whose root finger matches the Finger control
  (1–4, or All with per-finger layer toggles). Every placement in the key whose
  notes all sit in frets 1–19 is drawn (`shapePlacements` — usually two octaves
  of the neck). Colored **by root string**: `--rs6 --rs5 --rs4 --rs3`. Cards for
  the shapes (one per shape, existing card renderer + notation) sit below, in
  the Parallel · one key walk order — ascending by `placeArp` root fret
  (`walkOrder`) — numbered to match, so the neck reads as a map of that walk;
  hovering a card lights its placements brass, hovering a dot outlines its
  card(s). ⌥-click / long-press a root dot jumps to Root with that root.
- **Root**: a bare neck; clicking a position on a root-capable string
  (6/5/4/3 in 1-octave, 6/5 in 2-octave; other strings drawn dim) sets the
  shared key to that pitch (`KEYS` carries one spelling per pitch class) and
  draws every shape rooted exactly there, colored **by root finger**:
  `--fg1 --fg2 --fg3 --fg4`. A shape whose notes would leave frets 1–19 at the
  clicked fret is not drawn on the neck but keeps its card, flagged — nothing
  is silently dropped. The clicked root wears a brass ring.
- Overlap rule: a position covered by n shapes splits into n wedges (roots,
  filled) or n arc segments (chord tones, hollow) — never stacked or offset.
  (b) duplicates share their color and go dashed. Labels draw only when every
  overlapping shape agrees (degrees/notes always agree; fingers can differ).
  `alt` diamond notes stay off the necks; cards still show them dashed.
- Per-finger grouping is always by `rootFinger(sh)` — the finger on the anchor
  root — never by a triad override's slot key (several "pinky" slots root on
  the ring finger, and the book's ø7/°7 "middle" shapes are ring shapes).
- Headless checks: `notation/pipeline/check-deck.js` — anchor/finger/chord-tone
  validity, every Shapes placement in every key inside frets 1–19, Root-tab set
  equality per string, per-finger partition = All view, Shapes cards ≡
  Parallel · one key walk (every key × finger), and the book's middle-root
  coverage table (middle on 6/5/4 for maj7/m7/dom7/mMaj7/maj7#5, plus string 3
  only for the major-third qualities; none for ø7/°7; triads excluded — their
  middles are curated overrides). Its placement/filter rules are duplicated
  from `index.html`; keep in sync.

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
- Chord-tone labels: R, 3/b3, 5/b5/#5, 7/b7/°7. The diminished seventh is labelled
  °7, not bb7: no double accidental is written anywhere (William, 2026-09-12).

## Approaches
1. **Parallel · one key** (Ex. 1): the chosen *finger's* shapes of one quality in one
   key, sorted ascending by root fret. (It used to walk every fingering interleaved —
   that misread p. 76, where the shape being moved is finger-defined, "e.g. index
   finger ^7". Now finger-filtered; empty finger/quality combinations — middle for
   ø7/°7 — show a message with a hint to try ring.) This walk is the stepped-through
   version of the Shapes tab's per-finger neck: same shapes, same order, checked
   headlessly.
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
  when nothing else fits, as in the book's 5th-string 2-octave shapes. Generation yields 40 shapes; overrides fill slots generation cannot (middle roots) — 68 triad shapes at present, every one curated or pinned — middle roots on every root string. No pinky-root shapes on root string 3, by decision: the octave falls outside the window and the R-to-5 fingerings don't make sense. Don't re-add.
  Cards carry a "generated fingering" flag (`sh.gen`). `TRIAD_OVERRIDE["oct|q|rs|index|middle|pinky"]`
  replaces any generated shape with a curated `[[string, offset, finger], …]` list and
  clears the flag. Middle-root slots are off-book and never generated — they exist only
  when an override curates one; a new shape (middle, or the missing 2-oct 5th-string
  pinky) shifts the shape indices after it, so delete that octave+quality's whole
  `notation/svg/arpeggios/<oct>-<q>-*` set before re-rendering. The pinky-root 2-octave triads from the 5th string are not generated
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
pick octaves/quality/root string/root finger (index, middle or pinky), click the board to add notes or
cycle fingers (click wraps 1 → 2 → 3 → 4 → 1; right- or ⌥-click removes), and copy the emitted `TRIAD_OVERRIDE`
line for index.html. Works in offset-from-root space with the book's five-fret
window shaded; 1-octave middle slots on strings 6/5 prepopulate from the bottom
octave of the curated 2-octave middles (DRAFTS in edit.html — regenerate if
those change); validates chord tones, missing tones, root-to-root span; output
is sorted ascending by pitch. It prints the pipeline re-render command
(whole octave+quality, since a new shape shifts cell indices). Duplicates
`TRIAD_IV`/`genTriad`/`STR` between `===== triad generator =====` markers —
keep in sync with index.html. Edits live in memory only (no storage APIs).
Not linked from the landing page.

## Practice pointer & Root-tab taps (Sep 2026)
- Entering the Practice tab always opens on step 1 (switchTab resets
  `state.i` when arriving from another tab). The step pointer used to
  survive the tab's last visit, so a phone passed around a lesson opened
  mid-sequence — observed as "VDA in C opened on E-7" (iii is step 3 of
  the I6 walk). The VDA sequences themselves were verified headlessly:
  every size × octaves × position in C starts on the tonic-function
  arpeggio.
- Root tab taps resolve to the NEAREST root-capable cell within ~one cell
  of the tap (`rootCellAt`), instead of requiring a direct hit on the
  dot's own 46×30 cell — at phone scale the old cells were ~48×31 px and
  taps between strings or on a dim string died silently. A brass ring is
  drawn synchronously on pointerdown so the tap registers before the pane
  re-renders; a scroll-drag of the neckwrap removes the tentative ring.
- Auto-move on tap (reported, not changed): there is no scrollIntoView /
  scrollTo anywhere — the movement students see is the full Root-pane
  re-render (neck innerHTML replaced + cards rebuilt for the new key),
  which lets mobile scroll anchoring shift the page when the card list
  changes height. Options proposed to William: pin scrollY across the
  re-render; patch the ring/selection in place instead of rebuilding the
  neck; defer the card rebuild briefly.
- Auto-move ruling (Sep 2026): Root-tab taps pin `scrollY` across the
  pane re-render, per William's pick of the proposals above.
