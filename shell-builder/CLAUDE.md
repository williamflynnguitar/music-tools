# Shell Voicing Builder

Practice tool for the "Shell Voicings 101" chapter of the Jazz Guitar Technique
Handbook (pp. 45–51). Students construct shell voicings by rule, mobilize the
B and E strings, and see the chord that results. Companion to Box Buddy, which
uses the same engine to generate handouts.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage (quiz streaks live in memory only). Follows the root `CLAUDE.md`
visual conventions.

## What it teaches
- The string roles: roots on E/A, 3rds and 7ths on D/G, extensions on B/E.
- 6R vs 5R (which of 3/7 sits on the D string flips).
- The five structures (p. 50 to-do list), in order: 3-note with root,
  4-note with root, 2-note rootless, 3-note rootless, 4-note rootless.
- Mobilization: B string ±2 frets, E string +2/−1 (we allow +3 so a 6R
  dominant can reach #9), and what each move produces.
- The allowed-extension list per quality (p. 49), with dominants split into
  unaltered and altered.
- The "black diamond" convention: in rootless structures the root is drawn
  as a diamond where it used to be, to be visualized, not played.

## Architecture
- `QUAL` / `DEG` / `nearestFret`: same engine as Box Buddy. Keep them in sync.
- `buildVoicing(state)`: computes the voicing from root, root string,
  quality, structure, and per-string fret offsets from the defaults.
- `degName(offset, quality)`: names a semitone offset above the root in
  context (3 semitones is b3 on minor qualities, #9 otherwise; 8 is #5 on
  dominants and augmented chords, b13 elsewhere; 9 is 6 on 6th chords).
- `nameChord(root, quality, degrees)`: Handbook-style symbols (^7, -7, ø7,
  °7). Climbs 7→9→11→13 where idiomatic (13 needs a 9 except on dominants;
  11 needs a 9 except on minor qualities), 6th chords become 6/9, remaining
  alterations are appended, other naturals go in parentheses.
- `judge(voicing, state)`: one message per mobile string: doubling a middle-
  string tone (warn), extension not on the list (bad), altered dominant
  (ok), the Handbook's b3-on-B 5R shape for ø7/°7 (ok). The readout shows
  the most serious one.
- Reference panel is computed live from the engine (mobilization tables show
  the actual fret and resulting degree for the current chord), so it can't
  drift from the diagram.
- Quiz: random root/root string/quality/structure (3- or 4-note rootless)
  with random legal offsets; four choices, distractors are other legal
  voicings on the same root. "Hard" adds altered dominants, 6th chords and
  minor-major. Dots are unlabeled until answered.

## Through changes (added)
- Third mode: the current structure through the Handbook's practice progressions
  (pp. 86–95) and the leadsheets (pp. 109–123), or a pasted chart. The
  progressions/tunes table and the chord parser are copied from Inversion Drill
  between `===== progressions ===== ` markers — keep byte-identical.
- `buildAt(pc, quality, structure, rs, rf, off)` is `buildVoicing` parameterized
  by explicit root fret; `buildVoicing` still picks the lowest position.
- Voice leading: each root takes 6R or 5R and the octave whose root fret moves
  least from the previous chord (`progVoiceLead`); travelling extra frets is
  accepted when it is the only way to voice a requested alteration
  (`pickOffsets` — e.g. b9 only exists on the 5R B string, so G7b9 goes 5R).
  Alterations in the symbol go to B/E via legal offsets when the structure has
  those strings; unreachable ones stay in the label only.
- Rendered as a slash chart (4-bar systems, symbols above their beats, shell
  diagram with ghost roots above each symbol, 6R/5R + fret tag). `diagram()`
  gained a `W` option that scales the drawing; small sizes drop labels.
- Audio: one-shot strum on click (chart chords and the Build/quiz diagram);
  not a time reference, so no lookahead scheduler.

## Mobilization windows (Sep 2026)
There is no per-quality extension-availability table: what the +/− controls
can reach is emergent from the default B/E-string degree plus the fret
window. The B window is ±2 frets around the root's fret (where the 5th
sits). The 6R dominant's default (13) sits two frets *above* the root's
fret, so its stored offsets run −4..+2 (`v.bDef==='13'` in `move`,
`mobTable`, `pickOffsets`) — with plain ±2-from-default, #11 was
unreachable on 6R dominants entirely. Walk-down: 13→#5→5→#11→11.
Still unreachable, RULED book-faithful (pp. 49–50 verified): natural 11
on 5R minor-family qualities (m7/m6/mMaj7), and #11 on 5R dominants in
structures without the E string — outside the book's printed windows,
leave them be.

## Mobile through-changes (Sep 2026)
`body.prog-on .app` outranks `.app`'s own media query, so it needs its own
narrow-viewport override or phones keep the 300px sidebar. Below 560px the
chart goes one bar per line so two-chord bars keep two full-size shells
side by side and still read as one bar (beat row underneath). The same
treatment lives in Inversion Drill (`.sys`) and Box Buddy (`.chart`,
screen-only so printed handouts keep 4-bar systems).

## Next
- Extension Quiz variant where the student must *build* a named chord.

## Doubled 7th (Sep 2026 D-review)
William reviewed all 12 reachable doubled-7th cells (D1–D12). judge() now
treats a mobile-string 7th double (pc match, so 6-chords' 6 counts) as a
first-class option — k:'ok', "doubles the … — a legitimate thickening of
the shell" — with one exception: m7 from 5R (E +3) keeps the caution, per
his "isn't really playable but leave it in". The two cells he ruled
unplayable are removed from the walk instead: °7 and Δ7#5 from 5R cap the
E string at +2 (move, mobTable, pickOffsets). Doubled 3rds keep their
existing caution. The °7 bb7-labeled-"13" mislabel is moot — the only
position that produced it is the removed °7 5R E+3. The E reference
table now shows the +3 row where it is walkable (it was always walkable
but never displayed).
