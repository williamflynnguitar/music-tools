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

## Note path engine (Sep 2026; not yet wired to the UI)
Block between `===== note path engine =====` markers, just before state + ui. It builds what
the planned neck animation plays: `{ unit, bars: [{ len, notes: [{ string, fret, finger, dur,
pos, midi, note, ext, reach }] }], flags }`. `node check.js` replays the printed examples and
sweeps every scale × key.

William's rulings (2026-09-11): fingers only where they are the lesson (concept 3's shifts,
concept 6, later 8), not for in-position runs; playback at a set BPM with sound; the top note
is played once in every tier ("for now"); Advanced patterns turn around at the shape's edge,
borrowing notes only where it makes sense, and heavy out-of-shape movement gets flagged;
shift rules for 3 and 6 are proposed here for his confirmation.
Round 2 (same day): Middle 6 turns around on the 9th ("I almost always use that note as the
turnaround note in the shape"), in every scale the step above its 1st-string root; the index
reach is "an acceptable rule"; p. 71's ascending 4th-string F is a misprint for 2, and p. 66's
descending E on the 5th string, 7fr (C Index 6) is a misprint for the 6th string, 12fr. Concept 3
must stay "one continuous exercise in eighth notes instead of a pause on a held note": the
engine's hold-to-the-beat at the joins is rejected, and its replacement is under review.

- **Ladder**: one location per pitch. Book dots win; computed in-window notes fill gaps;
  Middle 6's 9th is always on offer, Easy included (`topMidi` turns there);
  below the root the index may reach one fret under the lowest dot on strings 4–6 (open
  string allowed). That reach reproduces p. 65's G M5 (C on the 6th string, 8fr) and
  removes every leap the sweeps found in harmonic minor, mixolydian and phrygian dominant.
  Two computed locations for one pitch → the one nearest the previous note.
- **Rhythm**: continuous eighths in 4/4 (pp. 65–68), quarters for concept 6 (p. 71). The
  final note rings to the end of its bar. Concept 3 cuts the bar before each new ascent to
  a whole beat so the ascent starts on beat 1 (p. 68's 3/4 bars), holding the last note to
  the beat when the count is odd (the hold is rejected; see round 2).
- **Concept 1**: Easy root → top dot → root. Above Easy: root → top → lowest → root (p. 65's
  parenthesised notes). Advanced walks that path with `[1, interval]` or the pattern digits;
  a group starts only if it fits before the next turn; a note that would repeat across a
  turn is dropped; the line ends on the root.
- **Concept 2**: the ringed 1st-string note down to the lowest root (Easy) or the lowest
  reachable note (above Easy).
- **Concept 3**: up placement k from its root to its top, on up to k+1's top, down k+1 to
  the scale step below k+2's root; a last unpaired placement climbs and returns to its root.
  When Middle 6's 9th sits above k+1's top (dorian, the minors, bebops, half-whole), the line
  turns on the 9th and comes straight down through k+1.
  Fingers on both notes of every change of placement.
- **Concept 6**: lowest scale note (open if in the key) to the highest at or below 15fr and
  back, same fingers both ways. Two notes per hand position, the index leading every shift up
  (1–2 half step, 1–3 whole step, 1–4 augmented 2nd). An odd count puts three in one
  position; not the first if avoidable; fewest 1–2 pairs, then 1–3–4 over 1–2–4. This
  reproduces all six strings on p. 71.
- **Printed examples**: 23 of 24 match note for note (the p. 66 and p. 71 fixtures carry
  William's misprint corrections). Known difference (`KNOWN` in check.js): p. 68 bar 4 drops
  F to keep 3/4 in continuous eighths, where the engine still holds E (join rule under review).
- **Deck issues found, not fixed**: concept 2 Easy picks placements that hold the ringed
  note as a *dot*, so Bb and Eb get I6/I5 where p. 67 cycles through M6/M5 (the note is
  in-window there). Every printed P6 example uses "B on 3rd string", not the deck's default.

## Open questions for William
Whether the zigzag in concept 3 should start at the very lowest position or the lowest with a root on the 6th/5th string; the computed below-root fingers.
Engine (proof 1 sent 2026-09-11; William asked to *see* the rest): concept 3 joins without held notes (and the 2/4, 1/4 cut bars); interval/pattern turnarounds
that push pairs off the beat, and bare-eighth endings; whether concept 2 above Easy returns
to the root. He also asked what exactly the concept 6 rule confirmation means.
