# Voice-Leading Trainer

Practice tool for the rule on p. 79 of the Jazz Guitar Technique Handbook:
once inversions are learned, apply them to progressions and resolve to the
nearest inversion rather than jumping back to root position. Fourth app in
the voicing set, after Box Buddy, Shell Voicing Builder, and Inversion Drill.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage. Root `CLAUDE.md` conventions apply, including the lookahead
scheduler for anything that keeps time.

## Modes
- **Show the path**: the whole progression voiced, one card per chord, with
  the top note named and its motion from the previous chord (↑2, ↓1, stays).
  Brass dot is the top note. A "top line" strip under the chart reads the
  melody the voicings make.
- **Reveal as I go**: same path, hidden; Enter or the button reveals the
  next chord (and strums it). With the metronome running, reveals follow
  the beat.
- **Choose the next**: for each chord, four candidate voicings; the student
  picks the one that moves least. Correct = any candidate within the minimum
  cost. The chosen voicing becomes the path, so a "wrong" choice changes what
  the next question is measured against, as it would on the gig.

## Progressions
Built from the Handbook's practice-progression pages: major and minor
ii-V-I descending in whole steps (pp. 87–88), I-vi-ii-V around the cycle
(p. 89), tonal progressions around the cycle (p. 90), blues in Bb and F
(p. 93), rhythm changes A section (p. 94), plus a text box using the
Box Buddy parser. Minor i chords are voiced as -6. Blues bars 5–8 use the
standard jazz-blues layout (Eb7 | Eb7 | Bb7 | D-7 G7b9).

## Architecture
- `shellCandidates` (Box Buddy) and `dropCandidates` (Inversion Drill) are
  copied in; keep the three in sync. `candidates(chord, family)` dispatches.
- `cost(prev, next)`: |top-note motion in semitones| × 1 + |position
  difference| × 0.25. Top-note motion dominates on purpose: that's what the
  ear follows. For the first chord, lean toward the middle of the neck.
- `voiceLead(bars, family)`: greedy nearest-neighbour through the chart.
  Greedy is correct here because that's the rule being taught; a global
  optimum would sometimes tell the student to make a worse move now for a
  better one later, which is not the lesson.
- Metronome: `setInterval` at 25 ms scheduling 130 ms ahead, clicks on 2 and
  4, one-bar count-in, chords strummed on their beat via the same clock.
  Card highlighting is a `setTimeout` derived from the scheduled time, so
  the visual is driven by the audio clock, never the other way round.
- Two chords per bar switch on beat 3; one chord holds the bar.

## Next
- Comping Rhythm Randomizer: Charleston/bossa variations per bar on this
  same scheduler (p. 83–84). Could live here as a rhythm layer.
- Score the whole path (sum of top-note motion) and let the student compare
  their chosen path against the greedy one.
- Drop-2/drop-3 for the Handbook's guide-tone rule: prefer 3→7 / 7→3 on top
  through ii-V-I, not just nearest.

## LilyPond export (added)
"Download .ly" writes what's on screen as a LilyPond file via the shared
`lyDocument()` (copied into each app; keep in sync). Output follows Argue's
*Music Preparation Fundamentals*: part name top left, source top right,
title centered, 0.5in margins, a measure number under every bar, metronome
mark before the style word. Voicing apps emit treble_8 staff + TAB with
chord symbols (Δ7 for major 7); Box Buddy emits a slash-notation chart with
`\fret-diagram-verbose` boxes above each chord. Render with
`lilypond file.ly`.
