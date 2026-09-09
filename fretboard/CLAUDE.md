# Fretboard

Renderer for the movable scale fingerings (JGTH pp. 6–21 so far).
Self-contained `index.html`, no dependencies, no storage.

## Data model
- `SCALES[id] = { name, steps, degrees, apply, spellFrom, cycle, shapes }` — the shared
  scale registry, kept byte-identical across fretboard/index.html, fretboard/edit.html,
  scales-deck and arpeggios-deck (between the `===== shared scale data =====` markers).
- `steps`/`degrees` are parallel arrays (length 8 for the bebop scales later).
- `apply` is the application line from the scale's intro page, verbatim as printed (in C).
- `spellFrom` = semitones up to the parent major key; note names come from that key's
  spelling, rotated to the scale root (so C dorian spells Eb/Bb, and Gb dorian borrows
  F# spelling rather than double flats). Absent → spell each degree from its label,
  falling back to the enharmonic key (Gb→F#, Db→C#, …) when a double flat would appear —
  so Gb harmonic minor displays with sharps.
- `shapes[id] = { rootString, name, notes: [[string, offset, finger], ...] }` as before;
  `string` 1 (high E) to 6 (low E), `offset` relative to the root on `rootString`.
  `finger: 0` = no finger printed (renders as a plain dot). A shape may carry named
  fingering variants: `notes` (labelled `variantName`) is the default and
  `variants = { name: full notes list }` holds alternates — currently major P6,
  "B on 4th string" (default) vs "B on 3rd string". Both apps show a toggle when the
  shape at hand has variants and remember the choice per shape for the session, in
  memory only; validation and the deck's extended-shape computation cover every
  variant. Directional (bebop) shapes
  carry `pos` ("P6") and `dir` ("asc"/"desc"); ids are pos + a/d ("P6a"), and the
  scale's `cycle` lists the ascending set. `passing` on a scale = index into `steps`
  of the added bebop passing tone; those dots render as diamonds, as the book prints
  them. `open` (placement floor 0 instead of 1) remains reserved.
- Roots are derived from pitch, not stored. `SHAPES`/`MAJOR` remain as aliases to
  `SCALES.major` for the other decks.
- Transcribed: major (p. 7), dorian and mixolydian (p. 9), harmonic and melodic minor
  (p. 11, applications p. 10) — the same six fingering identities (I/M/P × 6th/5th-string
  root) in all five. The minor scales print several non-root-string roots with their own
  fingers (e.g. harmonic minor I6 roots on fingers 2/4); roots are still derived from pitch.
- Phrygian dominant (p. 13, applications p. 12): the book prints dots only, in G (V of
  C minor, matching the applications); the data stores root-relative offsets as usual.
  Fingers are William's, authored in edit mode (the book prints none). The root fingers
  confirm the I/M/P slot ids that were originally inferred from the window positions.
  One book quirk: the nut-position diagram prints its 6th-string G filled and the Ab
  beside it open; roots derive from pitch here, so it renders correctly anyway.
- The four bebop scales (intro/application pages 14/16/18/20, shapes 15/17/19/21):
  major, mixolydian, phrygian dominant, melodic minor bebop — 8-note steps/degrees.
  Major, mixolydian and melodic minor bebop have separate ascending and descending
  fingerings per position (several pairs are printed identical; both are stored).
  Phrygian dominant bebop breaks the pattern: p. 19 is one dots-only set (no fingers,
  no directions), printed in G like its parent, and the book draws its passing tones
  round while the fingered pages use diamonds. The #5/b6 label is stored as "#5";
  the intro pages of phrygian dominant bebop and melodic minor bebop misprint one
  step name each — degrees rows and diagrams (both verified) settle the step sets.
  Spelling falls back to a plain enharmonic name where letter-derived spelling would
  need a double accidental (e.g. #5 of B is written G, not F##).

## Placement
`place(scaleId, shapeId, key)` puts the root at its fret on the root string, then shifts
up an octave if any note would fall below fret 1 (fret 0 for `open` shapes). Verified
headlessly: all shapes × 12 keys × 5 scales are in-scale, cover every degree, and read
as an unbroken scale from lowest to highest note (`scratchpad validate.js` pattern).

## Rendering
Book orientation: strings run left to right, 1st string on top, fret label centred over
the first fret space with a tick. When the window reaches fret 1 the nut is drawn
instead of a label (as the book does for dorian M5). Roots brass, other notes bone,
finger numbers in mono. Modes: fingers / degrees / notes / blank.

## Whole-neck view
"Whole neck" in the fingering picker draws every placement of the scale's cycle on one
neck, frets 0–17, book orientation. Each placement is a translucent band over its fret
window (overlaps shade darker; identical windows stack, both labelled); all scale notes
draw as dots on top, roots brass, ring weight = how many positions contain the note
(unclaimed notes, e.g. open strings, render faint). Clicking a position label or band
isolates that placement; a "show all" button in the caption (or clicking it again)
clears. The selected fingering variant is respected. Directional (bebop) scales show
the ascending set. A position that genuinely cannot fit frets 1–17 is omitted —
A major bebop I5a (spans 12–18) is the one case, and the validator distinguishes
"doesn't fit" from "missing". (A color-coded variant of this view was tried and
reverted by William's preference — see commits 95bbe51/its revert — the shading reads
better to him; isolation and reset were kept.)

## Authoring page (edit.html)
The student page (`index.html`) has no editing UI. `edit.html` is the authoring copy —
the same app plus "Edit fingers" (click a dot: finger 1 → 2 → 3 → 4 → none, mutating
the in-memory SCALES data), "Copy shape" (the current shape/variant as
`[[string, offset, finger], ...]` JSON) and the raw shape-data pane. It carries its own
copy of the shared SCALES block: keep it byte-identical with the other three files.
Deliberately not linked from the landing page.

## Half-whole diminished (pp. 22–23)
Transcribed. Its six fingerings have no pinky-root shapes — the book gives
index/middle/ring roots on strings 6 and 5 (the symmetric scale puts the
pinky-root frame out of reach, the same substitution the arpeggio pages make
for ø7/°7). Ids `R6 R5 M6 M5 I6 I5`, cycle in that order, paralleling
P6→I5 for the other scales. The printed charts sit at 8/6/5fr (string 6) and
2/1/13fr (string 5) in C; the unlabeled chart is 1fr, and 13fr is M5's
pattern rooted a ring finger up — the transcription was verified headlessly:
every dot a scale tone, every hollow a root.

## Notation (added)
- Every card shows staff + TAB in the card's actual key, engraved by LilyPond. Cells are
  pre-rendered for every shape × key by `notation/pipeline/` (see its README) into
  `notation/svg/fretboard/` and fetched on demand by `hydrateNotation()`
  (cached per session). This is the one exception to "self-contained": diagrams work
  offline; engraved notation needs the site. When a fetch fails, `notate()` draws the same
  notes in the browser from LilyPond's own glyphs (`NOTE_DEFS`, 4 KB) and the caption says
  so, so nothing goes blank.
- `notationPanel()` builds the cell filename; `notation/pipeline/gen-*.js` builds the same
  name from the same data. If you rename a shape or change `ARP`/`SCALES`, re-run the
  pipeline (it only renders what's missing).
- "Download .ly" writes the card as a LilyPond page via `lyShape()` — the same generator the
  pipeline uses (shared with arpeggios-deck; keep in sync).

## Fingering-label audit (Sep 2026)
Audited every scale × fingering × variant: the finger stored on the lowest
root always matches the label's letter (I=1, M=2, R=3, P=4) and string.
The half-whole charts were re-checked dot-for-dot against p. 23 — the
printed order is I6(8fr) M6(6fr) R6(5fr) / I5(2fr) M5(1fr, unlabeled)
R5(13fr), all fingers as transcribed. Phrygian dominant bebop prints no
fingers (finger 0 throughout), so its P/M/I ids are window-position slots,
not printed fingers. Note the symmetric-scale labeling rule: hwdim's three
5R shapes differ only on strings 4–5; the label letter is the finger on
the root of the anchoring string (R5 at 13fr is M5's pattern rooted a ring
finger up). A root is a *pitch* match — offset 0 on a non-root string is
not a root; don't audit by offset.
Known UI quirks (unfixed, awaiting William's ruling with the 3.1 report):
render() builds the fingering picker before the stale-id guard resets
state.fingering, so switching from a scale that has the current id to one
that doesn't (major P6 → hwdim) draws the diagram at cycle[0] with no
picker button pressed; "Next in cycle" indexOf's ids that may not be in
the cycle (descending bebop ids → jumps to cycle[0]).

## Deferred
- Four-note-per-string symmetric half-whole fingering (half–whole–half on
  one string, restarting a tritone up on the next, shift between strings
  3 and 2). William will spec it separately (Sep 2026).
