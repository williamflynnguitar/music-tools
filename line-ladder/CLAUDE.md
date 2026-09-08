# Line Ladder

Deterministic drill lines over the Handbook's practice progressions
(pp. 86–95), written with the VDA position rule (pp. 76–78) inside the scale
fingerings (pp. 6–23) and the 1-octave arpeggio shapes (pp. 25–31). The
student picks a progression, Arp or Scale mode, and a starting fingering; the
app writes the line out, engraves it (staff + TAB), shows the position on a
fretboard, and runs a metronome with count-in.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage. Root `CLAUDE.md` conventions apply, including the lookahead scheduler.
Headless tests: `node check.js` (extracts the engine from index.html, the
check-deck.js pattern; also round-trips a .ly through `lilypond` when the
binary is present).

## Formulas (per chord; every bar must sum to 4 beats — asserted)

| Length | Arp | Scale |
|---|---|---|
| 2 beats | R 3 5 7, four eighths | 1 2 3 5, four eighths |
| 4 beats | R 3 5 eighths on 1 & 2; 7 on the & of 2, held to the barline (written 8~2 so beat 3 shows) | 1–6 as eighths on 1–3&; 7 a quarter on beat 4 |
| 8 beats | 4-beat bar, then 7 5 3 on 1 & 2, R on the & of 2 held (7 struck twice) | 1–8 as eighths; then 9 8 7 6 5 4 eighths, 3 a quarter on beat 4 |
| 12 beats | 8-unit + 4-unit *(assumption — confirm with William)* | same *(assumption)* |
| 16 beats | 8-unit twice *(assumption)* | same *(assumption)* |

º7 chords use the Arp formula in both modes. Degrees are chord-relative
(Arp: the quality's chord tones; Scale: indexes into the chord's scale,
8/9 = octave and the 2nd above).

**Stepwise approach** (Arp mode toggle, off by default): a held note (the
8~2 at a 4- or 8-beat unit's end) shortens to 8~4 — held through beat 3
only — and beat 4 walks down the chord's scale in two eighths into the next
chord's first note (D-7: C held, B A into G7's G; G7: F held, E D into C).
Applied wherever the target sits exactly three scale steps below the held
note. Passing tones come from the region placement when it holds them (the
diatonic case); otherwise from the chord's own scale, in the fingering
nearest the frets under the hand — so secondary dominants and a tune's
†-chords approach too (A-7 walks F# E into D7 even when the region is F
dorian). With the toggle on, the arp octave choice is approach-aware: among
in-window shapes a chord prefers the one whose held note can reach an
in-window root of the next chord, which moves the register wrap that a
12-key cycle forces in a fixed position to the key seam (roots repeat
there, no approach anyway) instead of mid-key. ~23% of ii/V seams in the
whole-step cycles still wrap — the position simply holds no connectable
octave pair — and those bars keep the tie; check.js proves every placeable
approach is applied and that the cycles connect at 75%+ of seams.
Descending only; no approach out of the last chord (loop playback is a
playback option, the engraving is one line).

## Chord scales

One rule: **parent scale rotated to start on the chord root.**
- Major-key annotation `{key, mode:"major", degree}` → parent major of the
  key; labels use mode names (1 → "C major", 2 → Dorian, 5 → Mixolydian …).
- Minor-key annotation → parent harmonic minor of i; degrees 2 (ø7) and
  5 (7♭9) are labeled "G Phrygian dominant (V of C minor)" — same notes,
  the book's name for them.
- `fn:"sec"` (secondary/non-diatonic dominants) → own Mixolydian; with a ♭9,
  own Phrygian dominant *(assumption — confirm)*.
- No annotation → quality-only fallback (Δ7 → major, -7 → Dorian,
  7 → Mixolydian, 7♭9 → Phrygian dominant, ø7 → Phrygian dominant rooted a
  P4 above, -6/-Δ7 → own harmonic minor *(assumption)*) and the bar is
  flagged † so William can annotate later. The leadsheets (pp. 109–123) are
  entirely fallback-annotated at present.
- A degree annotation that contradicts the chord root also falls back and
  flags.

## Position logic (VDA; HDA is a v2 stub — `hdaStub`)

- Region = the current parent scale + key. The starting fingering (1–6 =
  the scale's cycle order P6…I5) places the first region; a new diatonic
  key/mode picks the new parent's fingering whose fret window overlaps the
  old one most.
- Diatonic chords: choose the root octave whose full run (R→5/7/9 by length)
  exists in the region placement's notes; octave chosen nearest the previous
  chord's root (first chord: lowest). If none fits, try the adjacent
  fingering (±1 in the placements sorted by window) — never more than one
  shift per chord, and the region itself doesn't move.
- Secondary/fallback chords: the chord's own scale (`SCALES` has fingerings
  for all of them), placed by best window overlap with the region.
- Arp mode and º7: 1-octave `ARP` shape of the quality whose root sits in
  the window; scored VDA-style (≤2 notes outside window±1, prefer inside,
  tie-break notes shared with the region placement). -6 chords borrow the
  -Δ7 shape (harmonic-minor tonic; the book has no -6 arpeggio page) and
  plain 6 borrows Δ7 — both *(assumption)*.
- Every output note carries `{string, fret, finger}` straight from the
  fingering/shape data; nothing is computed.
- **Octave cap** (toggle, off by default, both modes): after the line is
  built, any chord with a note above the 12th fret is re-placed — first as a
  true octave drop (marked ↓8: arp shapes rerooted at −12, scale runs refit
  into whichever fingering of the same scale holds them under fret 12), and
  where the pitch is already too low to drop (an Eb3 played at the 13th
  fret), the same pitches are refingered low instead (marked ↓pos). With the
  cap on, nothing in any progression exceeds fret 12 — asserted across every
  progression × mode × fingering in check.js. Runs before the approach pass
  so approaches target the dropped notes; panels and labels follow.

## Data

- Shared `SCALES` block, byte-identical with fretboard/scales-deck/
  arpeggios-deck (this is a 4th copy — root CLAUDE.md updated).
- `ARP1` = the seven 7th-chord qualities of `ARP[1]` from arpeggios-deck,
  copied verbatim (keep in sync if the deck's shapes change).
- `PROGRESSIONS`: chords are `{root, q, beats, ext?, fn?}`. The pp. 87–90
  cycles are generated with annotations built in; blues and rhythm changes
  are written out annotated; the 14 leadsheets are the inversion-drill
  `TUNES` texts run through the Box Buddy parser at load (adjacent
  identical whole bars merge to 8/12/16-beat chords, matching the
  two-bars-of-I in the printed cycles).

## Engraving

The brief pointed at an "Improv Blocks" engraver that does not exist in this
repo; `engrave()` here is new, built on the `notate()` glyph system
(LilyPond Feta outlines in `NOTE_DEFS`, same unit grid: 1 staff space = 1).
Argue rules: 4-bar systems, eighths beamed in fours from beats 1 and 3, the
held 7th written 8~2 so beat 3 shows, chord symbols left-aligned to their
beat (Δ for major 7, superscript suffixes), a bar number under every bar,
numeric 4/4, treble_8 staff + TAB, fingerings above the staff. Current-bar
highlight is a background rect per bar — no moving element. The chart sits
in a scrolling window two systems tall (`sizeChart`) — the playing system
plus the next, so the eye reads ahead; playback jumps the window a system at
a time (an instant jump, not a crawl, per the restrained-motion rule), and
it scrolls freely by hand when stopped. "LilyPond
source" copies a .ly (same rules, `\accidentalStyle modern`; falls back to
downloading when the clipboard API is unavailable).

## Metronome

Voice-leading scheduler verbatim (25 ms interval / 130 ms lookahead): clicks
on 2 and 4, count-in of 0/1/2 bars as quarter clicks (bar starts accented),
optional loop. Bar highlight + fretboard advance are `setTimeout`s derived
from the scheduled audio time. The line itself is not sounded — metronome
only, per the brief.

## Open questions for William

The *(assumption)* marks above: 12/16-beat formula shapes, secondary-dominant
scales, -6 → harmonic minor and the -6/6 arpeggio-shape borrowing; plus the
leadsheet annotations (all flagged † in the UI until annotated).
