# Voice-Leading Trainer

Practice tool for the rule on p. 79 of the Jazz Guitar Technique Handbook:
once inversions are learned, apply them to progressions and resolve to the
nearest inversion rather than jumping back to root position. Fourth app in
the voicing set, after Box Buddy, Shell Voicing Builder, and Inversion Drill.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage. Root `CLAUDE.md` conventions apply, including the lookahead
scheduler for anything that keeps time.

## Display
The path is drawn as a chart in staff notation, not as chord boxes: one
staff system per line, treble_8 clef, barlines, chord symbol above each
chord, the voicing as stacked hollow noteheads, and under each chord its
inversion + lowest fret ("2nd fr5") and the top note's motion from the
previous chord (↑2, ↓1, stays). The top note is stroked brass and a brass
line threads the top notes across the system: that line *is* the lesson,
so it gets the ink. Pitches are spelled from the chord (root + degree), with
double accidentals respelled enharmonically as a chart would.

Bars per system come from the chart's width (`perSystem`): fill the width at
no less than ~8.5 px per staff space, then snap to a phrase-friendly count
that divides the chart (16 / 12 / 8 / 4 / 2). A 48-bar whole-step drill is
three lines on a laptop, twelve on a phone; a 12-bar blues is 3×4 on a
laptop. A `ResizeObserver` re-flows on rotation or resize. Every system is
one `<svg>` sized in staff spaces with its height following the viewBox, so
the same drawing code serves every width. Tapping a chord strums it.

## Modes
- **Show the path**: the whole progression voiced as above. A "top line"
  strip under the chart names the melody the voicings make.
- **Reveal as I go**: same path, hidden; Enter or the button reveals the
  next chord (and strums it). With the metronome running, reveals follow
  the beat.
- **Choose the next**: for each chord, four candidate voicings, each drawn
  next to the previous chord (dimmed) on its own small staff so the top-note
  motion is visible in the cell; the recent path sits above on one staff
  with the chord in question as a "?". The student picks the one that moves
  least; the numeric motion under each cell shows after answering. Correct = any candidate within the minimum
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
- Shell Builder's rulings, ported (Sep 2026). `shellCandidates` applies them,
  on the B string only, so the drop families never see them. The two that
  depend on where a chord is heading get that from `voiceLead`, which stores
  it on each voiced chord as `heading`.
  - **Stand-ins** (ruled 2026-09-12 and 09-13, ported 2026-09-14). From a
    6th-string root the B string reaches only the 5th/13th family, and from a
    5th-string root only the 9th family, so a written tension outside that
    family used to fall back to the default without a word: G7b9 on 6R played
    R b7 3 13. The slot now takes the ruled stand-in: b13 for b9, **#5 for
    #9** (ruled 2026-09-14: "the rule is sharp 5 for sharp 9"), b9 for b13
    or #5, or 9 for #11. Only when no written tension fits the slot and the
    written one sounds nowhere else in the grip (a rootless shape can carry
    it on the E string), so a written note that can sound always wins. The
    code also carries Shell Builder's "13 for #11", but it can't fire on a
    dominant here: a 6R B string reaches the #11 itself.
  - **b13 into a minor V–i** (ruled 2026-09-12, ported 2026-09-14). A `7`
    chord (not 7sus4) whose root falls a perfect fifth into a chord with a
    minor third defaults its 6R B string to the b13 instead of the 13. The b13
    is the target's own minor third. On the 5th-string root the rootless shape
    has no sixth slot, so a `7` with no written extension tops out on the b13
    in place of the natural 5, `3 b7 9 b13` (ruled 2026-09-14, "Keep the b13",
    after William played both on Shell Builder's 19 library chords). That
    changed 19 rootless chords here, all in place, and Voice Leading and Shell
    Builder now agree on the top string of every dominant they voice at the
    same root and fret (they differed on 18). A written extension keeps the 5,
    as in Shell Builder. G7 to Gm7, or G7 to Em7 (where the 13 is Em7's
    root), is not a resolution and keeps the 13. Any written tension that
    fits the slot (13, b13, #5, #11, b5) still wins, and 7sus4 is left alone
    (no b13 on its list). The target is the literal next chord, as in Shell
    Builder, and a repeat sign parses to a copy of its chord, so
    `Bb7 | % | Ebm7` gives the first Bb7 the 13 and the second the b13.
  - **Tritone subs stay natural** (ruled 2026-09-12, ported 2026-09-14).
    Root down a semitone is a sub, and a sub is kept off that b13. In this
    engine that changes nothing, and can't: a sub and a minor V–i read the
    same next chord at different intervals, so no chord is ever both, and
    every other default is already natural (13, 9, root, 5th). The gate is
    there so the precedence matches Shell Builder if a default ever changes.
    A written alteration on a sub still wins, and so does its stand-in.
  - Choose mode builds its options with the voiced chord's `heading`. If it
    didn't, 168 path voicings in the library would be missing from the
    options it offers; `candidates` without a heading builds every chord as
    if it were heading nowhere.
  - What the #9 stand-in and the b13 default changed, against 1217231, with
    the seven key-transposable presets in all 12 keys. Rootless shells: 142
    chords 13 to b13, no position moves. Rooted shells: 24 chords 13 to b13
    and Blue Bossa's two G7#9 13 to #5, all in place, and 16 chords of Have
    You Met Miss Jones moved. Its first D7 into Gm7 now tops out on the b13,
    the same 3 semitones from the Fmaj7 as the old 5th-string 9 but a fret
    closer, so the greedy path climbs: bars 2–17 run at root frets 6–12
    instead of 1–5 and rejoin at the Abm7 in bar 18. Over the chart the top
    line moves 53 semitones instead of 55 and the hand travels 57 frets
    instead of 55; no grip spans more than 2 frets. Drop families: 0.
- `cost(prev, next)`: |top-note motion in semitones| × 1 + |position
  difference| × 0.25. Top-note motion dominates on purpose: that's what the
  ear follows. For the first chord, lean toward the middle of the neck.
- `voiceLead(bars, family)`: greedy nearest-neighbour through the chart.
  Greedy is correct here because that's the rule being taught; a global
  optimum would sometimes tell the student to make a worse move now for a
  better one later, which is not the lesson.
- Metronome: `setInterval` at 25 ms scheduling 130 ms ahead, clicks on 2 and
  4, one-bar count-in, chords strummed on their beat via the same clock.
  Slot highlighting is a `setTimeout` derived from the scheduled time, so
  the visual is driven by the audio clock, never the other way round. When
  the path moves to a new system the page scrolls that system into view —
  one jump per line, not a moving cursor.
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

## Practice strip (Sep 2026)
Carries the shared bottom strip (Metronome and Benchmarks; this page's list is generated from `briefs/benchmarks.md` — edit it there and run `node scripts/benchmarks-sync.js`) — see root `CLAUDE.md`, "Practice strip". Synced from `arpeggios-deck` by `scripts/strip-sync.js`; never hand-edit the copy. `play()` calls `window.pfMetronomeStop()`, so the trainer's own metronome stops the strip's (William, 2026-09-19).
