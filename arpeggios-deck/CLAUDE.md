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
4. **VDA** (Ex. 4): scale position drawn as a hollow outline; per chord, the fingering (any root string) with the most notes inside the window, tie-broken by notes that coincide with the scale shape. Notes outside the window are flagged, not forbidden. Takes a tonality: major, harmonic minor or melodic minor, using that scale's own positions — `scalePlace(id, key, ton)` reads `SCALES[ton].shapes`, and `TONAL[ton].steps` must stay equal to `SCALES[ton].steps` (validated headlessly).

## Placement
`placeArp` keeps every note at fret 1 or above and, where possible, the top note at or below fret 19; `minRoot` forces HDA to climb.
