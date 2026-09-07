# Comping Rhythms

Practice tool for the rhythmic-considerations pages of the Jazz Guitar
Technique Handbook (pp. 83–84): the Charleston rhythm and its variations for
swing, and bossa nova patterns for straight eighths. Fifth and last app of the
voicing/comping set.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage. Root `CLAUDE.md` conventions apply; timing runs on the lookahead
scheduler (25 ms interval, 130 ms lookahead).

## Vocabulary
- Swing: three placements of the Charleston (prime = 1 and the "and" of 2;
  delayed = an eighth later; anticipated = an eighth earlier, so the first
  hit is the "and" of 4 in the previous bar) × four duration shapes
  (long-short, long-long, short-short, short-long) = twelve rhythms.
  "Long" sustains to the next hit; "short" is a clipped eighth.
- Straight: four bossa patterns as starting points. These were not
  transcribed note-for-note from Ex. 12–14 (the notation didn't survive the
  PDF text layer) and should be checked and edited in `STRAIGHT` at the top
  of the script. Cells are eighths, 0 = beat 1, 7 = the "and" of 4, −1 = pickup.

## Modes
- **Read and play**: a 4/8/12-bar phrase, one rhythm per bar (or per 2 or
  4 bars), drawn as an eighth-note grid with hits and sustain bars. Play
  runs the click (2 and 4 for swing, 1 and 3 for bossa) with a one-bar
  count-in and, optionally, sounds the hits as a ii-V-I loop of drop-2
  voicings or as a muted stab, or stays silent so the student plays them.
  "Show the next bar only" hides all bars except the current and next once
  playback starts, which forces reading ahead rather than reading along.
  "New phrase each time round" regenerates on every pass.
- **Hear and name**: one bar of a rhythm loops with the click; the student
  picks the matching grid from four. Grids are unlabeled until answered.

## Architecture
- `buildHits(phrase)` flattens a phrase to absolute eighth-note times in
  beats, applies the swing ratio to off-beat cells (0.62 for swing, 0.5
  straight), and computes durations (long = until the next hit, wrapping to
  the first hit of the next pass).
- Each pass is scheduled one beat early (on beat 4 of the preceding bar) so
  that an anticipated pickup can land before beat 1. Bar highlighting is a
  `setTimeout` derived from the audio clock; the grid itself never moves.
- The chord loop is four hardcoded drop-2 top-set voicings (D-7 G7 CΔ7 CΔ7)
  taken from the Inversion Drill engine, so this file carries no engine.

## Next
- Let the student pick a progression (Box Buddy parser + Voice-Leading
  Trainer chooser) instead of the fixed ii-V-I loop.
- Bass/chord separation for bossa (thumb on 1 and 3, root/5th alternation,
  Ex. 13–14) as a second row in the grid.
- Density control: probability of a hit per cell, for free comping beyond
  the twelve named shapes.

## Notation (added)
The sixteen rhythms are pre-rendered with LilyPond (`RHY_SVG` at the top of
the script; SVGs use `currentColor` so the app's CSS colors them). Sources
live in `notation/rh/*.ly` in the repo; re-render with
`lilypond -dbackend=svg -dcrop` and re-pack if a rhythm changes. The
notation follows Argue's *Music Preparation Fundamentals*: staccato
quarters for short notes on the beat, no figure crossing beat 3 except the
listed exceptions, rests grouped to the beat. The eighth-note grid remains
as a toggle. Hit lengths are now explicit per rhythm (`LEN`, `len`), matching
the notation rather than "sustain to the next hit". Anticipated placement is
the pickup on the "and" of 4 plus the "and" of 2, per William's correction
to the Handbook.
