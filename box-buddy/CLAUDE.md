# Box Buddy

Chord-diagram handout generator for jazz charts. The user is a band director
with no guitar knowledge: they type the chords of a tune, pick a comping style,
and print a page of chord boxes for their guitarist. Not to be confused with
Chartwright (pop-style lyric/chord sheets).

Single self-contained `index.html`, no dependencies, no build step, no browser
storage. Follows the root `CLAUDE.md` conventions (petrol/ink ground, bone text,
brass accent, monospace for data). The printed sheet is white paper and is
deliberately the loudest thing on screen.

## Architecture

**Parser** (`parseChordToken`, `parseInput`): text → bars → chord tokens.
Accepts Handbook notation (`^7`, `-7`, `ø7`, `°7`, `7(b9)`) and common
equivalents (`maj7`, `m7b5`, `dim7`, `alt`, `6/9`, slash chords with the bass
ignored). Unreadable symbols become "bad" chips the user can resolve with a
quality dropdown; overrides are keyed by token index in `overrides`.

**Qualities** (`QUAL`): nine 7th-chord qualities plus 7sus4, each with third,
seventh, fifth degree and the Handbook's allowed-extension list (p. 49).
Extensions not on the list are dropped and logged, never voiced.

**Engine — shells** (`shellCandidates`): voicings are computed from pitch,
not looked up. Rules from "Shell Voicings 101":
- 6R: root on 6, 7th on D, 3rd on G. 5R: root on 5, 3rd on D, 7th on G.
- B string default: 6R → 5th (13th on dominants); 5R → 9th (b3 on ø7/°7
  when rooted; 11/9 when rootless to avoid doubling).
- E string default: 6R → root moved up; 5R → 5th.
- Requested extensions replace the slot in their family (9-family or
  5-family) at the nearest fret to the root (`nearestFret`). This reproduces
  the B/E mobilization tables without storing them.
- **A dominant defaults to the 13, wherever it resolves** (William,
  2026-09-14: "I still want box buddy to default to 13 extension on a
  dominant chord. To illustrate to music educators and developing guitarists
  that that's the way we do it in jazz."). This is a deliberate difference
  from Voice Leading and Shell Builder, which default to the b13 when a
  dominant resolves down a fifth to a minor chord. Box Buddy carried that
  default, and the tritone-sub gate that only guarded it, for part of the
  same day; both came back out, so the engine reads no chord's destination.
- **Stand-ins for written alterations** (Shell Builder's rulings, 2026-09-12
  and 09-13, ported 2026-09-14). They touch only the B string, so they apply
  to styles that play it (`rootless` or `size>=4`), and Four-to-the-bar keeps
  its root-3rd-7th shell. When a written tension is outside the B string's
  family and sounds nowhere else in the grip, the slot takes b13 for b9,
  **#5 for #9** (ruled 2026-09-14), b9 for b13 or #5, or 9 for #11. A
  written note that can sound always wins, and a written alteration isn't
  the default the 13 ruling is about: F7(b9) in Bossa nova plays R b7 3 b13,
  not a 13 that would hide the flat nine. Shell Builder's "13 for #11" is in
  the code but can't fire on a dominant here, because a 6R B string reaches
  the #11 itself. Against the output before the stand-ins (1217231), with
  Voice Leading's 54-chart library run through Box Buddy in all 12 keys, the
  only change still standing is Blue Bossa's two G7#9 in Bossa nova, 13 to #5.
- The legend keys diagrams on chord label and position tag, and the chart
  points every chord with that label and tag at one diagram. That is only
  right while a label and position pin the notes. While the b13 default was
  in, they didn't (a G7 at 6R 3fr was R b7 3 b13 into Cm7 and R b7 3 13 into
  Cmaj7), and 25 library chords pointed at the wrong diagram. So where one
  label and tag carry more than one voicing, the tag names the highest note
  that differs ("6R 3fr · b13") in the legend, the chart and the in-order
  layout. Nothing triggers it now: every library chart in every style has one
  voicing per label and tag. It stays so a rule that reads context can't
  bring the bug back.
- Bossa nova used to add an alternating-bass marker, a dashed ring on the
  6th string for 5R chords at the quality's plain fifth, for the thumb to
  take on beat 3. It printed a natural 5 under charts that wrote #5 or b13.
  William removed it on 2026-09-14 ("eliminate the alternating bass
  entirely"), so the thumb stays on the root on 1 and 3.

**Engine — drop-2** (`drop2Candidates`): for each of the four close-voicing
inversions, drop the second-highest note, realize on strings 4-3-2-1 as
strictly ascending pitches, keep spans ≤ 4 frets. A requested 9 replaces the
root; a requested 5-family alteration replaces the fifth.

**Chooser** (`voiceProgression`): each chord picks the candidate whose anchor
(root fret for shells, mean fret for drop-2) is closest to the previous
chord's, plus small penalties for span and, in four-to-the-bar, for 5R.
The first chord leans low on the neck.

**Styles** (`STYLES`): each style = voicing family + size + rootless flag +
rhythm grid (8 eighth-note cells, optional bass row) + intro text. Adding a
style is adding an entry here.

**Renderer** (`diagramSVG`): 5-fret box, nut drawn when base fret is 1,
`Nfr` label otherwise, × on unplayed strings, chord-tone labels in the dots
(no fingerings yet). Legend is keyed by chord symbol *and* position, so a
symbol voiced two ways appears twice, with the position tag under each.

## Known gaps / next
- Fingering numbers (needs a fingering assigner; labels are chord tones for now).
- Bossa rhythm grid is a plausible one-bar pattern; adjust the arrays in `STYLES`.
- A "Guitar handout" link from Chartwright that passes chords via `?chords=`.
- The shell engine and renderer are meant to be reused by the Shell Voicing
  Builder practice tool; keep them free of DOM dependencies.

## LilyPond export (added)
"Download .ly" writes what's on screen as a LilyPond file via the shared
`lyDocument()` (copied into each app; keep in sync). Output follows Argue's
*Music Preparation Fundamentals*: part name top left, source top right,
title centered, 0.5in margins, a measure number under every bar, metronome
mark before the style word. Voicing apps emit treble_8 staff + TAB with
chord symbols (Δ7 for major 7); Box Buddy emits a slash-notation chart with
`\fret-diagram-verbose` boxes above each chord. Render with
`lilypond file.ly`.

## Mobile chart (Sep 2026)
Below 560px the chart grid drops from 4 to 2 bars per line (screen only —
printed handouts keep 4-bar systems), with the row-top border rule adjusted
to the 2-column layout. Same fix family as the Shell Voicing Builder /
Inversion Drill through-changes charts.
