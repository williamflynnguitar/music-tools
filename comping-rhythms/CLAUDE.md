# Charleston

Swing comping practice tool, grown out of the rhythmic-considerations pages of
the Jazz Guitar Technique Handbook (pp. 83–84) and extended past them. Swing
only — the bossa material was removed in the Charleston rebuild. Folder and
URL stay `comping-rhythms/`; only the displayed name is Charleston.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage. Root `CLAUDE.md` conventions apply; timing runs on the lookahead
scheduler (25 ms interval, 130 ms lookahead). Click is always on 2 and 4;
swing ratio 0.62 on off-beat cells.

## Cell model

A rhythm is `{id, family, name, cells, len}`. Cells are eighths: `0` = beat 1,
`7` = the "and" of 4, `-1` = the "and" of 4 of the previous bar (pickup),
`8` = beat 1 of the following bar. `len` is per-hit in eighths and is the
**notated** value; playback derives long durations itself (see below).

## Vocabulary — five families, 40 entries

**A. Charleston, first half** (`ch1`, 12): prime `[0,3]`, delayed `[1,4]`,
anticipated `[-1,3]` × LS/LL/SS/SL. The `LEN1` table is notation-authoritative
(corrected by William — anticipated is the pickup plus the "and" of 2, per his
correction to the Handbook). Do not "fix" it:

|         | LS    | LL    | SS    | SL    |
|---------|-------|-------|-------|-------|
| prime   | [3,1] | [3,5] | [1,1] | [1,5] |
| delayed | [3,1] | [3,4] | [1,1] | [1,4] |
| antic   | [4,1] | [4,3] | [1,1] | [1,5] |

**B. Charleston, second half** (`ch2`, 12): prime `[4,7]`, delayed `[5,8]`,
anticipated `[3,7]` × four shapes. First hit long = distance to the second
hit (3/3/4), short = 1; second hit long = 4, short = 1. The delayed
placement's second hit (cell 8) belongs to the following bar: drawn in that
bar's grid row at cell 0, tinted; scheduled at `(b+1)*4`; sounds the next
bar's chord.

**C. On-beat pairs** (`pairs`, 12): two quarters starting on beat 1 `[0,2]`,
2 `[2,4]`, or 3 `[4,6]`. First hit long = 2, short = 1; second hit long =
to bar end (6/4/2), short = 1. The SL members are William's short-long
rhythms (quarter + dotted half on 1, etc.) — there is no separate
short-long family.

**D. Whole notes** (`whole`, 3, long only): prime `[0]`/len 8,
anticipated `[-1]`/len 9, delayed `[1]`/len 7.

**E. Rest bar** (`rest`, 1): `cells: []`. Read-and-play only; never a
hear-and-name target or distractor.

## Playback

- **Long** (len > 1) = sustain to the onset of the next hit, across barlines
  — `buildHits` sorts the flattened pass and clips every hit at the next
  onset minus the 0.04 gap. `len` does not set the sounding length; this is
  what lets pads ring through late-starting bars and rest bars. The last
  long of a pass rings to the end of the pass or its notated end, whichever
  is later (the open-tie "and" of 4 rings two beats past the loop point).
- **Short** (len 1) = the clipped eighth, on-beat quarters included.
- Each pass is scheduled one beat early (beat 4 of the preceding bar) so
  pickups land before beat 1. Anticipated whole notes and second-half
  anticipated Charlestons rely on this.

## Phrase generator — hard constraints

Redraw the offending bar on violation (cap ~20 tries, then fall back to a
prime first-half Charleston LL):

1. No pickup (first cell `-1`) after a bar whose last sounding cell is `7`.
2. After a second-half delayed Charleston `[5,8]`, the next bar may not hit
   cell `0` or `-1`.
3. The last bar of a phrase is never a second-half delayed Charleston (its
   beat-1 hit would land on the loop wrap).
4. Rest bars: at most one in any 4 bars, never two in a row, never the first
   bar. (At "every 2/4" a rest would repeat and break this, so rests only
   appear at "every bar".)

One rhythm per bar / per 2 / per 4 and "new phrase each time round" work as
before. A phrase draws only from the checked families; with nothing sounding
checked, Play is disabled with a hint.

With reshuffle on, the next phrase is **pregenerated a full pass early**
(`st.next`, seeded with the current phrase's last bar so rules 1/2 and the
no-immediate-repeat draw also hold across the pass boundary). The boundary
swaps it in; during the last bar, the read-ahead card for bar 1 shows
`st.next[0]` — the preview must always be the bar that actually plays.

## Modes

- **Read and play**: as before — phrase grid, count-in, chords/stab/silent,
  "show the next bar only", notation or eighth-note grid.
- **Hear and name**: target from the checked sounding rhythms. Four choices:
  the target plus three distractors from the same family; the whole-note
  family (only 2 other members) fills from on-beat pairs, then 1st-half,
  then 2nd-half Charleston. One same-family distractor is then swapped for
  one from a different family, so every question has exactly one outsider.
  Grids unlabeled until answered.

## Notation

Pre-rendered LilyPond cells in `RHY_SVG` (currentColor). Sources in
`notation/rh/*.ly`; `notation/rh/render.sh` renders and packs them into
`notation/rh/rhy_svg.js` — paste that between the RHY_SVG markers in
`index.html`. The full printable sheet is `notation/charleston.ly` (order:
families A–E, placements prime/delayed/anticipated resp. beats 1/2/3, shapes
LS LL SS SL).

Conventions (Argue, *Music Preparation Fundamentals*, pp. 10–11): show
beat 3 except whole note, dotted half on 1, dotted half on 2, half on a beat;
short on-beat hit = staccato quarter, short off-beat hit = eighth (+ rest);
no staccato on dotted, beat-crossing, or tie-starting notes; rests grouped
to the beat, no dotted rests; empty bar = centred whole rest. Decisions
specific to this set:

- A long hit on the "and" of 4 (2nd-half prime/anticipated LL·SL) is an
  eighth with an **open tie into the barline** (`\laissezVibrer`) — the only
  cell type that uses it.
- The second-half delayed Charleston is a **two-bar cell**: bar 1 the "and"
  of 3 (open-tied eighth if long, eighth + rest if short), bar 2 the beat-1
  hit (staccato quarter if short, plain quarter if long) then rests.
- Delayed whole note: `r8 c8~ c4~ c2` ("and" of 1 to bar end is not an
  exception). Anticipated whole note: pickup eighth tied to a whole note.
- On-beat pair beat 3 with a long second note: plain quarter on beat 4, no
  tie — its sustain past the barline is a playback fact, not a notated one.

## Architecture notes

- The chord loop is four hardcoded drop-2 top-set voicings (D-7 G7 CΔ7 CΔ7)
  from the Inversion Drill engine; this file carries no engine.
- Bar highlighting is a `setTimeout` derived from the audio clock; the grid
  itself never moves.

## Next

- Let the student pick a progression (Box Buddy parser + Voice-Leading
  Trainer chooser) instead of the fixed ii-V-I loop.
- Density control: probability of a hit per cell, for free comping beyond
  the named shapes.
