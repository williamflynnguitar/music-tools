# Fretboard

Renderer for the movable scale fingerings (JGTH pp. 6–21 so far).
Self-contained `index.html`, no dependencies, no storage.

## Data model
- `SCALES[id] = { name, steps, degrees, apply, spellFrom, cycle, shapes }` — the shared
  scale registry, kept byte-identical across fretboard, scales-deck and arpeggios-deck
  (between the `===== shared scale data =====` markers).
- `steps`/`degrees` are parallel arrays (length 8 for the bebop scales later).
- `apply` is the application line from the scale's intro page, verbatim as printed (in C).
- `spellFrom` = semitones up to the parent major key; note names come from that key's
  spelling, rotated to the scale root (so C dorian spells Eb/Bb, and Gb dorian borrows
  F# spelling rather than double flats). Absent → spell each degree from its label,
  falling back to the enharmonic key (Gb→F#, Db→C#, …) when a double flat would appear —
  so Gb harmonic minor displays with sharps.
- `shapes[id] = { rootString, name, notes: [[string, offset, finger], ...] }` as before;
  `string` 1 (high E) to 6 (low E), `offset` relative to the root on `rootString`.
  `finger: 0` = no finger printed (renders as a plain dot). Directional (bebop) shapes
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

## Edit fingers mode
"Edit fingers" makes dots clickable: each click cycles finger 1 → 2 → 3 → 4 → none.
Edits mutate the in-memory SCALES data only. "Copy shape" writes the current shape's
notes as `[[string, offset, finger], ...]` JSON to the clipboard and to the data pane,
for pasting into the shared block. Intended for transcribing new book pages.

## Not yet transcribed
Half-whole diminished (pp. 22–23).
