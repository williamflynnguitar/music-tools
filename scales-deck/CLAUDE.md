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
William's picks, compares every Advanced line with a separate statement of his turn rule, and
sweeps every scale × key. The concept 6 run and shift counts are pinned in check.js; update
them deliberately if the scales or the ranking change.

William's rulings, all 2026-09-11:
- Round 1: fingers only where they are the lesson (concept 3's shifts, concept 6, later 8), not
  for in-position runs; playback at a set BPM with sound; the top note is played once in every
  tier ("for now"); Advanced patterns turn around at the shape's edge, borrowing notes only
  where it makes sense, flagging heavy out-of-shape movement.
- Round 2: Middle 6 turns around on the 9th ("I almost always use that note as the turnaround
  note in the shape"), in every scale the step above its 1st-string root; the index reach is
  "an acceptable rule"; p. 71's ascending 4th-string F is a misprint for 2, and p. 66's
  descending E on the 5th string, 7fr (C Index 6) a misprint for the 6th string, 12fr. Concept 3
  must be "one continuous exercise in eighth notes instead of a pause on a held note".
- Round 3 (a listening proof: options side by side with playback, as a claude.ai artifact): he
  took every recommendation (turnarounds "skip the echo group", concept 3 "book join", concept 2
  "back up to the root") and on concept 6 kept the rule and the app's fingerings, except G
  harmonic minor string 1 (three notes in the first position rather than a 6-fret shift) and
  the bebop chromatic runs (one position, one finger per fret).

- **Ladder**: one location per pitch. Book dots win; computed in-window notes fill gaps;
  Middle 6's 9th is always on offer, Easy included (`topMidi` turns there);
  below the root the index may reach one fret under the lowest dot on strings 4–6 (open
  string allowed). That reach reproduces p. 65's G M5 (C on the 6th string, 8fr) and
  removes every leap the sweeps found in harmonic minor, mixolydian and phrygian dominant.
  Two computed locations for one pitch → the one nearest the previous note.
- **Rhythm**: continuous eighths in 4/4 (pp. 65–68), quarters for concept 6 (p. 71). Nothing
  is held mid-line; the final note rings to the end of its bar.
- **Concept 1**: Easy root → top → root. Above Easy: root → top → lowest → root (p. 65's
  parenthesised notes); a note that would repeat across a turn is dropped (`walk`). Advanced
  tiers walk the same path with `[1, interval]` or the pattern digits through `walkTurn`:
  groups start on every step while the whole group fits the leg; at a turn the group that
  would start on the turning note just played is skipped whole ("skip the echo group"), so 2-
  and 4-note groups stay on the beat; on the last leg the group that would land on the root is
  left out and the root follows alone. A group that would still start on the note just played
  at a turn (typed patterns like 1243) is skipped whole too; repeats a pattern makes inside a
  leg (1221, 1232) are its own and stay. A pattern with no usable digit plays plain steps. The
  root lands alone on a beat for intervals and for patterns that end on their highest digit
  (1234); with 1231 it is the last note of the bottom group and can land on an &, as in the
  judged rule he heard.
- **Concept 2**: from the ringed 1st-string note down. Easy stops on the lowest root (p. 67).
  Above Easy the line goes on to the lowest reachable note and climbs back to the root. The
  ring's string and fret are pinned only when the line starts on the ring pitch (patterns that
  don't start on 1 begin elsewhere). Advanced tiers turn with `walkTurn` too — our extension of
  his 2a pick, flagged: it makes concept 2's climb the same as concept 1's for the fingering,
  often a single leap back to the root, and with 1231 the root lands on an & on 336 of 1,728
  cards. The climb picks the nearest location per pitch, so on 48 lines (dorian M5, phrygian
  dominant bebop I5) a pitch sits somewhere else going up than it did coming down.
- **Concept 3**: up placement k from its root to its top, on up to k+1's top, down k+1 to the
  scale step below k+2's root; a last unpaired placement climbs and returns to its root.
  When Middle 6's 9th sits above k+1's top (dorian, the minors, bebops, half-whole), the line
  turns on the 9th and comes straight down through k+1. Every ascent starts on beat 1: when
  the eighths between ascents come out odd, the descent skips the new root just before it
  (…G E | F, p. 68 bar 4), and the bar before the ascent keeps whatever whole beats are left
  (3/4, 2/4 or 1/4; 14 of 36 major joins get a one-beat bar). Fingers on both notes of every
  change of placement; none in the bebop scales, which carry no fingers.
- **Concept 6**: lowest scale note (open if in the key) to the highest at or below 15fr and
  back, same fingers both ways. `stringFingers` enumerates hand positions of 2–4 notes spanning
  at most 3 frets (one-note positions only if nothing else fits) and ranks: one-note positions;
  split chromatic runs (three or more frets in a row, the bebop passing tones, stay in one
  position, one finger per fret); extra three-note positions (a whole run's own position
  doesn't count); a three-note first position; 1–2 pairs; 1–3–4 over 1–2–4; the lower
  three-note position. If the winner needs a shift over 5 frets (p. 71's longest, index to
  index), the plan whose longest shift is shortest wins instead. Reproduces all six p. 71
  strings and William's picks.
- **Printed examples**: all 24 match note for note (the p. 66 and p. 71 fixtures carry
  William's misprint corrections), plus his four concept 6 picks. `KNOWN` in check.js is empty.
- **Deck issues found, not fixed**: concept 2 Easy picks placements that hold the ringed
  note as a *dot*, so Bb and Eb get I6/I5 where p. 67 cycles through M6/M5 (the note is
  in-window there). Every printed P6 example uses "B on 3rd string", not the deck's default.
  Concept 2 Easy throws for half-whole diminished (`posId("P6", "desc")` in its fallback);
  flagged as its own task.

## Open questions for William
Whether the zigzag in concept 3 should start at the very lowest position or the lowest with a root on the 6th/5th string; the computed below-root fingers.
Engine, still open after round 3:
- Concept 6 cases his picks don't settle, all in the bebop scales. 288 strings have a
  chromatic run; every run stays in one position on 222. On the other 66 a whole run would need
  a one-note position at the bottom or top of the string (54 strings; e.g. major bebop from
  fret 1 plays [1 3] [4 5], not [1] [3 4 5]) or that and a 6-fret shift (12), so the engine
  splits the run. On 42 phrygian dominant bebop strings the whole run forces a 6-fret shift,
  and the engine keeps the run whole.
- Straight or swing eighths as the playback default (asked, not yet answered).
- Concept 2's Advanced tiers using his 2a turn (see Concept 2 above) — flagged for his veto.
- Whether concept 2's climb should reuse the locations the descent used (48 lines differ).
- 72 Intermediate Middle 6 concept 2 cards start a step above the 9th.
