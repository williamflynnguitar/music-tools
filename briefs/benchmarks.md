# Benchmarks — the lists the tools show

**This file is the source.** Each tool's Benchmarks panel is generated from it:
edit here, then run

    node scripts/benchmarks-sync.js

and the lists in every page are rewritten (`--check` reports a page that is out
of step with this file). Never edit the generated script in a page by hand.

Shipped as written on 2026-09-19 on William's say-so ("go with what you've
written … I will edit them as I see fit as the students use them"). The wording
is Claude's draft from the handbook and the briefs, except where marked
William's; it is his to change at any time.

How a section is read:

- `## Heading` names the tool (the script maps headings to folders). A
  `### Sub-heading` starts a named list inside it — Arpeggio practice has two.
- Each numbered item is one benchmark: the target line, phrased as something
  to play.
- `- hint:` under an item becomes the smaller second line in the panel.
  Delete it for a one-line item.
- `- src:` and `conf:` are provenance for you and are never shown. **book** =
  the source says this, only rephrased · **order** = the content is from the
  source but the easy-to-hard placement is a guess · **guess** = a target the
  source does not state. The guess-heavy sections — Enclosures, Line Ladder,
  Two-and-Four, Fretboard — are the ones to look at first.
- Any other paragraph is a note and is ignored.
- To give a tool no list, delete its items; its Benchmarks button goes away.

No numbers were put in (tempos, streak counts) because no source gives any,
except "three keys" in Enclosures item 5, which is flagged there.

Checks are session-only in the tools ("Checks reset when you reload"); nothing
locks or unlocks on a check.

---

## Arpeggio practice  (pp. 25–36, 76–78)

Two lists, Triads and 7th chords (William, 2026-09-19). The panel shows both
under their own headings and marks the one matching the Chord size control.

### Triads

1. Play the diatonic triads of C major (C, Dm, Em, F, G, Am, B°) in one
   octave, ascending and descending, starting from any position on the neck.
   - src: William, 2026-09-18, verbatim · conf: —

This list has one item and I have nothing sourced to add: the handbook has no
triad arpeggio pages and the year lists name only 7th-chord arpeggios. The
rest of it is yours to write.

### 7th chords

1. Pick one 7th-chord shape (say index-finger maj7) and play it everywhere it
   falls in one key, lowest to highest.
   - hint: Practice → Parallel · one key (p. 76, Ex. 1)
   - src: p. 76 "staying in one key and one harmony and playing all those
     arpeggios around the neck" · conf: book
2. Take that same shape through all twelve keys around the cycle of 4ths.
   - hint: Practice → Parallel · through the keys (p. 76, Ex. 2)
   - src: p. 76 · conf: book
3. HDA: play the seven diatonic 2-octave arpeggios of a major key from the
   index finger, roots on the 6th string; then again with roots on the 5th.
   - hint: Practice → HDA (p. 77, Ex. 3)
   - src: p. 77; First Year list p. 164 · conf: book
4. VDA: inside one major scale fingering, play every diatonic arpeggio without
   leaving the position by more than a note or two. Do it in two fingerings,
   one from the 6th string and one from the 5th.
   - hint: Practice → VDA (p. 78, Ex. 4)
   - src: p. 78; First Year list p. 164 "at least two scale patterns on 6th
     and 5th" · conf: book
5. HDA again in harmonic minor: 2-octave, index finger, roots on the 6th and
   5th strings.
   - src: Second Year list p. 165 · conf: book (placing a second-year item on
     a first list is my call — strike it if this list should stop at year one)

## Scale practice  (pp. 61–64)

1. Play the major scale in four fingerings, two rooted on the 6th string and
   two on the 5th, up and back down.
   - src: First Year list p. 164 "major scales in 2 positions (each from both
     the 6th and 5th strings)" — four fingerings, William's reading,
     2026-09-19 · conf: book
2. Pick a key, start on P6, and go round the cycle of 4ths through all six
   fingerings without leaving the position.
   - hint: Concept 1, Easy (p. 61)
   - src: p. 61 #1 EASY · conf: book
3. Same trip descending: start from the 1st-string root, keep the same
   starting note all the way round, and say what it is in each new key
   (root, 5th, 2nd, 6th, 3rd, 7th).
   - hint: Concept 2, Easy (p. 62)
   - src: p. 62 #2 EASY · conf: book
4. One key, lowest fingering first: up one position, down the next, until you
   run out of neck.
   - hint: Concept 3, Easy (p. 62)
   - src: p. 62 #3 EASY · conf: book
5. One key, starting from I6: play a two-octave fingering from every degree of
   the scale, naming which of the six fingerings each one lives in.
   - hint: Concept 4, Easy (p. 63)
   - src: p. 63 #4 EASY · conf: book
6. Any of the above in thirds instead of steps.
   - src: pp. 61–63 ADVANCED #1 · conf: order

Left out on purpose, for you to add if wanted: single-string scales (#6),
intervals on two strings (#7), Segovia (#8), and the Dorian / Mixolydian /
Phrygian dominant lines from p. 164, which may belong on Fretboard instead.

## Fretboard  (pp. 6–23)

This is a lookup tool more than a practice sequence, so I am least sure it
wants its own list. Two options: give it the scale-fingering lines from the
year lists (below), or have it show Scale practice's list. **conf: guess**
for the whole section.

1. Play all six major fingerings in one key from memory, naming each.
   - src: p. 61 "Preliminary: the 6 scale fingerings", p. 7 · conf: guess
2. Dorian and Mixolydian in four fingerings each: two from the 6th string,
   two from the 5th.
   - src: First Year list p. 164 · conf: book
3. Phrygian dominant in all four positions.
   - src: First Year list p. 164 · conf: book
4. Harmonic minor in four fingerings: two from the 6th string, two from the
   5th.
   - src: Second Year list p. 165 · conf: book

## Shell Voicing Builder  (pp. 45–51)

Shells with roots first (William, 2026-09-19): the order below is p. 50's
to-do list, not p. 79's.

1. Build a three-note shell with the root for maj7, 7 and m7, at 6R and at
   5R, and say which of 3 and 7 is on the D string each time.
   - hint: Structure 1 (p. 46; to-do list p. 50)
   - src: p. 46, p. 50 "3-Note Voicing #1" · conf: book
2. Add the default B-string note to every shell: the 5th, or the 13th on a
   dominant, at 6R; the 9th at 5R.
   - hint: Structure 2 (p. 47)
   - src: p. 47, p. 50 "4-Note Voicing #1"; First Year list p. 164 "with 2nd
     string added" · conf: book
3. Drop the root: play rootless 3/7s through a major ii–V–I, descending in
   whole steps.
   - hint: Through changes (progression p. 87)
   - src: p. 79, Ex. 5, p. 87 · conf: book
4. Three-note rootless voicings with the B string through a ii–V–I, trying
   more than one voice-leading path.
   - src: p. 50 "3-Note Voicing #2"; p. 79 "extra time … exploring different
     voice leading options", Ex. 6 · conf: book
5. Mobilize the B-string note two frets up and two frets down and name the
   extension you land on, for each chord quality.
   - hint: p. 49
   - src: p. 49 · conf: order — the to-do list does not place mobilizing;
     putting it here is my guess
6. Four-note rootless voicings with the E string added, root visualized and
   not played.
   - src: p. 48, p. 50 "4-Note Voicing #2" · conf: book

## Inversion Drill  (pp. 52–59, 82)

1. Play the four inversions of one Drop-2 maj7 on the top string set, up the
   neck and back, saying which chord tone is in the bass each time.
   - hint: One chord (p. 53)
   - src: p. 53; p. 79 "time must be spent becoming familiar with all the
     inversions of each chord … before applying the chords to progressions"
     · conf: book
2. The same for 7, m7 and ø7.
   - src: p. 53 · conf: **guess** on which qualities come first; the book
     prints all seven with no order of priority
3. Key study: hold one inversion and play every diatonic 7th chord of B♭
   major up the neck.
   - hint: Through a key (p. 82)
   - src: p. 82 · conf: book
4. The same key study in B♭ harmonic minor.
   - src: p. 82; Second Year list p. 165 · conf: book
5. Items 1–3 on the middle string set.
   - src: p. 54; Second Year list p. 165 · conf: book
6. Drop-3 on the lower string set: four inversions, then the key study.
   - src: p. 58; Third Year list p. 166 · conf: book

## Voice-Leading Trainer  (p. 79; progressions pp. 87–94)

1. Major ii–V–I descending in whole steps, Drop-2 on the top set, always
   moving to the nearest inversion and never jumping back to root position.
   - hint: p. 79, Ex. 7; p. 87
   - src: p. 79 "be sure that care is being taken to resolve to the proper
     inversion … don't just jump around to the root position voicings"
     · conf: book
2. Minor ii–V–i descending in whole steps, the same way.
   - src: p. 88 · conf: order
3. I–vi–ii–V around the cycle.
   - src: p. 89 · conf: order
4. Blues in B♭, then in F.
   - src: p. 93 · conf: order
5. The A section of rhythm changes.
   - src: p. 94 · conf: order

The progressions are the book's; ranking them by page order as easy-to-hard is
my guess.

## Triad Voicings  (pp. 39–43, 81)

1. Play a close-position major triad in all three inversions on strings
   1-2-3, then on 2-3-4.
   - hint: Shapes (p. 40)
   - src: p. 40; First Year list p. 164 · conf: book
2. The same for minor, diminished and augmented.
   - src: pp. 40–41; p. 164 · conf: book
3. Key study: F major on strings 2-3-4, starting from C on the 2nd string,
   up the neck through the diatonic triads, saying each chord's number in
   the key.
   - hint: Key study (p. 81, Ex. 8)
   - src: p. 81 steps 1–4 · conf: book
4. Close-position triads on strings 3-4-5 and 4-5-6.
   - src: Second Year list p. 165 · conf: book
5. Open-position triads on the middle and bottom string sets.
   - src: pp. 42–43; Third Year list p. 166 · conf: book

## Quartal Voicings  (your Quartal Harmony handout; spec in briefs/)

1. Play one voicing family up and down the neck in one key, naming the top
   note's degree.
   - hint: Practice → Linear walk
   - src: spec §9 drill 1 · conf: book
2. Harmonize the notes of the pentatonic scale, then the blues scale.
   - src: spec §5.4 direction 1 (from the handout) · conf: book
3. Make a melody with the voicings, staying in one family.
   - src: spec §5.4 direction 2 · conf: book — but "make a melody" is not
     checkable the way your triad example is. Rewrite or strike.
4. Approach a voicing from a half step above or below.
   - src: spec §5.4 direction 4 · conf: book
5. ii–V–I in all keys round the cycle of 4ths.
   - hint: Practice → ii–V–I in all keys
   - src: spec §9 drill 5 · conf: book
6. Comp through Solar with quartal voicings.
   - src: spec §8, §9 drill 6 · conf: order

## Charleston  (pp. 83–84)

1. Comp the Charleston in its prime form through a progression with the click
   on 2 and 4.
   - hint: p. 83, Ex. 9
   - src: p. 83 · conf: book
2. Play all four long/short versions: long-long, long-short, short-short,
   short-long.
   - src: p. 83 · conf: book
3. Play the delayed and anticipated forms.
   - hint: p. 83, Ex. 10–11
   - src: p. 83; the anticipated form follows your correction to the
     handbook, as the app does · conf: book
4. The same three forms in the second half of the bar.
   - src: app family B — **guess**, the handbook does not separate this out
5. Hear and name: identify a rhythm by ear from the first-half family.
   - src: app mode — **guess**, not in the handbook

## Enclosures  (Enclosures 101 / Access Points / workbook)

There is no `enclosures/CLAUDE.md`, and I drafted from the build brief and the
page's own section headings without your PDFs open. **conf: guess**
throughout; this list needs the most rewriting.

1. Enclose the root, 3rd and 5th of a major triad in one key, then of a minor
   triad.
   - src: brief, content model §4 "Building Enclosures — Major / Minor"
2. Do it in all twelve keys.
   - src: brief §6 "all twelve keys"
3. Play the scale-based enclosure exercise in one key, ascending and
   descending.
   - src: brief §6, page section "Scale-based practice"
4. Enclose each access point, root through 13th.
   - src: brief §5 "Access Points — root through 13th"
5. Play one of the ii–V phrases from the vocabulary section in three keys.
   - src: brief §7 — "three keys" is mine; strike or replace

## Line Ladder

**conf: guess** throughout — the app generates lines; none of its sources
states a target for the student. Candidates only:

1. Play a generated line over a ii–V–I with every smoothing rung off, in time.
2. Turn on the rungs one at a time and play each version.
3. Play the line in a second key.

If this app should have no list, say so and the Benchmarks button stays off
here.

## Two-and-Four

No handbook source. The only checkable target the app itself defines is
Training Wheels' **Ready** badge (8 straight bars, every tap on the downbeat).
**conf: guess** throughout.

1. Training Wheels: earn Ready on rung 1.
2. Earn Ready on rung 7 (click only).
3. Standard mode: play through a full round with the default dropout and come
   out with the click still on 2 and 4.

## Proposed to carry no list

- **Composition assignments** — each prompt is already its own assignment.
- **Box Buddy, Stage Plot, Chartwright** — they make paper, not practice.

Tell me if any of these should have one.
