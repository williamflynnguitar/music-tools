# Scales deck

Shown in the UI as **Scale practice** (renamed Sep 2026); the folder and
URLs are unchanged.

Interactive walkthrough of Scale Practice 101 (JGTH pp. 61–64). Self-contained `index.html`.
Carries the shared `SCALES` block (see `../fretboard/CLAUDE.md`); keep it byte-identical
across the three apps until the renderer is factored out.

## Structure
- `CONCEPTS[n].steps()` returns an array of cards `{ p | svg | text, key, shape, sub, instr, opts, flag }`.
- `state = { scale, key, concept, tier, interval, pattern, i }`. Scale (major / dorian /
  mixolydian / harmonic minor / phrygian dominant / melodic minor / four bebop
  scales) is selectable; all concept logic reads `SCALE().steps`, `.degrees`,
  `.cycle` and `.shapes` rather than the old MAJOR/DEG globals.
- Cards render via `svgShape(placement, opts)` (positions) or `svgStrings(key, strings, links)` (horizontal lanes, frets 0–17).

## Rules encoded
- **Concepts 1, 2**: key gear moves in 4ths, fingering gear moves through the scale's cycle. Easy = from the lowest root to the top of the position (only the notes below that root are dimmed); Intermediate adds the notes below the root.
- **Directions**: the bebop scales no longer carry asc/desc shapes — fingerings were
  dropped 2026-09-10 and the pairs merged (see fretboard/CLAUDE.md) — so
  `variant(id, dir)` / `posId(pos, dir)` now pass everything through unchanged; the
  machinery stays for any future directional set. Concepts still ascend and descend
  as before, off the one shape.
- **Alternates**: a note with a 4th element `1` is the same pitch in the other place it
  falls at the edge of the position. `placeAt` keeps those out of `dots` (they would
  double a pitch in a run) and returns them as `alts`; `svgShape` draws them dashed and
  the legend reads "either string, your call". Bebop dots have no fingers to print, so
  they fall back to degree labels.
- **Extended shapes** (Intermediate and up): all in-key notes within the position window, hollow dots. Fingers assigned by offset: 5-fret spans 1-2-3-4-4, 6-fret spans 1-1-2-3-4-4; book fingers win where a book dot exists. These are computed, not transcribed.
- **Concept 2 Easy**: hold the starting key's root on the 1st string for six keys; the
  held note's function is computed per key from the scale (R 5 2 6 3 7 in major). Keys
  where the held note is not in scale are skipped and flagged (dorian and harmonic
  minor lose 2 of 6, mixolydian and melodic minor 1 of 6, phrygian dominant 3 of 6) —
  the book only defines this exercise for major.
- **Concept 3**: every placement of every shape, sorted up the neck, alternating ascend / descend.
- **Concept 4** (p. 69 rule): degree 1 uses I6 itself. Other degrees: window from one fret below the start note to three above, no notes below the start on the 6th string. "Based in" = the book shape with the most overlapping notes, with a strong preference for the shape whose lowest 6th-string note is the start note. Verified to reproduce all six labels printed on p. 69 in F (major). For other scales the rule is extrapolated and each card is flagged.
- **Concept 5** reuses sequences from 1–4 and dims the lower octave.
- **Concept 7** uses adjacent string pairs for 3rds–5ths, pairs a string apart for 6ths and up; degree arithmetic is modulo the scale's own length.
- **Concept 8** is text only; Segovia fingerings are not transcribed (and are major-scale material).

## Open questions for William
Whether the zigzag in concept 3 should start at the very lowest position or the lowest with a root on the 6th/5th string; the computed below-root fingers.
