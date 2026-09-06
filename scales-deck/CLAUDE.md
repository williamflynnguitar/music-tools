# Scales deck

Interactive walkthrough of Scale Practice 101 (JGTH pp. 61–64). Self-contained `index.html`.
Carries its own copy of the fretboard `SHAPES` data; keep it identical to `../fretboard/index.html` until the renderer is factored out.

## Structure
- `CONCEPTS[n].steps()` returns an array of cards `{ p | svg | text, key, shape, sub, instr, opts, flag }`.
- `state = { key, concept, tier, interval, pattern, i }`. Tiers per concept mirror the book's Easy / Intermediate / Advanced 1 / Advanced 2 labels.
- Cards render via `svgShape(placement, opts)` (positions) or `svgStrings(key, strings, links)` (horizontal lanes, frets 0–17).

## Rules encoded
- **Concepts 1, 2**: key gear moves in 4ths, fingering gear moves through `CYCLE`. Easy dims notes outside root-to-root.
- **Extended shapes** (Intermediate and up): all in-key notes within the position window, hollow dots. Fingers assigned by offset: 5-fret spans 1-2-3-4-4, 6-fret spans 1-1-2-3-4-4; book fingers win where a book dot exists. These are computed, not transcribed.
- **Concept 2 Easy**: hold the starting key's root on the 1st string for six keys (function R, 5, 2, 6, 3, 7). First card is P6 as the book says; later cards use the nearest position that contains that note.
- **Concept 3**: every placement of every shape, sorted up the neck, alternating ascend / descend.
- **Concept 4** (p. 69 rule): degree 1 uses I6 itself. Other degrees: window from one fret below the start note to three above, no notes below the start on the 6th string. "Based in" = the book shape with the most overlapping notes, with a strong preference for the shape whose lowest 6th-string note is the start note. Verified to reproduce all six labels printed on p. 69 in F.
- **Concept 5** reuses sequences from 1–4 and dims the lower octave.
- **Concept 7** uses adjacent string pairs for 3rds–5ths, pairs a string apart for 6ths and up.
- **Concept 8** is text only; Segovia fingerings are not transcribed.

## Open questions for William
Whether the zigzag in concept 3 should start at the very lowest position or the lowest with a root on the 6th/5th string; the computed below-root fingers.
