# Fretboard

Renderer prototype for the six movable major-scale fingerings (JGTH p. 7).
Self-contained `index.html`, no dependencies, no storage.

## Data model
- `SHAPES[id] = { rootString, name, notes: [[string, offset, finger], ...] }`
- `string`: 1 (high E) to 6 (low E). `offset`: frets relative to the root on `rootString`. `finger`: 1–4 as printed.
- Roots are derived from pitch, not stored. Two notes the book prints filled (top string in P6 and I5) therefore render as roots.
- `CYCLE = [P6, P5, M6, M5, I6, I5]` is the cycle of fingerings (p. 61); `KEYS` is the cycle of 4ths.

## Placement
`place(id, key)` puts the root at its fret on the root string, then shifts up an octave if any note would fall below fret 1 (so P5 in C sits at 12fr, as printed). Everything is verified: all 6 × 12 placements are in-scale.

## Rendering
Book orientation: strings run left to right, 1st string on top, fret label centred over the first fret space with a tick. Roots brass, other notes bone, finger numbers in mono. Modes: fingers / degrees / notes / blank.

## Not yet transcribed
Dorian, Mixolydian, harmonic minor, melodic minor, Phrygian dominant, the three bebop scales (ascending and descending fingerings), half-whole diminished (pp. 8–23).
