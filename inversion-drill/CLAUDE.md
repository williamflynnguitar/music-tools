# Inversion Drill

Practice tool for the Drop-2 and Drop-3 chapters of the Jazz Guitar Technique
Handbook (pp. 52–59) and the Horizontal Harmonic Key Study (p. 82). Third
app in the voicing set, after Box Buddy and the Shell Voicing Builder.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage. Root `CLAUDE.md` visual conventions apply.

## Modes
- **One chord**: root + quality + string set → the four inversions, lowest
  position first, plus the next octave of the first so the cycle is visible.
  Cards show which tone is in the bass and on top; the top note's dot is
  brass. Click a card to hear it.
- **Through a key**: key + tonality (major / harmonic minor / melodic minor)
  + one inversion held constant → every diatonic 7th chord climbing the neck,
  with roman numerals. This is the p. 82 exercise.
- **Drill**: unlabeled voicing, one of three questions (which inversion,
  what's on top, what's in the bass), four choices. Optionally draws from all
  five string sets. Streak is in memory only.

## Architecture
- No shape tables. `realize(pc, quality, set, inversion)` builds the close
  voicing for that inversion, drops the second-highest note (drop-2) or the
  third-highest (drop-3) an octave, and realizes it on the set's strings as
  strictly ascending pitches, keeping spans ≤ 5 frets. It returns every
  playable position between frets 1 and 15.
- String sets: drop-2 on 4-3-2-1, 5-4-3-2, 6-5-4-3; drop-3 on 6-4-3-2 and
  5-3-2-1 (one string skipped, as in the Handbook).
- `diatonic(tonic, scale)` stacks thirds on each scale degree and matches the
  result against `QUAL` by third/fifth/seventh; roman numerals are derived
  from the degree's relation to the major scale (b for lowered, lowercase for
  minor-third chords).
- `spell()` picks flats or sharps from the key.
- Audio is a one-shot strum (triangle + octave sine, exponential decay),
  staggered low to high. Not scheduled; nothing here is a time reference.
- `QUAL` is keyed the same as in Box Buddy and the Shell Voicing Builder but
  stores `tones` rather than third/seventh/fifth fields.

## Next
- Voice-leading trainer: ii-V-I cycles with nearest-inversion resolution,
  reusing Box Buddy's proximity chooser.
- Show all positions of an inversion (currently the lowest), for players
  working above the 12th fret.
- Close-position and open triads on the same engine (three notes, no drop).

## LilyPond export (added)
"Download .ly" writes what's on screen as a LilyPond file via the shared
`lyDocument()` (copied into each app; keep in sync). Output follows Argue's
*Music Preparation Fundamentals*: part name top left, source top right,
title centered, 0.5in margins, a measure number under every bar, metronome
mark before the style word. Voicing apps emit treble_8 staff + TAB with
chord symbols (Δ7 for major 7); Box Buddy emits a slash-notation chart with
`\fret-diagram-verbose` boxes above each chord. Render with
`lilypond file.ly`.

## Through changes (added)
- Fourth mode. Takes the current voicing/string set through a progression, choosing for
  each chord the inversion whose top note moves least from the previous chord (hand travel
  as tiebreaker) — the p. 79 rule, greedy on purpose. Rendered as a chart, not cards:
  4-bar systems with barlines and bar numbers, four rhythm slashes per bar, chord
  symbols above their beats (beat 1, or 1 and 3 in split bars), a fret diagram with
  the brass top note above each symbol, and a small inversion/motion tag between
  them. Click a chord to hear it; a top-line strip reads the melody the voicings
  make; "Strum through" plays it; "Download .ly" exports staff + TAB.
- Progressions are the Handbook's practice pages (pp. 86–95), generated: major and minor
  ii-V-I descending in whole steps, I-vi-ii-V and tonal progressions around the cycle,
  blues in Bb and F, rhythm changes A section; plus a paste box. `TUNES` holds all 14
  leadsheets (pp. 109–123) in the same `{name, text}` form; entries appear in the
  progression menu automatically. The chord parser is Box Buddy's (copied; keep in sync).
- Voicings are the plain 7th-chord tones on the chosen set; alterations in a symbol
  (G7b9) are shown in the label but not voiced, since drop voicings here carry no
  extensions. For altered voicings use the Voice-Leading Trainer.

## Mobile chart (Sep 2026)
Below 560px the through-changes chart (`.sys`) goes one bar per line so a
two-chord bar keeps two full-size diagrams side by side and still reads as
one bar (its own beat row underneath); slot SVGs are capped at 100% width.
Same treatment as Shell Voicing Builder's chart — keep them in step.

## Study row (Sep 2026)
Exactly four cards, one per inversion, lowest position first — the octave
repeat of the first inversion ("so the cycle is visible") read as a fifth
inversion at a glance and was removed per William. The key-study ladder
below keeps its octave-tonic wrap (roman numerals make it read correctly
there); flag it if that should go too.
