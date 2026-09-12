# Scales deck

Shown in the UI as **Scale practice** (renamed Sep 2026); the folder and
URLs are unchanged.

Interactive walkthrough of Scale Practice 101 (JGTH pp. 61–64). Self-contained `index.html`.
Carries the shared `SCALES` block (see `../fretboard/CLAUDE.md`); keep it byte-identical
across the three apps until the renderer is factored out.

## Structure
- `CONCEPTS[n].steps()` returns an array of cards `{ p | svg | text, key, shape, sub, instr, opts, flag }`
  (concept 6 cards also carry `string`).
- `state = { scale, key, concept, tier, interval, pattern, i }`. Scale (major / dorian /
  mixolydian / harmonic minor / phrygian dominant / melodic minor / four bebop
  scales) is selectable; all concept logic reads `SCALE().steps`, `.degrees`,
  `.cycle` and `.shapes` rather than the old MAJOR/DEG globals.
- Cards render via `svgShape(placement, opts)` (positions) or `svgStrings(key, strings, links)` (horizontal lanes, frets 0–17).
  Both stamp their geometry on the `<svg>` (`data-geom`, `data-cw`, `data-ch`, `data-padl`, `data-padt`,
  plus `data-minf` or `data-strings`) so the player can place its highlight. `opts.also` adds notes the
  card's line plays that the diagram wouldn't draw (drawn hollow).
- The Interval and Pattern controls show only on tiers that read them (not concepts 4 and 8).

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
  the book only defines this exercise for major. Each card shows a placement that holds
  the note as a dot, nearest the previous card's. Where none does (card 3 in dorian,
  harmonic minor, melodic minor and melodic minor bebop; card 4 of 4 in half-whole: the note
  is Middle 6's 9th), it takes one whose window holds it, the cycle's fingering for that key
  first, as p. 67 cycles them (added 2026-09-11 with the player, flagged to William; before,
  those 60 cards showed a shape without the held note). Because each card is chosen nearest
  the previous one, 7 later cards moved too (dorian, melodic and melodic minor bebop A card 4
  P6→M5, now matching p. 67; harmonic Bb and A card 4 and melodic / melodic bebop A card 5
  I6→P6), and concept 5's Easy 2 reuses these cards (its 60 fallback cards took the new
  placements and, as before, draw neither the held note nor its ring). The first card starts
  on the scale's first cycle fingering (Pinky 6; Ring 6 in half-whole, which used to throw).
- **Concept 3**: every placement of every shape, sorted up the neck, alternating ascend / descend.
- **Concept 4** (p. 69 rule): degree 1 uses I6 itself. Other degrees: window from one fret below the start note to three above, no notes below the start on the 6th string. "Based in" = the book shape with the most overlapping notes, with a strong preference for the shape whose lowest 6th-string note is the start note. Verified to reproduce all six labels printed on p. 69 in F (major). For other scales the rule is extrapolated and each card is flagged.
- **Concept 5** reuses sequences from 1–4 and dims the lower octave.
- **Concept 7** uses adjacent string pairs for 3rds–5ths, pairs a string apart for 6ths and up; degree arithmetic is modulo the scale's own length.
- **Concept 8** is text only; Segovia fingerings are not transcribed (and are major-scale material).

## Player (Sep 2026)
A Play bar under the card: Play/Stop (Space), tempo (40–240 BPM in steps of 4, starts at 100),
Straight/Swing (straight by default, William's ruling; hidden on quarter-note lines), click on 2
and 4 (on by default), a large finger readout for concept 6, and a count strip: a label row,
then the bar's eighths (or the count-in) with the current one lit and the meter when a bar is
short. All settings live in memory only.
- `cardPerformance(n, cards, i, tier, key)` (engine block) says what a card plays: concepts 1
  and 2 on every tier, concepts 3 and 6 on Easy, concept 8 wherever the card carries a
  transcribed fingering; `null` elsewhere, and the Play bar hides. Whether a card plays is a
  question about the **card**, not the concept — concept 8's Easy and Advanced 1 cards play
  while its Intermediate and Advanced 2 cards beside them stay text. Concepts 4, 5 and 7 still
  have no lines, and nor do concept 3 above Easy or concept 6 above Easy: **10 of the 32
  concept/tier combinations play, 22 are silent.**

## Concept 8, the Segovia fingerings (Sep 2026)
`SEGOVIA` (below `OPEN_MIDI`, which `SEG_MOVABLE` reads at load — it sat above it for one
commit and the temporal dead zone killed the whole script while still parsing cleanly, which
is why `scripts/syntax-check.js` did not catch it and `check.js` did) holds all seven
fingerings from pp. 73-75 as `"string/fret/finger"` in playing order, ascending then
descending. 287 notes: #1 is 29 and two octaves, the rest 43 and three.
- Transcribed from four independent readings of the page — three off the PDF text layer, one
  off 300 dpi raster geometry — which agreed on every note. Verified as music afterwards:
  each ascent is strictly stepwise and perfectly diatonic in its printed key.
- **One note corrected against the page, RULED 2026-09-12.** #1's twelfth ascending note is
  TAB'd 2nd string fret 7, an F# in C major. The noteheads step evenly either side of it, #1
  carries no accidental anywhere, the page's own descent TABs that same pitch as fret 8, and
  the printed 1-2-4 works over frets 5-6-8 but not 5-6-7. William ruled it fret 8, as he did
  the p. 66 and p. 71 misprints, so the table holds 8 and `check.js` pins it explicitly —
  a revert to the printed 7 fails by name rather than as a stray off-key note. With the
  correction in, all seven fingerings are stepwise and diatonic with no exceptions, and #1
  joins #7 as the two whose descent retraces the ascent exactly; check.js asserts that too,
  since it is a property that only holds once the note is right.
- `SEG_MOVABLE` is p. 64's "#2 and #5 ... moveable 3-octave pattern off the 6th and 5th
  string". Both halves of that sentence matter: #1 also has no open string, and what rules it
  out is being the two-octave one. `segShift(f, key)` returns the fret offset or `null` when
  the shape leaves frets 1-19.
- `perfSegovia` plays the transcription as printed and re-derives nothing — five of the seven
  descend by a different route than they ascend, so there is no ladder to walk. Fingers sound
  on every note, concept 8 being one of the places round 1 named the fingering as the lesson.
- `svgSegovia` borrows `svgStrings`' geometry (so `paintNote` and the highlight work
  unchanged) but draws six strings out to fret 19, only the fingering's own dots, labelled
  with the finger, and threads the ascent in playing order.
- `check.js` does not replay the data against itself, which would prove nothing; it asserts
  the transcription is still music — stepwise, diatonic, 287 notes, fingers on every note,
  `SEG_MOVABLE` exactly #2 and #5, and the misprint still at note 12 and nowhere else.
- `schedule(perf, bpm, swing, clicks)` (engine block) turns a line into an audio timeline: one
  bar of four quarter-note clicks, accent on 1; clicks on beats 2 and 4 of every bar (a 3/4 bar
  has only 2); swing is long-short 2:1 inside each beat. check.js tests it against hand-worked
  times.
- The UI runs the root CLAUDE.md lookahead scheduler (25 ms tick, 120 ms ahead) over that
  timeline. Clicks are always scheduled and gated as they're queued, so the Click toggle is
  live. A tempo or Straight/Swing change re-times the rest of the line from the next bar line
  nothing has been queued past (during the count-in it restarts the count-in) — a practice-feel
  choice flagged to William.
- iOS, ported from two-and-four: `navigator.audioSession.type = "playback"` before the context;
  `unlockAudio` inside the Play tap resumes from any non-running state ("interrupted" after a
  call or alarm), starts a silent buffer, and loops a silent `<audio>` so the ringer switch
  doesn't mute Web Audio on Safari before 17; a Screen Wake Lock while playing; and
  `visibilitychange` resumes the context and re-takes the lock. **Confirmed playing on a real
  iPhone, 2026-09-12.** He reported it plays; the ringer-switch, lock-screen and
  call-interruption paths have not been separately exercised.
- The highlight and count strip read `heardTime()`: the audio clock less the output latency
  (from `getOutputTimestamp` when it agrees with `currentTime` within 0.5 s), so a Bluetooth
  speaker doesn't put the ring ahead of the note. Nothing visual drives timing.
- Each run plays through its own gain bus; Stop fades it in about 15 ms, so a long final note
  doesn't ring under the next count-in.
- Fingers appear next to the lit note only where they are the lesson: concept 3's shifts and
  every note of concept 6 (also printed large in the Play bar: on a phone the lane is 19 px tall).
- One card at a time: any step, key, tier or pattern change stops playback. Concept 3: Play runs
  the zigzag from the pair of the card on screen up the neck, and the card turns to whichever
  placement the hand is in (`show(true)`); meanwhile the diagram keeps its starting height, the
  card never shrinks and the sidebar isn't touched, so the Play bar and Prev/Next stay put. Stop
  then Play starts again from the pair on screen. Both defaults were chosen without a ruling and
  flagged to William.
- A mouse or touch click drops focus from its button (keyboard activations keep theirs), so
  Space plays after clicking Next or +. The tempo buttons don't double-tap zoom; the BPM is a
  polite live region.
- Voice and click are the round-3 listening proof's: a plucked triangle plus octave sine through
  a closing low-pass, and a short square click.

## Note path engine (Sep 2026)
Block between `===== note path engine =====` markers, just before state + ui. It builds what
the player plays: `{ unit, bars: [{ len, notes: [{ string, fret, finger, dur, pos, midi, note,
ext, reach }] }], flags }`. `node check.js` replays the printed examples and William's picks,
compares every Advanced line with a separate statement of his turn rule, builds every concept's
cards on every tier and checks each card plays exactly its own line, checks the player timeline,
and sweeps every scale × key. The concept 6 run and shift counts are pinned in check.js; update
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
- Round 4: the bebop strings where those two picks collide stay as the engine plays them
  ("Let's leave for now. If it bugs me we'll fix."); playback defaults to straight eighths; he
  asked to hear concept 2's Advanced turn before ruling on it (added to the listening proof);
  "Yes build it" for the player, held from GitHub until the animation is in.

- **Ladder**: one location per pitch. Book dots win; computed in-window notes fill gaps;
  Middle 6's 9th is always on offer, Easy included (`topMidi` turns there);
  below the root the index may reach one fret under the lowest dot on strings 4–6 (open
  string allowed). That reach reproduces p. 65's G M5 (C on the 6th string, 8fr) and
  removes every leap the sweeps found in harmonic minor, mixolydian and phrygian dominant.
  Two computed locations for one pitch → the one nearest the previous note.
- **Rhythm**: continuous eighths in 4/4 (pp. 65–68), quarters for concept 6 (p. 71), played
  straight by default. Nothing is held mid-line; the final note rings to the end of its bar.
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
  his 2a pick, awaiting his ruling: it makes concept 2's climb the same as concept 1's for the
  fingering, often a single leap back to the root, and with 1231 the root lands on an & on 336
  of 1,728 cards. The climb picks the nearest location per pitch, so on 48 lines (dorian M5,
  phrygian dominant bebop I5) a pitch sits somewhere else going up than it did coming down.
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
  strings and William's picks. In the bebop scales, 288 strings have a chromatic run and every
  run stays whole on 222; on 66 a whole run would need a one-note position (54) or that and a
  6-fret shift (12), so the run is split; on 42 phrygian dominant bebop strings the whole run
  forces a 6-fret shift and is kept. William left these as they are (round 4).
- **Printed examples**: all 24 match note for note (the p. 66 and p. 71 fixtures carry
  William's misprint corrections), plus his four concept 6 picks, one unchanged string and the
  pinned concept 2 fallback. `KNOWN` in check.js is empty.
- **Deck issues found, not fixed**: concept 2 Easy prefers placements that hold the ringed note
  as a *dot*, so Bb and Eb get I6/I5 where p. 67 cycles through M6/M5 (the note is in-window
  there). Every printed P6 example uses "B on 3rd string", not the deck's default.

## Rulings, round 5 (2026-09-12)
- **Concept 2's Advanced turn is B, the echo skip** — `walkTurn`, which is what the engine
  already did, so nothing changed. He ruled it off the listening proof's three B cards,
  including the two he had flagged as arguing against it: `C Pinky 6 / 1231`, where the line
  ends inside the last group down with no climb at all and the root on an `&`, and
  `F Pinky 5 / 1234`, where five notes come back up instead of eleven. Concept 2 now turns
  exactly as concept 1 does, which was the point of the rule.
- **The flagged player defaults all stand**: the highlight on the card's own diagram; one card
  at a time, with concept 3 following the hand up the neck; 100 BPM; clicks on 2 and 4 on;
  tempo and feel changes taking effect at the next bar line; Play only where the engine has a
  line; and the concept 2 Easy fallback with its 7 knock-on cards and concept 5 Easy 2.

## The last five, decided (2026-09-12, mine on his say-so)
He asked me to decide these rather than rule on them, so each is flagged as my call and each
was settled against the engine rather than from the notes — two of the five turned out not to
be questions at all, and the counts in the old list were wrong.

- **The concept 3 zigzag start: no change, and the question was moot.** All six shapes in the
  cycle root on the 6th or 5th string, so "the very lowest position" and "the lowest with a
  root on the 6th/5th string" name the *same card* — verified across all 132 scale x key
  combinations, 0 disagreements. F major's first card reproduces p. 68 note for note
  (`6:1 6:3 6:5 5:1 5:3 5:5 4:2 4:3`).
- **The computed below-root finger stays 1.** It is the rule's own definition: the note is in
  the ladder *because* the index can reach a fret below the lowest dot, so the index is what
  plays it. It shows only in concept 3, where fingers are the lesson, and a reach is exactly
  what a finger number should tell you — how to get the note without moving the hand.
- **Concept 2's climb now reuses the locations the descent used (CHANGED).** `located` takes a
  `reuse` flag; concepts 1 and 2 pass it, concept 3 must not, since its whole subject is the
  same pitches in the next position up. Without it a line could return to a pitch five frets
  from where it just played it — Eb Middle 5 played midi 49 at 5:4 on the way down and 6:9 on
  the way back — a shift the exercise never asked for. **144 lines** carried a split (the old
  note said 48); now 0, and all 31 printed examples still match, so the book is compatible.
- **The 72 Middle 6 cards starting above the 9th: no change, not a bug.** They start on the
  shape's highest 1st-string note, which is what concept 2's own instruction asks for
  ("from the highest note on the 1st string to the lowest note on the 6th"). His "Middle 6
  turns on the 9th" ruling is about concept 1's *turnaround*, a different moment.
- **Concept 3 Easy no longer dims (CHANGED).** Concept 1 Easy dims below the lowest root
  because its instruction is "from the lowest root up". Concept 3's says the opposite —
  "continue scalar motion to the bottom of the next one up" — and the zigzag goes there: on
  the first card of C major it played **eight** notes on the 6th string that were drawn greyed
  out, with the playback highlight lighting dots the card presented as optional. A note the
  line plays is in the exercise by definition. **564 card-sets** were affected (the old note
  said 329 cards); now 0.

## Open questions for William
None outstanding on the engine. What is left is not a question but work: concepts 4, 5 and 7
have no lines (and nor do concept 3 or 6 above Easy), which is 22 of the 32 concept/tier
combinations.
